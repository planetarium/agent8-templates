// Puts a weapon / tool in a character's hand. Pure three (no React): <HeldProp> wraps it.
//
// The held model sits under a `holder` group that is re-placed every time three updates world
// matrices (right before each render), after the animation mixer and the movement code have run,
// so it never lags the hand:
// - gun: the grip point sits in the grip hand's fist; the barrel lies along the line from the grip
//   hand to the support hand (when that hand is 0.12–0.7 m away and in front of the body — the
//   rifle clips hold it there), else along the body's facing, and turns toward `aim` by its weight
//   — never more than MAX_BARREL_YAW (60°) from the body's facing. <Character> / <AnimatedModel>
//   turn the drawn body to the aim (followAim), so an aiming character faces where it shoots.
// - melee (blade / hafted / polearm) and bow: fixed in the hand's grip frame, so it follows the
//   wrist (a bow by its riser: arrow along the fingers, upper limb out of the top of the fist).
// Only a gun reports a muzzle (bows have no muzzle tip: the arrow leaves from the drawn string).
// The holder cancels the bone's world scale, so the weapon keeps its size in metres.
//
// It never takes the game down: missing finger bones → the hand bone alone; no hand bone → in
// front of the body; any other error → the weapon is hidden and the game goes on.
import * as THREE from 'three';
import type { GripKind } from './grip';

export type Side = 'Right' | 'Left';
/** How much of the hand the rig has: all knuckles, some, the hand bone only, or none (body). */
export type HandFit = 'fingers' | 'partial' | 'hand' | 'body';
export type Aim = { yaw: number; pitch: number; weight: number };
/** Written every frame while the weapon is drawn: muzzle world position and direction. */
export type Muzzle = { x: number; y: number; z: number; dx: number; dy: number; dz: number; valid: boolean };

/** Bone names without prefixes / separators: "mixamorig:RightHand" → "righthand", "Hand_R" → "handr". */
export const norm = (name: string) => name.toLowerCase().replace(/^mixamorig:?/, '').replace(/[\s_.:\-|]/g, '');

const HAND_END: Record<Side, string[]> = {
  Right: ['righthand', 'handright', 'handr', 'rhand', 'rwrist', 'wristr', 'rightwrist'],
  Left: ['lefthand', 'handleft', 'handl', 'lhand', 'lwrist', 'wristl', 'leftwrist'],
};
type Finger = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
const FINGER: [Finger, RegExp][] = [
  ['thumb', /thumb|finger0/],
  ['index', /index|finger1|pointer/],
  ['middle', /middle|finger2/],
  ['ring', /ring|finger3/],
  ['pinky', /pinky|little|finger4/],
];

/** The hand bone of one side (bones first), or undefined. */
export function findHand(root: THREE.Object3D, side: Side): THREE.Object3D | undefined {
  const ends = HAND_END[side];
  let best: THREE.Object3D | undefined;
  root.traverse((o) => {
    if (best && (best as THREE.Bone).isBone) return;
    const n = norm(o.name);
    if (!n || /thumb|index|middle|ring|pinky|little|finger/.test(n)) return;
    if (ends.some((e) => n.endsWith(e)) && (!best || (o as THREE.Bone).isBone)) best = o;
  });
  return best;
}

/** First knuckle of each finger found under the hand (shallowest match wins). */
export function findFingers(hand: THREE.Object3D) {
  const out: Partial<Record<Finger, THREE.Object3D>> = {};
  const depth = new Map<THREE.Object3D, number>();
  const walk = (o: THREE.Object3D, d: number) => {
    for (const c of o.children) {
      const n = norm(c.name);
      for (const [f, re] of FINGER) {
        if (re.test(n) && (out[f] === undefined || d < depth.get(out[f]!)!)) {
          out[f] = c;
          depth.set(c, d);
          break;
        }
      }
      walk(c, d + 1);
    }
  };
  walk(hand, 0);
  return out;
}

const _p = new THREE.Vector3();
const _q = new THREE.Vector3();

/** Position of a descendant in the hand's local space. */
function inHand(hand: THREE.Object3D, o: THREE.Object3D) {
  if (o.parent === hand) return o.position.clone();
  const m = new THREE.Matrix4();
  for (let n: THREE.Object3D | null = o; n && n !== hand; n = n.parent) {
    n.updateMatrix();
    m.premultiply(n.matrix);
  }
  return _p.setFromMatrixPosition(m).clone();
}

