/**
 * Emberwood's three custom behaviors. Everything else — third-person movement
 * + camera + declarative `animations`, proximity NPC (Interactable), wolves
 * walking their patrols (PathFollow), the dialogue box, banners and buttons —
 * is built-in engine surface wired in the scene JSONs.
 *
 *   VillageDirector — the quest brain: Elder dialogue (UiDialogue + choices),
 *                     the grove gate, the wind voice, sprint dash trail.
 *   GroveDirector   — builds the hedge maze FROM the pathfinding grid (the
 *                     grid IS the level), computes wolf patrol rings with
 *                     findPath, watches for "all wolves down".
 *   SwordStrike     — click/F: a sword arc (Trail3D burst) that fells the
 *                     nearest wolf in reach.
 */
import type {
  AudioPlayer,
  Engine,
  JsonObject,
  Node,
  UiBanner,
  UiButton,
  UiDialogue,
  UiText,
  Voice,
} from 'incanto';
import { Behavior, findPath, gridFromRows, Timer } from 'incanto';
import { mergeSolidRects, parseCells } from 'incanto/2d';
import type { Camera3D, CharacterController3D, Node3D, Trail3D } from 'incanto/3d';
import { MeshInstance3D, Particles3D, StaticBody3D } from 'incanto/3d';
import type { Health } from 'incanto/gameplay';
import { goToScene } from 'incanto/gameplay';
import groveJsonRaw from './grove.scene.json';
import { quest, resetQuest } from './quest';
import villageJsonRaw from './village.scene.json';

const groveJson = groveJsonRaw as unknown as JsonObject;
const villageJson = villageJsonRaw as unknown as JsonObject;

/** The grove maze — '#' hedge, '.' walkable. One string is the whole level:
 *  hedge colliders, wolf patrol pathfinding and spawn points all read it. */
export const GROVE_GRID = [
  '###############',
  '#.....#.......#',
  '#.###.#.#####.#',
  '#.#...#.....#.#',
  '#.#.#######.#.#',
  '#...#.....#...#',
  '#.###.###.#.###',
  '#.....#.#.....#',
  '#####.#.#.###.#',
  '#.....#...#...#',
  '###############',
] as const;

const CELL = 2; // meters per grid cell
const GRID_W = GROVE_GRID[0].length;
const GRID_H = GROVE_GRID.length;

/** Grid cell → world meters (grid centered on the origin). */
export function cellToWorld(cx: number, cy: number, y = 0): number[] {
  return [(cx - (GRID_W - 1) / 2) * CELL, y, (cy - (GRID_H - 1) / 2) * CELL];
}

// ---- helpers shared by the directors ---------------------------------------------

interface Positioned {
  position: number[];
}

function windFor(state: string): { pitch: number; volume: number } {
  switch (state) {
    case 'fastRun':
      return { pitch: 1.5, volume: 0.55 };
    case 'run':
      return { pitch: 1.2, volume: 0.35 };
    case 'walk':
      return { pitch: 1.0, volume: 0.25 };
    default:
      return { pitch: 0.85, volume: 0.15 };
  }
}

/** Sprint feel — see sprintFeel(): FOV kick + per-stride dust. */
const FOV_BASE = 60;
const FOV_SPRINT = 66.5;
const STRIDE_SECONDS = 0.22;

/**
 * One kicked-up dirt puff, world-anchored at the foot spot (one-shot,
 * self-removing). Non-additive expanding dust — it reads as path dirt
 * leaving the ground, then thins out.
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
  puff.colorStart = '#d3bd97'; // the packed path dirt, sunlit
  puff.colorEnd = '#a08c6e';
  puff.alphaStart = 0.24;
  puff.alphaEnd = 0;
  puff.maxParticles = 24;
  puff.on('finished', () => puff.free());
  root.addChild(puff);
}

/** Module-scope sprint-feel state (both directors share ambientUpdate). */
const sprint = { strideClock: 0, wasAirborne: false, fov: FOV_BASE };

