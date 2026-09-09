/**
 * Beacon Isle's game logic — two custom behaviors on top of engine built-ins.
 *
 *   IsleDirector — the quest brain: keeper dialogue, TERRAIN-NAV shade AI
 *                  (buildTerrainNav + findPath: patrol rings around each ward,
 *                  hunt the player across the island surface), ward relighting,
 *                  win fireworks, death/respawn.
 *   SwordStrike  — the melee-clip strike from Emberwood, retargeted at shades.
 *
 * Movement/camera/animations, NPC proximity, dialogue, HUD, touch controls,
 * contact damage — all engine surface declared in game.scene.json.
 */
import type {
  AudioPlayer,
  Engine,
  JsonObject,
  Node,
  UiBanner,
  UiDialogue,
  UiText,
  Voice,
} from 'incanto';
import { Behavior, findPath } from 'incanto';
import type { Camera3D, MeshInstance3D, Node3D, Terrain3D, Trail3D } from 'incanto/3d';
import { buildTerrainNav, Particles3D, type TerrainNav } from 'incanto/3d';
import { type DayNight, goToScene } from 'incanto/gameplay';
import gameJsonRaw from './game.scene.json';

const gameJson = gameJsonRaw as unknown as JsonObject;

/** Cross-respawn quest state (module singleton survives goToScene). */
export const quest = {
  accepted: false,
  lit: new Set<number>(),
  bossRisen: false,
  bossDown: false,
  done: false,
};
export function resetQuest(): void {
  quest.accepted = false;
  quest.lit.clear();
  quest.bossRisen = false;
  quest.bossDown = false;
  quest.done = false;
}

interface Positioned {
  position: number[];
}

const AGGRO = 9;
const CALM = 13;
const PATROL_SPEED = 2.6;
const HUNT_SPEED = 3.6;
const WARD_LIGHT_RANGE = 4;

/** Sprint feel — see sprintFeel(): FOV kick + per-stride dust. */
const FOV_BASE = 60;
const FOV_SPRINT = 66.5;
const STRIDE_SECONDS = 0.22;

/**
 * One kicked-up earth puff, world-anchored at the foot spot (one-shot,
 * self-removing). Non-additive expanding dust — NOT a glow: it reads as
 * dirt leaving the ground, then thins out.
 */
function spawnFootDust(root: Node, at: [number, number, number], scale = 1): void {
  const puff = new Particles3D('FootDust');
  puff.position = [at[0], at[1], at[2]];
  puff.rate = 0;
  puff.burst = Math.round(4 * scale);
  puff.blend = 'normal';
  puff.lifetime = [0.3, 0.5];
  puff.speed = [8, 34];
  puff.directionDeg = -90; // up out of the ground…
  puff.spreadDeg = 75;
  puff.gravity = [0, 30]; // …then settle back down
  puff.drag = 2.5;
  puff.sizeStart = 11 * scale;
  puff.sizeEnd = 30 * scale; // dust EXPANDS as it dissipates
  puff.colorStart = '#c2b394'; // dry peat kicked into the dusk light
  puff.colorEnd = '#8a7c66';
  puff.alphaStart = 0.24;
  puff.alphaEnd = 0;
  puff.maxParticles = 24;
  puff.on('finished', () => puff.free());
  root.addChild(puff);
}

export class IsleDirector extends Behavior {
  /**
   * The isle HAS an ending, and never said so.
   *
   * Three wards lit, the Shadeheart down, fireworks over the lighthouse and
   * `BEACON ISLE SHINES` on the banner — and no `won` anywhere, so every
   * instrument that asks the scene whether it is finishable answered no. On
   * the template `bunx incanto-new my-game` scaffolds by DEFAULT:
   *
   * ```
   * ? plays — nothing declares a win — 8 runs played without a defect,
   *           and there was no end to reach
   * next: if it is meant to be finishable, emit `won`
   * ```
   *
   * Both sentences were true about the WIRING and wrong about the game. A
   * signal is the cheapest of the three routes the skill offers (`GameFlow`,
   * `ScoreKeeper`, your own behaviour) and the only one that does not also
   * freeze the world — the isle keeps playing after you win it.
   */
  static readonly signals: readonly string[] = ['won'];