/** Any unit vector ⟂ `v`. */
function perpendicular(v: THREE.Vector3) {
  const a = Math.abs(v.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  return a.addScaledVector(v, -a.dot(v)).normalize();
}

/** Hand length over forearm length (wrist → middle knuckle / elbow → wrist), median of the 75 full library rigs. */
const HAND_PER_FOREARM = 0.55;

/**
 * The grip frame of a hand in the hand bone's local space:
 * - origin: the fist centre — 70 % of the way from the wrist to the knuckles, a quarter hand
 *   length out of the palm
 * - +X: wrist → knuckles, +Y: knuckle line pinky → index (top of the fist), +Z: X × Y
 * `fingers`: the index root and a second finger root (pinky, ring or middle) give the knuckle line;
 * the thumb picks the palm side.
 * Reduced rigs (most library characters: one index chain, or the hand bone only —
 * hold.fixture.json) use the mixamo hand bone's own axes instead: +Y runs along the hand, the
 * knuckle line is +X on the right hand / −X on the left, the palm faces +Z (measured on the 75 full
 * library rigs: fingers within 1–37° of +Y, palm normal within 1° of Z). A finger root, when there
 * is one, sets the forward direction and the hand length (`partial`); with none the hand length
 * comes from the forearm (`hand`).
 */
export function gripFrame(hand: THREE.Object3D, side: Side = 'Right', palm = 0.25): { frame: THREE.Matrix4; fit: HandFit } {
  const f = findFingers(hand);
  const pos = (o?: THREE.Object3D) => (o ? inHand(hand, o) : null);
  const index = pos(f.index), middle = pos(f.middle), thumb = pos(f.thumb);
  const second = pos(f.pinky) ?? pos(f.ring) ?? (index && middle ? middle : null);
  let fit: HandFit;
  let fwd: THREE.Vector3, up: THREE.Vector3, len: number;
  let palmDir: THREE.Vector3 | null;
  if (index && second && index.distanceToSquared(second) > 1e-12) {
    fit = 'fingers';
    const knuckle = middle ?? index;
    fwd = knuckle.clone().normalize();
    up = index.clone().sub(second);
    up.addScaledVector(fwd, -up.dot(fwd));
    if (up.lengthSq() < 1e-12) up = perpendicular(fwd);
    up.normalize();
    len = knuckle.length();
    const across = new THREE.Vector3().crossVectors(fwd, up).normalize();
    palmDir = thumb ? across.multiplyScalar(thumb.dot(across) < 0 ? -1 : 1) : null;
  } else {
    const z = new THREE.Vector3(0, 0, 1);
    // finger roots with known or unknown names (not the thumb)
    const kids = hand.children.filter((c) => c.position.lengthSq() > 1e-12 && !(f.thumb && c === f.thumb));
    const tip = (middle ?? index)?.clone() ?? (kids.length ? kids.reduce((s, c) => s.add(c.position), new THREE.Vector3()).divideScalar(kids.length) : null);
    fit = tip ? 'partial' : 'hand';
    fwd = tip ? tip.clone().addScaledVector(z, -tip.dot(z)) : new THREE.Vector3();
    if (fwd.lengthSq() < 1e-12) fwd.set(0, 1, 0);
    fwd.normalize();
    up = new THREE.Vector3(side === 'Right' ? 1 : -1, 0, 0);
    up.addScaledVector(fwd, -up.dot(fwd));
    if (up.lengthSq() < 1e-12) up = perpendicular(fwd);
    up.normalize();
    if (tip && tip.length() > 1e-6) len = tip.length();
    else {
      // no finger roots: from the forearm (the hand's position in its parent), in hand units
      const s = Math.abs(hand.scale.x) || 1;
      len = (HAND_PER_FOREARM * hand.position.length()) / s;
      if (!(len > 0)) {
        hand.updateWorldMatrix(true, false);
        const w = _q.setFromMatrixScale(hand.matrixWorld);
        len = 0.08 / ((Math.abs(w.x) + Math.abs(w.y) + Math.abs(w.z)) / 3 || 1);
      }
    }
    palmDir = z;
  }
  const across = new THREE.Vector3().crossVectors(fwd, up).normalize();
  const origin = fwd.clone().multiplyScalar(0.7 * len);
  if (palmDir) origin.addScaledVector(palmDir, palm * len);
  const frame = new THREE.Matrix4().makeBasis(fwd, up, across).setPosition(origin);
  return { frame, fit };
}

/**
 * Canonical weapon frame (grip at the origin, +Z forward, +Y up) → hand grip frame, for melee:
 * the tip comes out of the top of the fist (+Y), the edge faces where the fingers point (+X).
 */
const MELEE_IN_HAND = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
/** Bow: the arrow flies where the fingers point (+X), the upper limb comes out of the top of the fist (+Y). */
const BOW_IN_HAND = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));