/**
 * Wind ambience + sprint FEEL — speed you can see instead of a ribbon glued
 * to the hips: a soft camera FOV kick at full sprint, kicked-up dirt at the
 * feet each stride, and a bigger thump-puff on landing.
 */
function ambientUpdate(
  engine: Engine | null | undefined,
  root: Node,
  wind: Voice | null,
  dt: number,
): void {
  const controller = root.getNode('Player/Controller') as CharacterController3D | null;
  if (!controller) return;
  const state = controller.state;
  if (wind && engine) {
    const w = windFor(state);
    wind.set({ pitch: w.pitch, volume: w.volume });
  }
  const camera = root.getNodeOrNull('Camera') as Camera3D | null;
  if (camera) {
    sprint.fov +=
      (((state === 'fastRun' ? FOV_SPRINT : FOV_BASE) as number) - sprint.fov) *
      Math.min(1, dt * 6);
    camera.fov = sprint.fov;
  }
  const player = root.getNodeOrNull('Player') as (Node3D & Positioned) | null;
  if (!player) return;
  const [px, py, pz] = player.position;
  const feet: [number, number, number] = [px ?? 0, (py ?? 0) - 0.62, pz ?? 0];
  const airborne = state === 'airborne';
  if (sprint.wasAirborne && !airborne) spawnFootDust(root, feet, 1.7); // landing thump
  sprint.wasAirborne = airborne;
  if (state === 'fastRun') {
    sprint.strideClock -= dt;
    if (sprint.strideClock <= 0) {
      sprint.strideClock = STRIDE_SECONDS;
      spawnFootDust(root, feet);
    }
  } else {
    sprint.strideClock = 0;
  }
}

// ---- VillageDirector --------------------------------------------------------------

export class VillageDirector extends Behavior {
  /**
   * `QUEST COMPLETE` was a banner and nothing else.
   *
   * The village had an ending — the wolves cleared, the Elder's thanks, a
   * restart button — and emitted no `won`, so the playtest reported
   * `no win declared in this scene — nothing emits won/lost, so there is
   * nothing to reach` about a game that has one. The same shape as the isle's.
   */
  static readonly signals: readonly string[] = ['won'];

  private wind: Voice | null = null;
  private gateHinted = false;

  private get dialogue(): UiDialogue {
    return this.node.getNode('HUD/Dialogue') as UiDialogue;
  }

  override onReady(): void {
    const engine = this.node.tree?.engine;
    this.wind = engine?.sfx.startVoice('wind', 0.6) ?? null;
    const quest3 = this.node.getNode('HUD/Quest') as UiText;
    if (quest.cleared && !quest.done) quest3.text = 'Return to the Elder [E]';
    else if (quest.done) quest3.text = 'Emberwood is safe.';
    else if (quest.accepted) quest3.text = 'Clear the grove — through the north gate';

    this.dialogue.on('choiceMade', (index) => {
      if (index === 0 && !quest.accepted) {
        quest.accepted = true;
        (this.node.getNode('Elder/AcceptSfx') as AudioPlayer).play();
        quest3.text = 'Clear the grove — through the north gate';
      }
    });
  }

  override onExitTree(): void {
    this.wind?.stop();
  }

  override update(dt: number): void {
    const engine = this.node.tree?.engine;
    ambientUpdate(engine, this.node, this.wind, dt);
    // E advances an open dialogue (same key as "talk" — no extra binding)
    if (engine && this.dialogue.active && engine.input.justPressed('interact')) {
      this.dialogue.advance();
    }
    /*
     * R restarts once the quest is done — the same thing the button does.
     *
     * The scene has always declared `"restart": { "keys": ["KeyR"] }` and
     * nothing read it, so this game's own control vocabulary promised a key
     * that did nothing. `incanto-playtest` now says so:
     * `declared and never read: \`restart\``.
     */
    const restart = engine ? engine.input.justPressed('restart') : false;
    if (restart && quest.done) this.onRestart();
  }