  private wind: Voice | null = null;
  private nav: TerrainNav | null = null;
  private repathClock = 0;
  private hunting = new Set<string>();
  private respawnIn = 0;
  private bobClock = 0;
  private fireworksIn = -1;
  private glideActive = false;
  private strideClock = 0;
  private wasAirborne = false;
  private fov = FOV_BASE;

  private get dialogue(): UiDialogue {
    return this.node.getNode('HUD/Dialogue') as UiDialogue;
  }

  override onReady(): void {
    const engine = this.node.tree?.engine;
    this.wind = engine?.sfx.startVoice('wind', 0.7) ?? null;
    const surface = this.node.getNode('Terrain/Ground/Surface') as Terrain3D;
    const sea = this.node.getNode('Terrain/Sea') as unknown as Positioned;
    this.nav = buildTerrainNav(surface, {
      cellSize: 3,
      maxSlopeDeg: 38,
      minHeight: (sea.position[1] ?? 0) + 0.6,
    });
    this.assignPatrols();
    this.syncQuestLine();
    this.dialogue.on('choiceMade', (index) => {
      if (index === 0 && !quest.accepted) {
        quest.accepted = true;
        (this.node.getNode('Keeper/AcceptSfx') as AudioPlayer).play();
        this.syncQuestLine();
      }
    });
    // rebuild already-lit wards after a respawn
    for (const i of quest.lit) this.applyWardLit(i, false);
  }

  override onExitTree(): void {
    this.wind?.stop();
  }

  /** Ring patrols AROUND each ward, on the island surface. */
  private assignPatrols(): void {
    const nav = this.nav;
    if (!nav) return;
    for (const node of this.node.tree?.getNodesInGroup('shade') ?? []) {
      const shade = node as Node3D;
      const wardIdx = wardOf(shade);
      const ward = this.node.getNodeOrNull(`Ward${wardIdx}`) as unknown as Positioned | null;
      if (!ward) continue;
      const [wx, , wz] = ward.position;
      const [sx, , sz] = shade.position;
      const from = nav.toCell(sx ?? 0, sz ?? 0);
      const to = nav.toCell((wx ?? 0) - 8, (wz ?? 0) + 7);
      const out = findPath(nav.grid, from, to, { diagonal: false });
      if (!out || out.length < 2) continue;
      const ring = [...out, ...out.slice(1, -1).reverse()];
      const follow = shade.behavior as unknown as { setPath(w: number[][]): void; loop: boolean };
      follow.loop = true;
      follow.setPath(ring.map(([cx, cy]) => hover(nav.toWorld(cx, cy))));
    }
  }

  override update(dt: number): void {
    const engine = this.node.tree?.engine;
    this.ambient(dt, engine);
    this.huntOrPatrol(dt);
    this.syncHp();
    this.checkWards();
    this.driveTimeOfDay(dt);
    this.bossBrain(dt);
    this.glide(engine);
    if (engine && this.dialogue.active && engine.input.justPressed('interact')) {
      this.dialogue.advance();
    }
    if (this.respawnIn > 0) {
      this.respawnIn -= dt;
      if (this.respawnIn <= 0 && engine) goToScene(engine, gameJson, { fadeSeconds: 0.6 });
    }
    if (this.fireworksIn >= 0) {
      this.fireworksIn -= dt;
      if (this.fireworksIn < 0) this.launchFireworks();
    }
  }