/**
 * Widest horizontal angle between a gun's barrel and the body's facing (60°). A rifleman turns
 * the torso about this far before the feet have to move; past it the barrel would cross the
 * support arm and chest. The rifle clips hold it within 4–26° and a turning enemy's barrel lagged
 * up to 51°, so the cap only bites when the aim is beside or behind a body that does not turn.
 */
export const MAX_BARREL_YAW = Math.PI / 3;
/** How fast the drawn body turns to the aim (1/s), like the player controller's facing ease. */
export const BODY_TURN = 14;

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** World yaw of a direction (0 = +z, π/2 = +x), the convention of `Aim.yaw`. */
export const yawOf = (x: number, z: number) => Math.atan2(x, z);

/** Turns `dir` about world up so it is at most `max` from `body` horizontally (pitch kept). */
export function clampYaw(dir: THREE.Vector3, body: THREE.Vector3, max = MAX_BARREL_YAW) {
  const h = Math.hypot(dir.x, dir.z);
  if (h < 1e-6) return dir;
  const by = yawOf(body.x, body.z);
  const d = wrap(yawOf(dir.x, dir.z) - by);
  if (Math.abs(d) <= max) return dir;
  const y = by + Math.sign(d) * max;
  dir.x = Math.sin(y) * h;
  dir.z = Math.cos(y) * h;
  return dir;
}

/**
 * The body follows the aim: the yaw to add to a character model drawn under a parent facing
 * `parentYaw`, eased from `current` over `dt`. Full weight turns the body onto `aim.yaw`; no aim
 * or weight 0 eases back to 0 (the body faces where the movement code points it).
 */
export function followAim(current: number, parentYaw: number, aim: Aim | undefined, dt: number, rate = BODY_TURN) {
  const w = aim ? Math.min(1, Math.max(0, aim.weight)) : 0;
  const target = w > 0 ? wrap(aim!.yaw - parentYaw) * w : 0;
  return wrap(current + wrap(target - current) * Math.min(1, dt * rate));
}

/** Support hand counts as "on the gun" this far from the grip hand (m), in front of the body. */
const HANDS = { min: 0.12, max: 0.7 };
/** How fast a gun's barrel swings to a new direction (1/s). */
const SWING = 18;
/** Where a weapon floats on a rig without hand bones, as fractions of the rig's height. */
const NO_HAND = { up: 0.62, forward: 0.17, side: 0.12 };

export type HoldOptions = {
  kind: GripKind;
  side?: Side;
  /** Gun only: where to point (world yaw, 0 = +z; pitch up +), and how much (0–1). */
  aim?: Aim;
  /** Gun only: filled every frame with the muzzle's world position / direction (other kinds: `valid` false). */
  muzzle?: Muzzle;
  /** The muzzle tip in the canonical frame (metres), from gripMatrix (info file `muzzleTip`, else the front end). */
  tip?: THREE.Vector3;
  /**
   * True while the upper body does the aiming (aimRig): the barrel then only follows the hands —
   * no turn toward `aim` and no MAX_BARREL_YAW cap, which are for bodies that do not aim.
   */
  aimByBody?: () => boolean;
};

export type Held = { holder: THREE.Group; fit: HandFit; hand?: THREE.Object3D; dispose: () => void };

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Attaches `prop` (already in the canonical frame, metres) to `rig` — the clone that is drawn,
 * not gltf.scene. Returns the holder; `dispose()` takes it off again.
 */
