/**
 * The TWO custom behaviors in Vanguard. Everything else — movement, the
 * over-the-shoulder camera, enemy AI, contact damage, wave spawning, death,
 * win/lose — is BUILT-IN gameplay behavior wired in `game.scene.json`. These two
 * cover the only gaps a built-in can't fill:
 *
 * - `Shoot`  — a click-to-fire HITSCAN gun. The aim is the THIRD-PERSON camera's
 *   look direction (CharacterController3D `view: 'free'` exposes yaw/pitch); a
 *   per-frame raycast finds the nearest enemy in the crosshair cone. It also owns
 *   the ammo clip, muzzle flash, tracer, spatial gun SFX, and — the TPS touch —
 *   snaps the visible character to FACE the aim on each shot so the soldier turns
 *   to shoot where you're looking.
 * - `HudUpdater` — pure presentation glue. The gameplay library owns the numbers,
 *   not how they're drawn, and this game draws its HUD in plain DOM, so it reads
 *   ScoreKeeper.score / Health.current / the wave index / the ammo count each
 *   frame into the HTML HUD overlay (index.html) and flips the win/lose banner.
 */

import type { Node } from 'incanto';
import { Behavior } from 'incanto';
import type { CharacterController3D, ModelInstance3D, Node3D } from 'incanto/3d';
import { MeshInstance3D, Particles3D } from 'incanto/3d';
import { restartScene } from 'incanto/gameplay';

// CharacterController3D movement state → mixamo clip (retargets onto the GLB).
const STATE_CLIPS: Record<string, string> = {
  idle: '$anims/idle',
  walk: '$anims/walk',
  run: '$anims/run',
  fastRun: '$anims/runFast',
  airborne: '$anims/jump',
};

// ---------------------------------------------------------------------------
// Shoot — hitscan gun on the CharacterController3D (reads its yaw/pitch/eye).
// ---------------------------------------------------------------------------

const CLIP_SIZE = 18;
const FIRE_COOLDOWN_MS = 130;
const RELOAD_MS = 950;
const RANGE = 70; // meters a shot reaches
const AIM_COS = Math.cos(0.16); // ~9° aim cone (dot-product threshold)
const DAMAGE = 30; // one-shots a 30-HP enemy
const FLASH_MS = 55;
const TRACER_MS = 45; // a quick flash — short enough not to linger when moving
const TRACER_OPACITY = 0.85; // start opacity; the streak FADES to 0 over its life
const TRACER_LEN = 2.5; // SHORT dash leaving the muzzle — NOT a full beam to the target
const CHEST_OFFSET = 0.4; // tracer/flash origin above the body centre (≈ chest)
const RAD2DEG = 180 / Math.PI;

interface HealthLike {
  damage(n: number): void;
  isDead: boolean;
}
interface ScoreLike {
  addScore(n: number): void;
}
interface AudioLike {
  play(): void;
}

const vlen = (x: number, y: number, z: number): number => Math.hypot(x, y, z);
const normalize3 = (v: [number, number, number]): [number, number, number] => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * Euler (degrees, order XYZ — the engine default) that points a node's local +Z along
 * `(dx,dy,dz)`. For XYZ the +Z basis column is `(sin ry, −sin rx·cos ry, cos rx·cos ry)`,
 * so `ry = atan2(Dx, √(Dy²+Dz²))`, `rx = atan2(−Dy, Dz)` (unit D). The level-only
 * `[atan2(dy,horiz), …]` form skews a Z-aligned rod (tracer) when aiming up/down.
 */
function aimEulerXYZ(dx: number, dy: number, dz: number): [number, number, number] {
  const l = Math.hypot(dx, dy, dz) || 1;
  const ux = dx / l;
  const uy = dy / l;
  const uz = dz / l;
  return [Math.atan2(-uy, uz) * RAD2DEG, Math.atan2(ux, Math.hypot(uy, uz)) * RAD2DEG, 0];
}

export class Shoot extends Behavior {
  ammo = CLIP_SIZE;
  readonly clip = CLIP_SIZE;
  reloading = false;
  private clock = 0;
  private lastShot = -Infinity;
  private reloadDone = 0;
  private flashUntil = 0;
  private tracer: Node3D | null = null;
  private tracerUntil = 0;