  /**
   * Sprint FEEL — speed you can see instead of a ribbon glued to the hips:
   * - a soft camera FOV kick while at full sprint (eased both ways)
   * - kicked-up earth at the feet, one puff per stride
   * - a bigger thump-puff on landing after airtime (jump or glide)
   */
  private sprintFeel(dt: number, state: string): void {
    const camera = this.node.getNodeOrNull('Camera') as Camera3D | null;
    if (camera) {
      const target = state === 'fastRun' ? FOV_SPRINT : FOV_BASE;
      this.fov += (target - this.fov) * Math.min(1, dt * 6);
      camera.fov = this.fov;
    }
    const player = this.node.getNodeOrNull('Player') as (Node3D & Positioned) | null;
    if (!player) return;
    const [px, py, pz] = player.position;
    const feet: [number, number, number] = [px ?? 0, (py ?? 0) - 0.62, pz ?? 0];
    const airborne = state === 'airborne';
    if (this.wasAirborne && !airborne) spawnFootDust(this.node, feet, 1.7); // landing thump
    this.wasAirborne = airborne;
    if (state === 'fastRun') {
      this.strideClock -= dt;
      if (this.strideClock <= 0) {
        this.strideClock = STRIDE_SECONDS;
        spawnFootDust(this.node, feet);
      }
    } else {
      this.strideClock = 0;
    }
  }

  private ambient(dt: number, engine: Engine | null | undefined): void {
    const controller = this.node.getNode('Player/Controller') as unknown as {
      state: string;
    } | null;
    if (controller && this.wind && engine) {
      const w =
        controller.state === 'fastRun'
          ? { pitch: 1.5, volume: 0.5 }
          : controller.state === 'run'
            ? { pitch: 1.15, volume: 0.34 }
            : { pitch: 0.85, volume: 0.2 };
      this.wind.set(w);
    }
    if (controller) this.sprintFeel(dt, controller.state);
    // shades hover-bob and face their travel
    this.bobClock += dt;
    for (const node of this.node.tree?.getNodesInGroup('shade') ?? []) {
      const shade = node as Node3D & { _lastPos?: number[] };
      const body = shade.getNodeOrNull('Body') as Node3D | null;
      if (body)
        body.position = [0, 0.12 * Math.sin(this.bobClock * 2.4 + (shade.position[0] ?? 0)), 0];
      const [x, , z] = shade.position;
      const last = shade._lastPos ?? [x ?? 0, 0, z ?? 0];
      const dx = (x ?? 0) - (last[0] ?? 0);
      const dz = (z ?? 0) - (last[2] ?? 0);
      if (dx * dx + dz * dz > 1e-8) shade.rotation = [0, (Math.atan2(dx, dz) * 180) / Math.PI, 0];
      shade._lastPos = [x ?? 0, 0, z ?? 0];
    }
  }

  /** Shades hunt across the ISLAND: findPath re-pathing on the terrain nav. */
  private huntOrPatrol(dt: number): void {
    this.repathClock -= dt;
    if (this.repathClock > 0) return;
    this.repathClock = 0.4;
    const nav = this.nav;
    const player = this.node.getNodeOrNull('Player') as unknown as Positioned | null;
    if (!nav || !player) return;
    const [px, , pz] = player.position;
    for (const node of this.node.tree?.getNodesInGroup('shade') ?? []) {
      const shade = node as Node3D;
      const follow = shade.behavior as unknown as {
        setPath(w: number[][]): void;
        loop: boolean;
        speed: number;
      };
      const [sx, , sz] = shade.position;
      const dist = Math.hypot((px ?? 0) - (sx ?? 0), (pz ?? 0) - (sz ?? 0));
      const was = this.hunting.has(shade.name);
      if (dist < (was ? CALM : AGGRO)) {
        if (!was) {
          this.hunting.add(shade.name);
          (shade.getNodeOrNull('HissSfx') as AudioPlayer | null)?.play();
        }
        const cells = findPath(
          nav.grid,
          nav.toCell(sx ?? 0, sz ?? 0),
          nav.toCell(px ?? 0, pz ?? 0),
          {
            diagonal: false,
          },
        );
        if (cells && cells.length > 1) {
          follow.loop = false;
          follow.speed = HUNT_SPEED;
          follow.setPath(cells.slice(1).map(([cx, cy]) => hover(nav.toWorld(cx, cy))));
        }
      } else if (was) {
        this.hunting.delete(shade.name);
        follow.speed = PATROL_SPEED;
      }
    }
    // drifting hunters that lost aggro pick their patrol back up
    if (this.hunting.size === 0) return;
  }