export function holdInHand(rig: THREE.Object3D, prop: THREE.Object3D, opts: HoldOptions): Held {
  const side = opts.side ?? 'Right';
  const hand = findHand(rig, side);
  const support = findHand(rig, side === 'Right' ? 'Left' : 'Right');
  const holder = new THREE.Group();
  holder.name = `held-${side}`;
  holder.matrixAutoUpdate = false;
  holder.add(prop);

  let fit: HandFit = 'body';
  let gripLocal = new THREE.Matrix4();
  let supportLocal: THREE.Vector3 | null = null;
  if (hand) {
    const g = gripFrame(hand, side);
    fit = g.fit;
    gripLocal = g.frame;
    if (support) supportLocal = new THREE.Vector3().setFromMatrixPosition(gripFrame(support, side === 'Right' ? 'Left' : 'Right').frame);
  }
  // rig height for the body fallback (rig units)
  let height = 1.7;
  if (!hand) {
    rig.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(rig);
    const s = new THREE.Vector3().setFromMatrixScale(rig.matrixWorld);
    if (!box.isEmpty() && s.y > 0) height = (box.max.y - box.min.y) / s.y || height;
  }
  (hand ?? rig).add(holder);

  const gun = opts.kind === 'gun';
  const dir = new THREE.Vector3();
  const want = new THREE.Vector3();
  const body = new THREE.Vector3();
  const grip = new THREE.Vector3();
  const other = new THREE.Vector3();
  const aimDir = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  const world = new THREE.Matrix4();
  const basis = new THREE.Matrix4();
  const x = new THREE.Vector3();
  const y = new THREE.Vector3();
  const tipW = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  let last = 0;
  let failed = false;

  /** World pose of the canonical frame for this frame → holder.matrix. */
  const solve = () => {
    const parent = holder.parent;
    if (!parent) return;
    const now = performance.now() / 1000;
    const dt = last ? Math.min(0.1, Math.max(0, now - last)) : 0;
    last = now;
    rig.matrixWorld.decompose(pos, quat, scl);
    body.set(0, 0, 1).applyQuaternion(quat).setY(0);
    if (body.lengthSq() < 1e-8) body.set(0, 0, 1);
    body.normalize();

    if (hand) grip.setFromMatrixPosition(world.multiplyMatrices(hand.matrixWorld, gripLocal));
    else {
      const h = height * scl.y;
      x.crossVectors(UP, body).normalize(); // body's left
      grip.copy(pos).addScaledVector(UP, NO_HAND.up * h).addScaledVector(body, NO_HAND.forward * h).addScaledVector(x, (side === 'Right' ? -1 : 1) * NO_HAND.side * h);
    }

    if (gun || !hand) {
      want.copy(body);
      if (gun && hand && support && supportLocal) {
        support.updateWorldMatrix(true, false);
        other.copy(supportLocal).applyMatrix4(support.matrixWorld).sub(grip);
        const len = other.length();
        if (len > HANDS.min && len < HANDS.max && other.dot(body) > 0) want.copy(other).divideScalar(len);
      }
      const byBody = gun && hand && !!opts.aimByBody?.();
      if (gun && !byBody && opts.aim && opts.aim.weight > 0) {
        const cp = Math.cos(opts.aim.pitch);
        aimDir.set(Math.sin(opts.aim.yaw) * cp, Math.sin(opts.aim.pitch), Math.cos(opts.aim.yaw) * cp);
        want.lerp(aimDir, Math.min(1, opts.aim.weight)).normalize();
      }
      if (!gun && opts.kind !== 'bow') want.addScaledVector(UP, 1.5).normalize(); // melee with no hand: tip up and forward
      if (dir.lengthSq() === 0 || dt === 0 || byBody) dir.copy(want); // aimed by the body: exactly on the hands
      else dir.lerp(want, 1 - Math.exp(-SWING * dt)).normalize();
      if (gun && !byBody) clampYaw(dir, body); // never through the body, whatever the aim or the swing lag
      // canonical +Z = dir, +Y = world up made perpendicular (sights up)
      y.copy(UP).addScaledVector(dir, -UP.dot(dir));
      if (y.lengthSq() < 1e-6) y.copy(body).negate();
      y.normalize();
      x.crossVectors(y, dir).normalize();
      basis.makeBasis(x, y, dir);
      quat.setFromRotationMatrix(basis);
    } else {
      // melee: the hand's grip frame, scale removed
      world.multiplyMatrices(hand.matrixWorld, gripLocal).decompose(pos, quat, scl);
      basis.makeRotationFromQuaternion(quat).multiply(opts.kind === 'bow' ? BOW_IN_HAND : MELEE_IN_HAND);
      quat.setFromRotationMatrix(basis);
    }
    world.compose(grip, quat, one);
    if (!world.elements.every(Number.isFinite)) {
      holder.visible = false;
      if (opts.muzzle) opts.muzzle.valid = false;
      return;
    }
    holder.visible = true;
    holder.matrix.copy(parent.matrixWorld).invert().multiply(world);
    holder.matrixWorldNeedsUpdate = true;
    const m = opts.muzzle;
    if (m && !gun) m.valid = false;
    else if (m) {
      tipW.copy(opts.tip ?? x.set(0, 0, 0)).applyMatrix4(world);
      x.set(0, 0, 1).applyQuaternion(quat);
      m.x = tipW.x; m.y = tipW.y; m.z = tipW.z;
      m.dx = x.x; m.dy = x.y; m.dz = x.z;
      m.valid = true;
    }
  };

  const base = THREE.Object3D.prototype.updateMatrixWorld;
  holder.updateMatrixWorld = function (force?: boolean) {
    if (!failed) {
      try {
        solve();
      } catch (e) {
        failed = true;
        holder.visible = false;
        if (opts.muzzle) opts.muzzle.valid = false;
        console.warn('held weapon hidden: placing it failed', e);
      }
    }
    base.call(this, force);
  };

  return {
    holder,
    fit,
    hand,
    dispose: () => {
      holder.removeFromParent();
      if (opts.muzzle) opts.muzzle.valid = false;
    },
  };
}