  /** The controller carries this script; its parent is the Player body. */
  private get controller(): CharacterController3D {
    return this.node as unknown as CharacterController3D;
  }
  private get player(): Node3D {
    return this.node.parent as unknown as Node3D;
  }
  private muzzle(name: string): AudioLike | null {
    return (this.player.getNodeOrNull(`Muzzle/${name}`) as unknown as AudioLike) ?? null;
  }
  private get flash(): (Node3D & { intensity: number }) | null {
    return (
      (this.player.getNodeOrNull('Muzzle/Flash') as unknown as Node3D & { intensity: number }) ??
      null
    );
  }
  private get scoreKeeper(): ScoreLike {
    return this.getNode('/root').behavior as unknown as ScoreLike;
  }

  /** Camera-eye world position — the AIM ray origin (player is a root child). */
  private eye(): [number, number, number] {
    const p = this.player.position;
    return [p[0] ?? 0, (p[1] ?? 0) + this.controller.eyeHeight, p[2] ?? 0];
  }

  /** Where the VISIBLE tracer + flash emanate from: the character's CHEST, nudged
   *  forward along the aim. The camera eye sits ABOVE the head in third person, so
   *  firing the streak from there looks like it spawns from nowhere — the body is
   *  ~1.7 m tall with its origin at the waist, so chest ≈ +0.4, front ≈ +0.35·aim. */
  private muzzlePoint(fwd: [number, number, number]): [number, number, number] {
    const p = this.player.position;
    return [
      (p[0] ?? 0) + fwd[0] * 0.35,
      (p[1] ?? 0) + CHEST_OFFSET + fwd[1] * 0.35,
      (p[2] ?? 0) + fwd[2] * 0.35,
    ];
  }

  /** Forward unit vector from the camera yaw/pitch (same convention as the rig). */
  private forward(): [number, number, number] {
    const { yaw, pitch } = this.controller;
    const cp = Math.cos(pitch);
    return [-Math.sin(yaw) * cp, -Math.sin(pitch), -Math.cos(yaw) * cp];
  }

  /** Drive the GLB character's mixamo animation from the controller's move state. */
  override onReady(): void {
    const skin = this.player.getNodeOrNull('Skin') as ModelInstance3D | null;
    if (!skin) return;
    this.skin = skin;
    this.controller.on('movementStateChanged', (state) => {
      const clip = STATE_CLIPS[state as string];
      if (clip) skin.animation = clip;
    });
  }

  /** The visible soldier — the upper-body layer plays the shot on it. */
  private skin: ModelInstance3D | null = null;

  override update(dt: number): void {
    this.clock += dt * 1000;

    if (this.reloading && this.clock >= this.reloadDone) {
      this.reloading = false;
      this.ammo = this.clip;
    }
    if (this.input.justPressed('reload')) this.startReload();

    const fl = this.flash;
    if (fl) fl.intensity = this.clock < this.flashUntil ? 6 : 0;
    if (this.tracer) {
      const remain = this.tracerUntil - this.clock;
      if (remain <= 0) {
        this.tracer.parent?.removeChild(this.tracer as unknown as Node);
        this.tracer = null;
      } else {
        // fade the streak out so a moving shot doesn't leave a "stick" hanging in the air
        (this.tracer as unknown as MeshInstance3D).material.opacity =
          TRACER_OPACITY * (remain / TRACER_MS);
      }
    }

    if (
      this.input.isPressed('fire') &&
      !this.reloading &&
      this.ammo > 0 &&
      this.clock - this.lastShot >= FIRE_COOLDOWN_MS
    ) {
      this.lastShot = this.clock;
      this.fire();
    } else if (this.input.justPressed('fire') && !this.reloading && this.ammo <= 0) {
      this.muzzle('EmptySfx')?.play();
    }
  }

  private startReload(): void {
    if (this.reloading || this.ammo === this.clip) return;
    this.reloading = true;
    this.reloadDone = this.clock + RELOAD_MS;
  }