  /** Elder.interacted → here (scene connection). */
  onTalk(): void {
    const talk = this.dialogue;
    if (talk.active) return; // the update() advance already handled this press
    (this.node.getNode('Elder/TalkSfx') as AudioPlayer).play();
    if (quest.done) {
      talk.say('Elder', 'Emberwood breathes easy again. Rest, hero.');
      return;
    }
    if (quest.cleared) {
      quest.done = true;
      talk.say('Elder', 'The howling has stopped... you really did it!');
      talk.say('Elder', 'Emberwood owes you everything. QUEST COMPLETE.');
      const banner = this.node.getNode('HUD/Banner') as UiBanner;
      talk.on('dialogueFinished', () => {
        banner.show('QUEST COMPLETE');
        this.node.emit('won');
        (this.node.getNode('HUD/RestartBtn') as UiButton).visible = true;
        (this.node.getNode('HUD/Quest') as UiText).text = 'Emberwood is safe.';
      });
      return;
    }
    if (quest.accepted) {
      talk.say('Elder', 'The wolves still prowl the grove. North gate, hero.');
      return;
    }
    talk.say('Elder', 'Ah, traveler. Wolves haunt our grove — three of them, bold as thunder.');
    talk.say('Elder', 'None of us dares the hedges anymore. Will you drive them out?', [
      'I will go',
      'Not yet',
    ]);
  }

  /** GroveGate.triggerEnter → here. */
  onGateEnter(other: Node): void {
    if (!other.isInGroup('player')) return;
    if (!quest.accepted) {
      if (!this.gateHinted && !this.dialogue.active) {
        this.gateHinted = true;
        this.dialogue.say('???', 'A low growl rolls from the hedges. Speak to the Elder first.');
      }
      return;
    }
    const engine = this.node.tree?.engine;
    if (engine) goToScene(engine, groveJson, { fadeSeconds: 0.5 });
  }

  /** HUD/RestartBtn.pressed → here. */
  onRestart(): void {
    resetQuest();
    const engine = this.node.tree?.engine;
    if (engine) goToScene(engine, villageJson, { fadeSeconds: 0.5 });
  }
}

// ---- GroveDirector ----------------------------------------------------------------

/** Patrol assignments: wolf name → [from, to] grid cells (open cells only). */
const PATROLS: Record<string, [[number, number], [number, number]]> = {
  Wolf1: [
    [1, 1],
    [3, 5],
  ],
  Wolf2: [
    [7, 1],
    [13, 3],
  ],
  Wolf3: [
    [1, 9],
    [9, 9],
  ],
};

const AGGRO_RANGE = 6;
const CALM_RANGE = 9;
const PATROL_SPEED = 2.4;
const HUNT_SPEED = 3.4;

export class GroveDirector extends Behavior {
  private wind: Voice | null = null;
  private clearedShown = false;
  private repathClock = 0;
  private hunting = new Set<string>();
  private respawnIn = 0;

  override onReady(): void {
    const engine = this.node.tree?.engine;
    this.wind = engine?.sfx.startVoice('wind', 0.8) ?? null;
    this.buildHedges();
    this.assignPatrols();
  }

  override onExitTree(): void {
    this.wind?.stop();
  }

  /** The same grid that routes the wolves becomes the physical maze:
   *  parseCells + mergeSolidRects collapse ~90 hedge cells to ~20 boxes. */
  private buildHedges(): void {
    const holder = this.node.getNode('Maze') as Node3D;
    const gridRows = parseCells(GROVE_GRID as unknown as string[], { '#': 0 });
    const rects = mergeSolidRects(gridRows, new Set([0]));
    rects.forEach((r, i) => {
      const w = r.w * CELL;
      const d = r.h * CELL;
      // taller than the player's eye line (1.94) — corridors must read as
      // corridors, and the camera's sphere probe needs a wall to catch
      const center = cellToWorld(r.x + r.w / 2 - 0.5, r.y + r.h / 2 - 0.5, 1.3);
      const body = new StaticBody3D(`Hedge${i}`);
      body.position = center;
      body.collider = { shape: 'box', size: [w, 2.6, d] };
      const skin = new MeshInstance3D('Skin');
      skin.mesh = 'box';
      skin.size = [w, 2.6, d];
      skin.material = { color: '#41633a', roughness: 0.95 };
      skin.castShadow = true;
      skin.receiveShadow = true;
      body.addChild(skin);
      holder.addChild(body);
    });
  }