  private syncHp(): void {
    const health = this.node.getNodeOrNull('Player')?.behavior as unknown as {
      current: number;
      max: number;
    } | null;
    const bar = this.node.getNode('HUD/HP') as unknown as { value: number; max: number };
    if (health) {
      bar.value = health.current;
      bar.max = health.max;
    }
  }

  /** The island's clock is the QUEST: dusk deepens toward night while wards
   *  are dark, each lit ward pulls the light back, victory brings morning. */
  private driveTimeOfDay(dt: number): void {
    const sky = this.node.getNodeOrNull('Sky')?.behavior as DayNight | null;
    if (!sky) return;
    // ATMOSPHERE RULE: keep the sun ABOVE the horizon — below it the sky
    // (and its IBL) go black and no ambient floor can save the frame.
    const targetHour = quest.done
      ? 9.5 // morning after the fireworks
      : quest.bossDown
        ? 8.7
        : quest.bossRisen
          ? 17.8 // sun ~+2 deg — deep red horizon, still lit (below 18 the sky dies)
          : 17.25 - quest.lit.size * 0.4; // each ward buys back the light
    sky.hour += (targetHour - sky.hour) * Math.min(1, dt * 0.4);
  }

  /** The Shadeheart: rises when the third ward lights, hunts via the same
   *  terrain nav, falls after five strikes (SwordStrike counts them). */
  private bossBrain(dt: number): void {
    const boss = this.node.getNodeOrNull('Boss') as Node3D | null;
    if (!boss) return;
    if (!quest.bossRisen || quest.bossDown) return;
    if (!boss.visible) {
      boss.visible = true;
      (boss.getNode('EyeGlow') as unknown as { intensity: number }).intensity = 7;
      (boss.getNode('Dread') as Trail3D).emitting = true;
      (boss.getNode('RoarSfx') as AudioPlayer).play();
      (this.node.getNode('HUD/Banner') as UiBanner).show('THE SHADEHEART RISES');
    }
    // slow relentless pursuit across the island (re-path with the pack timer)
    this.bossRepath -= dt;
    if (this.bossRepath > 0) return;
    this.bossRepath = 0.6;
    const nav = this.nav;
    const player = this.node.getNodeOrNull('Player') as unknown as Positioned | null;
    if (!nav || !player) return;
    const [bx, , bz] = boss.position;
    const cells = findPath(
      nav.grid,
      nav.toCell(bx ?? 0, bz ?? 0),
      nav.toCell(player.position[0] ?? 0, player.position[2] ?? 0),
      { diagonal: false },
    );
    if (cells && cells.length > 1) {
      const follow = boss.behavior as unknown as { setPath(w: number[][]): void };
      follow.setPath(cells.slice(1).map(([cx, cy]) => nav.toWorld(cx, cy)));
    }
    // face the player
    const dx = (player.position[0] ?? 0) - (bx ?? 0);
    const dz = (player.position[2] ?? 0) - (bz ?? 0);
    if (dx * dx + dz * dz > 1) boss.rotation = [0, (Math.atan2(dx, dz) * 180) / Math.PI, 0];
  }

  private bossRepath = 0;

