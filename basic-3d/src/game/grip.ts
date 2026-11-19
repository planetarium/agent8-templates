// How a weapon / tool model is held: its grip values, where they come from, and the matrix that
// turns the model into the canonical held frame (grip point at the origin, +Z = muzzle / tip,
// +Y = sights / edge, metres).
//
// Grip values: the `grip` key of the weapon's asset info file (assetMeta.ts; agent8-library
// contract), all in the GLB scene's own coordinates (node transforms applied):
//   kind: gun (crossbows too) | blade | hafted | polearm | bow
//   point: where the fist closes (gun: the pistol grip; bow: the riser)
//   forward: muzzle / tip / head / where the arrow flies (unit)
//   up: sights (gun), edge / striking face (melee), upper limb (bow) (unit)
//   lengthM: real length in metres ALONG `forward`, for every kind (a 1.3 m recurve bow: 0.547)
//   muzzleTip: gun only, where a shot leaves the weapon; without it, the front end along forward
//   review: checked | low
// A kind this code does not know (the library may add some) is "no grip": the shape estimate
// holds it, its pose is never used.
// Resolution: game override > info file grip > shape estimate (gripEstimate.ts).
import * as THREE from 'three';
import type { AssetMeta } from './assetMeta';
import { canonMatrix, estimate } from './gripEstimate';

export const GRIP_KINDS = ['gun', 'blade', 'hafted', 'polearm', 'bow'] as const;
export type GripKind = (typeof GRIP_KINDS)[number];
export type V3 = [number, number, number];
export type Grip = { kind: GripKind; point: V3; forward: V3; up: V3; lengthM: number; muzzleTip?: V3; review?: 'checked' | 'low' };
export type GripSource = 'override' | 'meta' | 'estimate';
/**
 * What a game may replace: `kind`, `lengthM` and `muzzleTip` (gun) one by one; the pose
 * (`point`, `forward`, `up`) only as all three together, so a later fix of the info file can't
 * mix with half of an old pose.
 */
export type GripOverride = { kind?: GripKind; lengthM?: number; muzzleTip?: V3 } & (
  { point: V3; forward: V3; up: V3 } | { point?: never; forward?: never; up?: never }
);
export type Resolved = { grip: Grip; source: GripSource; overridden: (keyof Grip)[] };

/** Used only when nothing says how long the weapon is (estimate path, no override). */
export const DEFAULT_LENGTH_M: Record<GripKind, number> = { gun: 0.7, blade: 0.9, hafted: 0.6, polearm: 1.8, bow: 0.5 };

const isKind = (k: unknown): k is GripKind => GRIP_KINDS.includes(k as GripKind);
const isV3 = (a: unknown): a is V3 => Array.isArray(a) && a.length === 3 && a.every((x) => typeof x === 'number' && Number.isFinite(x));
const isLength = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0 && x < 20;
/** forward and up: non-zero, not parallel. */
function isPose(point: unknown, forward: unknown, up: unknown): boolean {
  if (!isV3(point) || !isV3(forward) || !isV3(up)) return false;
  const f = new THREE.Vector3(...forward),
    u = new THREE.Vector3(...up);
  if (f.lengthSq() < 1e-12 || u.lengthSq() < 1e-12) return false;
  return Math.abs(f.normalize().dot(u.normalize())) < 0.99;
}

const warned = new Set<string>();
/** console.warn once per message. */
export function warnOnce(msg: string) {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(msg);
}
/** Tests only: forget which warnings were given. */
export function resetGripWarnings() {
  warned.clear();
}

/** The grip of an info file, validated; null when absent / malformed / of an unknown kind. `muzzleTip` is kept for guns only. */
export function gripFromMeta(meta: AssetMeta | null | undefined): Grip | null {
  const g = meta?.grip as Partial<Grip> | undefined;
  if (!g || typeof g !== 'object') return null;
  if (!isKind(g.kind) || !isPose(g.point, g.forward, g.up) || !isLength(g.lengthM)) return null;
  const out: Grip = { kind: g.kind, point: g.point as V3, forward: g.forward as V3, up: g.up as V3, lengthM: g.lengthM };
  if (g.kind === 'gun' && isV3(g.muzzleTip)) out.muzzleTip = g.muzzleTip;
  if (g.review === 'checked' || g.review === 'low') out.review = g.review;
  return out;
}

/**
 * Weapon kind when there is no usable grip: the info file's `grip.kind` / `kind` when known, then
 * its tags ("weapons ranged" → gun, or bow when the file name says bow; "weapons melee" → blade).
 * An asset with no info file (generated models) falls back to words in its URL — pass `kind` on
 * `hold` when it guesses wrong. Anything else (torch, staff, tool) is held like a blade.
 */