  /** findPath (A*, no corner cutting) → PathFollow ring per wolf. */
  private assignPatrols(): void {
    const grid = gridFromRows(GROVE_GRID as unknown as string[]);
    for (const [name, [from, to]] of Object.entries(PATROLS)) {
      const wolf = this.node.getNode(`Wolves/${name}`) as Node3D | null;
      if (!wolf) continue;
      const cells = findPath(grid, from, to, { diagonal: false });
      if (!cells) continue;
      // out + back (minus the duplicated endpoints) = a loopable ring
      const ring = [...cells, ...cells.slice(1, -1).reverse()];
      const follow = wolf.behavior as unknown as {
        setPath(w: number[][]): void;
        loop: boolean;
      };
      follow.loop = true;
      follow.setPath(ring.map(([cx, cy]) => cellToWorld(cx, cy, 0.45)));
      wolf.position = cellToWorld(from[0], from[1], 0.45);
    }
  }

  override update(dt: number): void {
    const engine = this.node.tree?.engine;
    ambientUpdate(engine, this.node, this.wind, dt);
    this.faceWolvesForward();
    this.huntOrPatrol(dt);
    this.syncHpBar();
    if (this.respawnIn > 0) {
      this.respawnIn -= dt;
      if (this.respawnIn <= 0 && engine) goToScene(engine, groveJson, { fadeSeconds: 0.5 });
      return;
    }
    const left = this.node.tree?.getNodesInGroup('wolf').length ?? 0;
    (this.node.getNode('HUD/Quest') as UiText).text =
      left > 0 ? `Wolves left: ${left}` : 'Grove cleared — take the portal home';
    if (left === 0 && !this.clearedShown) {
      this.clearedShown = true;
      quest.cleared = true;
      (this.node.getNode('HUD/Banner') as UiBanner).show('GROVE CLEARED');
      (this.node.getNode('WinSfx') as AudioPlayer).play();
    }
  }

  /** Wolves HUNT: within aggro range they re-path to the player THROUGH the
   *  maze (findPath again — the patrol grid doubles as the nav grid); once the
   *  player slips away they resume their patrol ring. */
  private huntOrPatrol(dt: number): void {
    this.repathClock -= dt;
    if (this.repathClock > 0) return;
    this.repathClock = 0.35; // re-path a few times a second, not every frame
    const player = this.node.getNode('Player') as unknown as Positioned | null;
    if (!player) return;
    const [px, , pz] = player.position;
    const grid = gridFromRows(GROVE_GRID as unknown as string[]);
    const toCell = (x: number, z: number): [number, number] => [
      Math.round(x / CELL + (GRID_W - 1) / 2),
      Math.round(z / CELL + (GRID_H - 1) / 2),
    ];
    for (const node of this.node.tree?.getNodesInGroup('wolf') ?? []) {
      const wolf = node as Node3D;
      const follow = wolf.behavior as unknown as {
        setPath(w: number[][]): void;
        loop: boolean;
        speed: number;
      };
      const [wx, , wz] = wolf.position;
      const dist = Math.hypot((px ?? 0) - (wx ?? 0), (pz ?? 0) - (wz ?? 0));
      const wasHunting = this.hunting.has(wolf.name);
      if (dist < (wasHunting ? CALM_RANGE : AGGRO_RANGE)) {
        if (!wasHunting) {
          this.hunting.add(wolf.name);
          (wolf.getNode('GrowlSfx') as AudioPlayer | null)?.play();
        }
        const cells = findPath(grid, toCell(wx ?? 0, wz ?? 0), toCell(px ?? 0, pz ?? 0), {
          diagonal: false,
        });
        if (cells && cells.length > 1) {
          follow.loop = false;
          follow.speed = HUNT_SPEED;
          follow.setPath(cells.slice(1).map(([cx, cy]) => cellToWorld(cx, cy, 0.45)));
        }
      } else if (wasHunting) {
        this.hunting.delete(wolf.name);
        follow.speed = PATROL_SPEED;
        this.reassignPatrol(wolf.name);
      }
    }
  }