  /** Hold JUMP while falling to glide — soft descent + a little forward push. */
  private glide(engine: Engine | null | undefined): void {
    const player = this.node.getNodeOrNull('Player') as unknown as
      | (Node & Positioned & { linearVelocity: number[] })
      | null;
    const controller = this.node.getNodeOrNull('Player/Controller') as unknown as {
      state: string;
    } | null;
    const dash = this.node.getNodeOrNull('Player/DashTrail') as Trail3D | null;
    if (!engine || !player || !controller) return;
    const falling = controller.state === 'airborne' && (player.linearVelocity[1] ?? 0) < -1;
    const wantGlide = falling && engine.input.isPressed('jump');
    if (wantGlide) {
      const v = player.linearVelocity;
      player.linearVelocity = [(v[0] ?? 0) * 1.01, Math.max(v[1] ?? 0, -1.6), (v[2] ?? 0) * 1.01];
      if (!this.glideActive && dash) dash.emitting = true;
      this.glideActive = true;
    } else if (this.glideActive) {
      this.glideActive = false;
    }
  }

  /** Standing at a DARK ward with its shades down + pressing E relights it. */
  private checkWards(): void {
    const engine = this.node.tree?.engine;
    if (!engine || !quest.accepted || !engine.input.justPressed('interact')) return;
    const player = this.node.getNode('Player') as unknown as Positioned;
    const [px, , pz] = player.position;
    for (let i = 1; i <= 3; i++) {
      if (quest.lit.has(i)) continue;
      const ward = this.node.getNodeOrNull(`Ward${i}`) as unknown as (Node & Positioned) | null;
      if (!ward) continue;
      const [wx, , wz] = ward.position;
      if (Math.hypot((wx ?? 0) - (px ?? 0), (wz ?? 0) - (pz ?? 0)) > WARD_LIGHT_RANGE) continue;
      const guards = this.node.tree?.getNodesInGroup(`shade-ward${i}`) ?? [];
      if (guards.length > 0) {
        if (!this.dialogue.active) {
          this.dialogue.say('???', 'The shades cling to this ward — drive them off first.');
        }
        return;
      }
      quest.lit.add(i);
      this.applyWardLit(i, true);
      if (quest.lit.size === 3 && !quest.bossDown) {
        quest.bossRisen = true; // the Shadeheart answers the light
      }
      this.syncQuestLine();
      return;
    }
  }

  private applyWardLit(i: number, celebrate: boolean): void {
    const ward = this.node.getNodeOrNull(`Ward${i}`);
    if (!ward) return;
    const crystal = ward.getNode('Crystal') as MeshInstance3D;
    crystal.material = { ...crystal.material, emissiveIntensity: 2.6 };
    (ward.getNode('Glow') as unknown as { intensity: number }).intensity = 2.4;
    if (celebrate) {
      (ward.getNode('LitFx') as Particles3D).replay();
      (ward.getNode('ChimeSfx') as AudioPlayer).play();
    }
  }

  private syncQuestLine(): void {
    const quest3 = this.node.getNode('HUD/Quest') as UiText;
    if (quest.done) quest3.text = 'The isle is safe. The lighthouse burns bright.';
    else if (quest.bossDown) quest3.text = 'Return to the keeper [E]';
    else if (quest.bossRisen) quest3.text = 'SLAY THE SHADEHEART — 5 strikes';
    else if (quest.accepted) quest3.text = `Relight the ancient wards — ${quest.lit.size}/3 lit`;
    else quest3.text = 'Find the lighthouse keeper [E]';
  }