export function kindOf(meta: AssetMeta | null | undefined, url: string): GripKind {
  const g = meta?.grip as { kind?: unknown } | undefined;
  if (isKind(g?.kind)) return g.kind;
  if (isKind(meta?.kind)) return meta.kind;
  const GUN = /ranged|gun|rifle|pistol|shotgun|sniper|smg|blaster|revolver|ak-?47|m4a1|m16|uzi|mp5|musket|flintlock|carbine|launcher|bazooka|crossbow/i;
  const POLE = /spear|halberd|polearm|lance|glaive|trident|pike/i;
  const HAFT = /axe|hammer|mace|mallet|club|hatchet|pickaxe/i;
  let path = url.split(/[?#]/)[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw string
  }
  const name = path.split('/').pop() ?? '';
  const bow = /bow/i.test(name) && !/crossbow/i.test(name); // crossbows are held like guns
  const words = Array.isArray(meta?.tags) ? meta.tags.join(' ') : '';
  if (words) {
    if (GUN.test(words)) return bow ? 'bow' : 'gun';
    if (/melee|sword|blade|knife|dagger/i.test(words)) return 'blade';
  }
  if (bow) return 'bow';
  // the library's own folder for guns is "weapons/"
  if (GUN.test(name) || /\/assets\/3d\/weapons\//i.test(path)) return 'gun';
  if (POLE.test(name)) return 'polearm';
  if (HAFT.test(name)) return 'hafted';
  return 'blade';
}

/** All triangle vertices of a GLTF scene in the scene's own space (node transforms applied). */
export function sceneVertices(root: THREE.Object3D): Float32Array {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const out: number[] = [];
  const v = new THREE.Vector3();
  const mw = new THREE.Matrix4();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry?.getAttribute('position')) return;
    const pos = m.geometry.getAttribute('position');
    mw.multiplyMatrices(inv, m.matrixWorld);
    const idx = m.geometry.index;
    const cnt = idx ? idx.count : pos.count;
    for (let i = 0; i < cnt; i++) {
      v.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mw);
      out.push(v.x, v.y, v.z);
    }
  });
  return new Float32Array(out);
}

/** Extent of the vertices along `dir` (model units): lo, hi. */
export function extentAlong(pos: Float32Array, dir: V3) {
  const f = new THREE.Vector3(...dir).normalize();
  let lo = Infinity,
    hi = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    const d = pos[i] * f.x + pos[i + 1] * f.y + pos[i + 2] * f.z;
    if (d < lo) lo = d;
    if (d > hi) hi = d;
  }
  return { lo, hi };
}

/**
 * The muzzle end when the values have none (agent8-library contract): the model's front end along
 * forward, on the line through the grip point.
 */
export function frontTip(pos: Float32Array, g: Grip): V3 {
  const f = new THREE.Vector3(...g.forward).normalize();
  const p = new THREE.Vector3(...g.point);
  const { hi } = extentAlong(pos, g.forward);
  const ahead = Number.isFinite(hi) ? hi - p.dot(f) : 0;
  p.addScaledVector(f, ahead);
  return [p.x, p.y, p.z];
}

/**
 * Shape-only fallback: kind comes from the caller (info file tags / URL / override). A model the
 * shape rules cannot read (no triangles, vertices that are not numbers, all in one point) is held
 * by its own origin, +Z forward, +Y up — never a pose that is not finite.
 */
export function estimateGrip(pos: Float32Array, kind: GripKind, lengthM?: number): Grip {
  const length = lengthM ?? DEFAULT_LENGTH_M[kind];
  try {
    // bows have no estimator of their own (library bows carry a grip); the gun rules are the closer fit
    const e = estimate(pos, kind === 'gun' || kind === 'bow' ? 'gun' : 'melee');
    if (isPose(e.grip, e.fwd, e.up)) return { kind, point: e.grip, forward: e.fwd, up: e.up, lengthM: length };
  } catch {
    // nothing to estimate from
  }
  return { kind, point: [0, 0, 0], forward: [0, 0, 1], up: [0, 1, 0], lengthM: length };
}

/**
 * override > info file grip > shape estimate. `kind`, `lengthM` and `muzzleTip` replace the base
 * one by one; a pose override needs all of point / forward / up, or it is ignored (one warning).
 */
export function resolveGrip(pos: Float32Array, opts: { grip?: Grip | null; override?: GripOverride; kind?: GripKind }): Resolved {
  const o = (opts.override ?? {}) as Partial<Grip>;
  const patch: Partial<Grip> = {};
  if (isKind(o.kind)) patch.kind = o.kind;
  if (isLength(o.lengthM)) patch.lengthM = o.lengthM;
  if (isV3(o.muzzleTip)) patch.muzzleTip = o.muzzleTip;
  const posed = o.point !== undefined || o.forward !== undefined || o.up !== undefined;
  if (posed) {
    if (isPose(o.point, o.forward, o.up)) Object.assign(patch, { point: o.point, forward: o.forward, up: o.up });
    else warnOnce('hold: override point / forward / up must be given together (valid vectors); the pose override is ignored');
  }
  const overridden = Object.keys(patch) as (keyof Grip)[];
  let base: Grip;
  if (patch.point) {
    const kind = patch.kind ?? opts.grip?.kind ?? opts.kind ?? 'blade';
    base = { kind, point: patch.point, forward: patch.forward!, up: patch.up!, lengthM: opts.grip?.lengthM ?? DEFAULT_LENGTH_M[kind] };
    if (opts.grip?.muzzleTip) base.muzzleTip = opts.grip.muzzleTip;
  } else if (opts.grip) base = opts.grip;
  else base = estimateGrip(pos, patch.kind ?? opts.kind ?? 'blade', patch.lengthM);
  const source: GripSource = overridden.length ? 'override' : opts.grip ? 'meta' : 'estimate';
  const grip: Grip = { ...base, ...patch };
  if (grip.kind !== 'gun') delete grip.muzzleTip; // the muzzle tip is a gun's only
  return { grip, source, overridden };
}

/**
 * Model (scene coordinates) → canonical held frame in metres (grip at the origin, +Z forward,
 * +Y up). Also the muzzle tip in that frame (`muzzleTip`, else the front end) and the model
 * length along forward; scale = lengthM / that length, for every kind.
 */
export function gripMatrix(pos: Float32Array, g: Grip) {
  const { lo, hi } = extentAlong(pos, g.forward);
  const lengthModel = hi - lo > 0 ? hi - lo : 1;
  const scale = g.lengthM / lengthModel;
  const matrix = canonMatrix(g.forward, g.up, g.point, scale);
  const tip = new THREE.Vector3(...(g.muzzleTip ?? frontTip(pos, g))).applyMatrix4(matrix);
  return { matrix, scale, lengthModel, tip };
}