  private reassignPatrol(name: string): void {
    const patrol = PATROLS[name];
    const wolf = this.node.getNode(`Wolves/${name}`) as Node3D | null;
    if (!patrol || !wolf) return;
    const grid = gridFromRows(GROVE_GRID as unknown as string[]);
    // walk back to the patrol start, then resume the ring
    const [wx, , wz] = wolf.position;
    const here: [number, number] = [
      Math.round((wx ?? 0) / CELL + (GRID_W - 1) / 2),
      Math.round((wz ?? 0) / CELL + (GRID_H - 1) / 2),
    ];
    const back = findPath(grid, here, patrol[0], { diagonal: false }) ?? [];
    const ring = findPath(grid, patrol[0], patrol[1], { diagonal: false }) ?? [];
    const path = [...back.slice(1), ...ring.slice(1), ...ring.slice(1, -1).reverse()];
    const follow = wolf.behavior as unknown as { setPath(w: number[][]): void; loop: boolean };
    follow.loop = true;
    follow.setPath(path.map(([cx, cy]) => cellToWorld(cx, cy, 0.45)));
  }

  private syncHpBar(): void {
    const health = this.node.getNode('Player')?.behavior as unknown as {
      current: number;
      max: number;
    } | null;
    const bar = this.node.getNode('HUD/HP') as unknown as { value: number; max: number } | null;
    if (health && bar) {
      bar.value = health.current;
      bar.max = health.max;
    }
  }

  /** Player.died → here (scene connection): YOU FELL, then a fresh grove. */
  onPlayerDown(): void {
    if (this.respawnIn > 0) return;
    this.respawnIn = 1.6;
    (this.node.getNode('HUD/Banner') as UiBanner).show('YOU FELL');
  }

  /** PathFollow moves; facing is ours — +Z-forward rule: yaw = atan2(dx, dz). */
  private faceWolvesForward(): void {
    for (const node of this.node.tree?.getNodesInGroup('wolf') ?? []) {
      const wolf = node as Node3D & { _lastPos?: number[] };
      const [x, , z] = wolf.position;
      const last = wolf._lastPos ?? [x ?? 0, 0, z ?? 0];
      const dx = (x ?? 0) - (last[0] ?? 0);
      const dz = (z ?? 0) - (last[2] ?? 0);
      if (dx * dx + dz * dz > 1e-8) {
        wolf.rotation = [0, (Math.atan2(dx, dz) * 180) / Math.PI, 0];
      }
      wolf._lastPos = [x ?? 0, 0, z ?? 0];
    }
  }

  /** ReturnPortal.triggerEnter → here. */
  onPortalEnter(other: Node): void {
    if (!other.isInGroup('player')) return;
    const engine = this.node.tree?.engine;
    if (engine) goToScene(engine, villageJson, { fadeSeconds: 0.5 });
  }
}

// ---- SwordStrike ------------------------------------------------------------------

const SWING_SECONDS = 0.55;
const STRIKE_RANGE = 2.6;

interface AnimatedSkin {
  animationUpper: string;
}

/** On `attack`: play the melee clip — the blade rides the hand bone
 *  (BoneAttachment3D), so the Trail3D arc IS the real swing — and fell the
 *  nearest wolf mid-swing. */
export class SwordStrike extends Behavior {
  private swinging = 0;
  private pendingKill: Node | null = null;

  private get player(): Node & Positioned {
    return this.node.parent as unknown as Node & Positioned;
  }

  private get skin(): (Node & AnimatedSkin) | null {
    return this.player.getNode('Skin') as unknown as (Node & AnimatedSkin) | null;
  }