  private fire(): void {
    this.ammo--;
    this.muzzle('ShotSfx')?.play();
    this.flashUntil = this.clock + FLASH_MS;
    // The shot plays on the UPPER BODY only — `animation` (idle/run, driven by
    // the controller) keeps the legs going, so the soldier fires while running
    // instead of freezing mid-stride. A one-shot: the layer clears itself when
    // the clip ends, and a shot fired before that restarts it.
    if (this.skin) this.skin.animationUpper = '$anims/shoot';

    const eye = this.eye();
    const fwd = this.forward();
    this.faceAim(fwd); // TPS: turn the soldier to face where you're shooting.

    // Hitscan: nearest enemy inside the aim cone within RANGE.
    const tree = this.node.tree;
    const enemies = tree ? tree.getNodesInGroup('enemy') : [];
    let best: Node | null = null;
    let bestDist = RANGE;
    for (const e of enemies) {
      const ep = (e as unknown as Node3D).position;
      const dx = (ep[0] ?? 0) - eye[0];
      const dy = (ep[1] ?? 0) - eye[1];
      const dz = (ep[2] ?? 0) - eye[2];
      const dist = vlen(dx, dy, dz);
      if (dist < 0.001 || dist > RANGE) continue;
      const dot = (dx * fwd[0] + dy * fwd[1] + dz * fwd[2]) / dist;
      if (dot < AIM_COS) continue; // outside the cone
      if (dist < bestDist) {
        bestDist = dist;
        best = e;
      }
    }

    const end: [number, number, number] = best
      ? [...((best as unknown as Node3D).position as [number, number, number])]
      : [eye[0] + fwd[0] * 28, eye[1] + fwd[1] * 28, eye[2] + fwd[2] * 28];
    const muzzle = this.muzzlePoint(fwd);
    this.spawnMuzzleFlash(muzzle); // a spark POP at the chest muzzle
    this.spawnTracer(muzzle, end); // SHORT streak from the chest, not a long beam

    if (best) {
      const hp = this.findHealth(best);
      if (hp) {
        hp.damage(DAMAGE);
        if (hp.isDead) {
          this.scoreKeeper.addScore(1);
          this.muzzle('KillSfx')?.play();
        }
      }
    }
  }

  /** Snap the visible Skin (sibling Node3D) to face the aim — the controller's
   *  move-facing reclaims it on the next move, so this reads as "aim while still". */
  private faceAim(fwd: [number, number, number]): void {
    const skin = this.player.getNodeOrNull('Skin') as Node3D | null;
    if (!skin) return;
    const yaw = Math.atan2(fwd[0], fwd[2]) * RAD2DEG; // same mapping as the rig's skin-facing
    skin.rotation = [skin.rotation[0] ?? 0, yaw, skin.rotation[2] ?? 0];
  }

  /** Robust Health lookup: the node, then its descendants. */
  private findHealth(node: Node): HealthLike | null {
    const b = (node as unknown as { behavior?: unknown }).behavior;
    if (b && typeof (b as HealthLike).damage === 'function' && 'isDead' in (b as object)) {
      return b as HealthLike;
    }
    for (const c of node.children) {
      const h = this.findHealth(c);
      if (h) return h;
    }
    return null;
  }

  /** A round spark POP at the muzzle — the "shot bursting" punch (sphere via spreadZ). */
  private spawnMuzzleFlash(pos: [number, number, number]): void {
    const f = new Particles3D('Muzzle');
    f.position = [...pos];
    f.preset = 'custom';
    f.emitting = false;
    f.rate = 0;
    f.spreadDeg = 360;
    f.burst = 14;
    f.lifetime = [0.05, 0.16]; // very brief — a flash, not a lingering spray
    f.speed = [50, 190];
    f.gravity = [0, 0];
    f.drag = 6; // sparks brake fast → a tight pop at the muzzle
    f.sizeStart = 30;
    f.sizeEnd = 4;
    f.paletteColors = ['#fff6d0', '#ffd76a', '#ff9a3c'];
    f.colorEnd = '#ff7a1e';
    f.alphaStart = 1;
    f.alphaEnd = 0;
    f.blend = 'add'; // a muzzle flash is light → additive pop
    f.depthTest = false;
    f.renderOrder = 100;
    f.maxParticles = 16;
    this.node.getRoot().addChild(f as unknown as Node);
    f.on('finished', () => f.parent?.removeChild(f as unknown as Node));
  }