  /** Keeper.interacted → here. */
  onTalk(): void {
    const talk = this.dialogue;
    if (talk.active) return;
    (this.node.getNode('Keeper/TalkSfx') as AudioPlayer).play();
    if (quest.done) {
      talk.say('Keeper', 'The wards hold. Sleep easy, wardlighter.');
      return;
    }
    if (quest.bossRisen && !quest.bossDown) {
      talk.say('Keeper', 'The Shadeheart itself?! Your blade, wardlighter — five true strikes!');
      return;
    }
    if (quest.bossDown) {
      quest.done = true;
      talk.say('Keeper', 'The three lights... the isle breathes again!');
      talk.say('Keeper', 'You have my thanks — and the isle has its WARDLIGHTER.');
      talk.on('dialogueFinished', () => {
        if (!quest.done) return;
        (this.node.getNode('HUD/Banner') as UiBanner).show('BEACON ISLE SHINES');
        (this.node.getNode('WinSfx') as AudioPlayer).play();
        this.fireworksIn = 0.4;
        this.syncQuestLine();
        this.node.emit('won');
      });
      return;
    }
    if (quest.accepted) {
      talk.say(
        'Keeper',
        `${3 - quest.lit.size} ward(s) still dark. The shades guard them — your blade knows what to do.`,
      );
      return;
    }
    talk.say('Keeper', 'Traveler! The three ancient wards went dark last night...');
    talk.say(
      'Keeper',
      'Shades gather where the light died. Drive them off and relight the wards?',
      ['I will light them', 'Not yet'],
    );
  }

  /** Player.died → here. */
  onPlayerDown(): void {
    if (this.respawnIn > 0) return;
    this.respawnIn = 1.6;
    (this.node.getNode('HUD/Banner') as UiBanner).show('THE SHADES TOOK YOU');
  }

  /** The win moment: staggered firework bursts over the lighthouse. */
  private launchFireworks(): void {
    const anchor = this.node.getNodeOrNull('Lighthouse') as unknown as Positioned | null;
    const [lx, ly, lz] = anchor?.position ?? [0, 20, 0];
    const colors = ['#ff6b6b', '#ffd166', '#6be3ff', '#b78bff'];
    colors.forEach((color, i) => {
      const poof = new Particles3D(`Firework${i}`);
      poof.position = [(lx ?? 0) + (i - 1.5) * 4, (ly ?? 0) + 16 + (i % 2) * 3, lz ?? 0];
      poof.preset = 'explosion';
      poof.rate = 0;
      poof.burst = 60;
      poof.blend = 'add';
      poof.sizeStart = 96;
      poof.sizeEnd = 18;
      poof.colorStart = color;
      poof.renderOrder = 100;
      poof.on('finished', () => poof.free());
      this.node.addChild(poof);
    });
  }
}

/** Ward index from a shade's group tag (`shade-ward2` → 2). */
function wardOf(shade: Node): number {
  for (const g of shade.groups) {
    const m = /^shade-ward(\d)$/.exec(g);
    if (m) return Number(m[1]);
  }
  return 1;
}

/** Shades float: waypoints ride the surface + a hover offset. */
function hover([x, y, z]: [number, number, number]): number[] {
  return [x, y + 0.9, z];
}

// ---- SwordStrike (Emberwood's melee, retargeted at shades) -------------------------

const SWING_SECONDS = 0.55;
const STRIKE_RANGE = 2.6;

interface AnimatedSkin {
  animationUpper: string;
}

export class SwordStrike extends Behavior {
  private swinging = 0;
  private pendingKill: Node | null = null;

  private get player(): Node & Positioned {
    return this.node.parent as unknown as Node & Positioned;
  }

  private get skin(): (Node & AnimatedSkin) | null {
    return this.player.getNodeOrNull('Skin') as unknown as (Node & AnimatedSkin) | null;
  }

  override update(dt: number): void {
    const engine = this.node.tree?.engine;
    if (!engine) return;
    const trail = this.player.getNodeOrNull('SwordMount/SwordTip/SwingTrail') as Trail3D | null;
    if (!trail) return;
    if (this.swinging > 0) {
      this.swinging -= dt;
      const t = 1 - Math.max(0, this.swinging) / SWING_SECONDS;
      if (this.pendingKill && t >= 0.5) this.fell(this.pendingKill);
      if (this.swinging <= 0) trail.emitting = false;
      return;
    }
    if (!engine.input.justPressed('attack')) return;
    this.swinging = SWING_SECONDS;
    trail.emitting = true;
    const skin = this.skin;
    // UPPER-BODY layer: the attack plays from the spine up while the legs
    // keep running — one-shots auto-clear when the clip ends.
    if (skin) skin.animationUpper = '$anims/attack';
    (this.player.getNode('SwingSfx') as AudioPlayer).play();
    this.pendingKill = this.nearestShade();
  }