  override update(dt: number): void {
    const engine = this.node.tree?.engine;
    if (!engine) return;
    const trail = this.player.getNode('SwordMount/SwordTip/SwingTrail') as Trail3D | null;
    if (!trail) return;

    if (this.swinging > 0) {
      this.swinging -= dt;
      const t = 1 - Math.max(0, this.swinging) / SWING_SECONDS; // 0 → 1
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
    this.pendingKill = this.nearestWolf();
  }

  private nearestWolf(): Node | null {
    const [px, , pz] = this.player.position;
    let best: Node | null = null;
    let bestD = STRIKE_RANGE;
    for (const wolf of this.node.tree?.getNodesInGroup('wolf') ?? []) {
      const [wx, , wz] = (wolf as unknown as Positioned).position;
      const d = Math.hypot((wx ?? 0) - (px ?? 0), (wz ?? 0) - (pz ?? 0));
      if (d < bestD) {
        bestD = d;
        best = wolf;
      }
    }
    return best;
  }

  private fell(wolf: Node): void {
    this.pendingKill = null;
    if (!wolf.tree) return; // already gone
    const at = (wolf as unknown as Positioned).position;
    (this.player.getNode('HitSfx') as AudioPlayer).play();
    // two hits per wolf (`Vitals` is a `Health` of 2): the first FLINCHES it —
    // `knockback` shoves it along the strike and `staggerSeconds` holds its
    // PathFollow — and the second fells it. The blow's direction is the hit's
    // source: the player's position.
    const vitals = wolf.getNode('Vitals').behavior as Health;
    vitals.damage(1, this.player.position);
    if (!vitals.isDead) {
      (wolf.getNodeOrNull('GrowlSfx') as AudioPlayer | null)?.play();
      flashWolf(wolf);
      return;
    }
    // a one-shot dust poof where the wolf fell (self-removing)
    const poof = new Particles3D('Poof');
    poof.position = [at[0] ?? 0, (at[1] ?? 0) + 0.3, at[2] ?? 0];
    poof.preset = 'magic';
    poof.rate = 0;
    poof.burst = 26;
    poof.blend = 'normal';
    poof.sizeStart = 64;
    poof.sizeEnd = 12;
    poof.renderOrder = 100;
    poof.on('finished', () => poof.free());
    this.node.getRoot().addChild(poof);
    wolf.free();
  }
}

/**
 * Red hurt-flash on every mesh of the wolf, reverted a beat later.
 *
 * The beat is a `Timer`, not a `setTimeout` — which is what this was, and what
 * `incanto-behaviors-and-scripts.md` calls "the canonical serializable game
 * clock — NEVER setTimeout in game logic". Three things a wall-clock timeout
 * gets wrong here: it keeps running while the game is paused (`timeScale: 0`),
 * it ignores `timeScale` entirely, and in a headless run — where a minute of
 * play takes a second — it fires long after the frame that asked for it, so a
 * seeded playtest stops being reproducible. The node is a child of the wolf,
 * so a wolf that dies mid-flash takes its timer with it.
 */
function flashWolf(wolf: Node): void {
  const meshes: { material: Record<string, unknown> }[] = [];
  const walk = (n: Node): void => {
    const m = (n as unknown as { material?: Record<string, unknown> }).material;
    if (m && typeof m === 'object')
      meshes.push(n as unknown as { material: Record<string, unknown> });
    for (const c of n.children) walk(c);
  };
  walk(wolf);
  const originals = meshes.map((m) => m.material);
  for (const m of meshes) m.material = { ...m.material, color: '#ff5544' };
  const beat = new Timer('Unflash');
  beat.waitTime = 0.13;
  beat.oneShot = true;
  beat.autostart = true;
  beat.on('timeout', () => {
    meshes.forEach((m, i) => {
      if (wolf.tree) m.material = originals[i] as Record<string, unknown>;
    });
    beat.queueFree();
  });
  wolf.addChild(beat);
}

export const BEHAVIORS = { VillageDirector, GroveDirector, SwordStrike };