  private spawnTracer(from: [number, number, number], to: [number, number, number]): void {
    if (this.tracer) this.tracer.parent?.removeChild(this.tracer as unknown as Node);
    const dir = normalize3([to[0] - from[0], to[1] - from[1], to[2] - from[2]]);
    const full = vlen(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
    // A SHORT dash that leaves the muzzle along the aim — NOT a long beam to the target
    // (a long world-space rod lingers like a "stick" when you move). Anchored at the
    // muzzle: centre = from + dir*(seg/2), oriented with the XYZ-order euler (aimEulerXYZ).
    const seg = Math.min(full, TRACER_LEN);
    const t = new MeshInstance3D('Tracer');
    t.mesh = 'box';
    t.size = [0.03, 0.03, Math.max(0.4, seg)];
    t.material = {
      color: '#ffffff',
      emissive: '#ffe08a',
      emissiveIntensity: 5,
      opacity: TRACER_OPACITY,
    };
    t.position = [
      from[0] + dir[0] * (seg / 2),
      from[1] + dir[1] * (seg / 2),
      from[2] + dir[2] * (seg / 2),
    ];
    t.rotation = aimEulerXYZ(dir[0], dir[1], dir[2]);
    this.node.getRoot().addChild(t);
    this.tracer = t as unknown as Node3D;
    this.tracerUntil = this.clock + TRACER_MS;
  }
}

// ---------------------------------------------------------------------------
// HudUpdater — writes the live numbers into the HTML HUD overlay (index.html).
// This HUD is plain DOM by choice. `HudLayer` + `UiText`/`UiBar` also work in
// 3D and are the readable-headlessly option (incanto-hud.md); the scene keeps a
// HudLayer for its banner. All DOM
// access is guarded: headless runs (verify, runScript) have no `document`, so
// every write is a no-op and the gameplay logic is unaffected.
// ---------------------------------------------------------------------------

interface ScoreState {
  score: number;
}
interface HealthState {
  current: number;
  max: number;
}
interface ShootState {
  ammo: number;
  clip: number;
  reloading: boolean;
}

const TOTAL_WAVES = 3;
const hasDom = typeof document !== 'undefined';

export class HudUpdater extends Behavior {
  private wave = 1;
  private over = false;

  private get score(): ScoreState {
    return this.getNode('/root').behavior as unknown as ScoreState;
  }
  private get health(): HealthState {
    return this.getNode('/root/Player').behavior as unknown as HealthState;
  }
  private get shoot(): ShootState {
    return this.getNode('/root/Player/Controller').behavior as unknown as ShootState;
  }

  private set(id: string, text: string): void {
    if (!hasDom) return;
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  override onReady(): void {
    this.getNode('/root').on('lost', () => this.show('MISSION FAILED', '#ef476f'));
    this.getNode('/root/Spawner').on('waveStarted', (i) => {
      this.wave = (i as number) + 1;
    });
    this.refresh();
  }

  /** Wired from Spawner.allCleared in the scene connections → WIN. */
  onAllCleared(): void {
    this.show('AREA SECURED', '#ffd166');
  }

  override update(): void {
    this.refresh();
    /*
     * Enter restarts, once the mission is over.
     *
     * The scene has declared a `restart` action since this template shipped and
     * nothing read it — so `MISSION FAILED` was a dead end you left with F5.
     * It was bound to `KeyR` as well, the reload key, which is the tell: a
     * binding nobody reads is also a binding nobody notices colliding.
     */
    const engine = this.node.tree?.engine;
    // Read EVERY frame, act only when the mission is over: an action polled
    // behind a condition is invisible to `unreadActions()` until a run reaches
    // that screen, and this template's own playtest reported it dead.
    const pressed = engine ? engine.input.justPressed('restart') : false;
    if (this.over && pressed && engine) restartScene(engine);
  }

  private refresh(): void {
    if (this.over) return;
    const hp = Math.max(0, Math.round(this.health.current));
    this.set('hud-hp', `HP ${hp}`);
    this.set('hud-kills', `Kills ${this.score.score}`);
    this.set('hud-wave', `Wave ${Math.min(this.wave, TOTAL_WAVES)} / ${TOTAL_WAVES}`);
    const s = this.shoot;
    this.set('hud-ammo', s.reloading ? 'Reloading…' : `Ammo ${s.ammo} / ${s.clip}`);
    if (hasDom) {
      const bar = document.getElementById('hud-hp-fill');
      if (bar) {
        const frac = Math.max(0, Math.min(1, hp / (this.health.max || 100)));
        bar.style.width = `${frac * 100}%`;
        bar.style.background = frac > 0.5 ? '#6ee7dc' : frac > 0.25 ? '#ffd166' : '#ef476f';
      }
    }
  }

  private show(text: string, color: string): void {
    if (this.over && text === 'MISSION FAILED') return; // don't overwrite a win with a same-frame death
    this.over = true;
    if (!hasDom) return;
    const b = document.getElementById('banner');
    if (b) {
      // A game-over screen has to say how to leave it, or the key that works is
      // one only the input map knows about.
      b.textContent = `${text}\nPress Enter to restart`;
      b.style.whiteSpace = 'pre-line';
      b.style.color = color;
      b.style.opacity = '1';
    }
  }
}