  private nearestShade(): Node | null {
    const [px, , pz] = this.player.position;
    let best: Node | null = null;
    let bestD = STRIKE_RANGE;
    for (const group of ['shade', 'boss'] as const) {
      const reach = group === 'boss' ? STRIKE_RANGE + 1.6 : STRIKE_RANGE; // it is LARGE
      for (const foe of this.node.tree?.getNodesInGroup(group) ?? []) {
        if (group === 'boss' && !(foe as unknown as { visible: boolean }).visible) continue;
        const [sx, , sz] = (foe as unknown as Positioned).position;
        const d = Math.hypot((sx ?? 0) - (px ?? 0), (sz ?? 0) - (pz ?? 0));
        if (d < (group === 'boss' ? reach : bestD)) {
          bestD = d;
          best = foe;
          if (group === 'boss') return foe; // the boss takes strike priority
        }
      }
    }
    return best;
  }

  private fell(shade: Node): void {
    this.pendingKill = null;
    if (!shade.tree) return;
    const at = (shade as unknown as Positioned).position;
    (this.player.getNode('HitSfx') as AudioPlayer).play();
    if (shade.isInGroup('boss')) {
      this.strikeBoss(shade);
      return;
    }
    const poof = new Particles3D('Dissolve');
    poof.position = [at[0] ?? 0, (at[1] ?? 0) + 0.4, at[2] ?? 0];
    poof.preset = 'magic';
    poof.rate = 0;
    poof.burst = 32;
    poof.blend = 'add';
    poof.sizeStart = 72;
    poof.sizeEnd = 14;
    poof.renderOrder = 100;
    poof.on('finished', () => poof.free());
    this.node.getRoot().addChild(poof);
    shade.free();
  }

  /** Five true strikes: flinch flash + recoil, then the fall. */
  private strikeBoss(boss: Node): void {
    const hits = (bossHits.get(boss) ?? 0) + 1;
    bossHits.set(boss, hits);
    const b = boss as unknown as Positioned & Node;
    if (hits < 5) {
      // recoil away from the player + eye flare
      const [px, , pz] = this.player.position;
      const [bx, by, bz] = b.position;
      const dx = (bx ?? 0) - (px ?? 0);
      const dz = (bz ?? 0) - (pz ?? 0);
      const len = Math.hypot(dx, dz) || 1;
      b.position = [(bx ?? 0) + (dx / len) * 1.5, by ?? 0, (bz ?? 0) + (dz / len) * 1.5];
      const glow = boss.getNodeOrNull('EyeGlow') as unknown as { intensity: number } | null;
      if (glow) glow.intensity = 3 + hits * 1.5;
      (boss.getNodeOrNull('RoarSfx') as AudioPlayer | null)?.play();
      return;
    }
    quest.bossDown = true;
    const at = b.position;
    for (let i = 0; i < 3; i++) {
      const poof = new Particles3D(`BossFall${i}`);
      poof.position = [(at[0] ?? 0) + (i - 1) * 1.5, (at[1] ?? 0) + 2 + i, at[2] ?? 0];
      poof.preset = 'explosion';
      poof.rate = 0;
      poof.burst = 50;
      poof.blend = 'add';
      poof.sizeStart = 110;
      poof.sizeEnd = 20;
      poof.renderOrder = 100;
      poof.on('finished', () => poof.free());
      this.node.getRoot().addChild(poof);
    }
    boss.free();
  }
}

/** Boss strike bookkeeping (module scope — survives behavior instances). */
const bossHits = new WeakMap<Node, number>();

export const BEHAVIORS = { IsleDirector, SwordStrike };
