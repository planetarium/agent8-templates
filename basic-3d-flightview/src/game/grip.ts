// Weapon grip values -> a prop in the hand. Used by components/models/HeldProp.tsx.
// Grip (the `grip` key of an asset info file, see assetMeta.ts):
//   kind: gun | blade | hafted | polearm
//   point: fist centre, gltf.scene coordinates (GLTFLoader scene, node transforms applied)
//   forward: muzzle / tip / head (unit), up: sights (gun) or edge / striking face (melee) (unit)
//   lengthM: real length in metres (extent of the vertices along `forward`), review: checked | low
// Resolution order: game override > info file grip > shape estimate at runtime (gripEstimate.ts).
import * as THREE from 'three';
import type { AssetMeta } from './assetMeta';
import { canonMatrix, estimate } from './gripEstimate';
import { warnOnce } from './hold';

export const GRIP_KINDS = ['gun', 'blade', 'hafted', 'polearm'] as const;
export type GripKind = (typeof GRIP_KINDS)[number];
export type V3 = [number, number, number];
export type Grip = { kind: GripKind; point: V3; forward: V3; up: V3; lengthM: number; review?: 'checked' | 'low' };
export type GripSource = 'override' | 'meta' | 'estimate';
/**
 * What a game may replace. `kind` and `lengthM` alone; the pose (`point`, `forward`, `up`) only as
 * all three together, so a later fix of the info file can't mix with half of an old pose.
 */
export type GripOverride = { kind?: GripKind; lengthM?: number } & ({ point: V3; forward: V3; up: V3 } | { point?: never; forward?: never; up?: never });
export type Resolved = { grip: Grip; source: GripSource; overridden: (keyof Grip)[] };

/** Used only when nothing says how long the weapon is (estimate path, no override). */
export const DEFAULT_LENGTH_M: Record<GripKind, number> = { gun: 0.7, blade: 0.9, hafted: 0.6, polearm: 1.8 };

const isKind = (k: unknown): k is GripKind => GRIP_KINDS.includes(k as GripKind);
const isV3 = (a: unknown): a is V3 => Array.isArray(a) && a.length === 3 && a.every((x) => typeof x === 'number' && Number.isFinite(x));
const isLength = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;
/** forward and up: non-zero, not parallel. */
function isPose(point: unknown, forward: unknown, up: unknown): boolean {
  if (!isV3(point) || !isV3(forward) || !isV3(up)) return false;
  const f = new THREE.Vector3(...forward), u = new THREE.Vector3(...up);
  if (f.lengthSq() < 1e-12 || u.lengthSq() < 1e-12) return false;
  return Math.abs(f.normalize().dot(u.normalize())) < 0.99;
}

/** The grip of an info file, validated; null when absent / malformed. */
export function gripFromMeta(meta: AssetMeta | null | undefined): Grip | null {
  const g = meta?.grip as Partial<Grip> | undefined;
  if (!g || typeof g !== 'object') return null;
  if (!isKind(g.kind) || !isPose(g.point, g.forward, g.up) || !isLength(g.lengthM)) return null;
  return g as Grip;
}

/**
 * Weapon kind when there is no usable grip: the info file's `grip.kind` / `kind`, then its tags
 * ("weapons ranged" → gun, "weapons melee" → blade). An asset with no info file (generated models)
 * falls back to words in its URL — a stopgap until those carry info files; pass `kind` on `hold`
 * when it guesses wrong. Anything else (torch, staff, tool) is held like a blade, tip up out of the fist.
 */
export function kindOf(meta: AssetMeta | null | undefined, url: string): GripKind {
  const g = meta?.grip as { kind?: unknown } | undefined;
  if (isKind(g?.kind)) return g.kind;
  if (isKind(meta?.kind)) return meta.kind;
  const GUN = /ranged|gun|rifle|pistol|shotgun|sniper|smg|blaster|revolver|ak-?47|m4a1|m16|uzi|mp5|musket|flintlock|carbine|launcher|bazooka/i;
  const POLE = /spear|halberd|polearm|lance|glaive|trident|pike/i;
  const HAFT = /axe|hammer|mace|mallet|club|hatchet|pickaxe/i;
  const words = Array.isArray(meta?.tags) ? meta.tags.join(' ') : '';
  if (words) {
    if (GUN.test(words)) return 'gun';
    if (/melee|sword|blade|knife|dagger/i.test(words)) return 'blade';
  }
  // stopgap: no info file kind / tags
  const name = decodeURIComponent(url.split(/[?#]/)[0]).split('/').slice(-2).join('/');
  if (GUN.test(name)) return 'gun';
  if (POLE.test(name)) return 'polearm';
  if (HAFT.test(name)) return 'hafted';
  return 'blade';
}

/** All triangles of a GLTF scene in the scene's own space (node transforms applied). */
export function sceneTriangles(root: THREE.Object3D): Float32Array {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const out: number[] = [];
  const v = new THREE.Vector3();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const g = m.geometry;
    const pos = g.getAttribute('position');
    const mw = inv.clone().multiply(m.matrixWorld);
    const idx = g.index;
    const cnt = idx ? idx.count : pos.count;
    for (let i = 0; i < cnt; i++) {
      v.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mw);
      out.push(v.x, v.y, v.z);
    }
  });
  return new Float32Array(out);
}

/** Extent of the vertices along `dir` (model units). */
export function extentAlong(pos: Float32Array, dir: V3) {
  const f = new THREE.Vector3(...dir).normalize();
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    const d = pos[i] * f.x + pos[i + 1] * f.y + pos[i + 2] * f.z;
    if (d < lo) lo = d;
    if (d > hi) hi = d;
  }
  return hi - lo;
}

/** Shape-only fallback. */
export function estimateGrip(scene: THREE.Object3D, kind: GripKind, lengthM?: number): Grip {
  const e = estimate(sceneTriangles(scene), kind === 'gun' ? 'gun' : 'melee');
  return { kind, point: e.grip, forward: e.fwd, up: e.up, lengthM: lengthM ?? DEFAULT_LENGTH_M[kind] };
}

/** override > info file grip > estimate. A pose override needs all of point / forward / up, or it is ignored. */
export function resolveGrip(scene: THREE.Object3D, opts: { grip?: Grip | null; override?: GripOverride; kind?: GripKind }): Resolved {
  const o = (opts.override ?? {}) as Partial<Grip>;
  const patch: Partial<Grip> = {};
  if (isKind(o.kind)) patch.kind = o.kind;
  if (isLength(o.lengthM)) patch.lengthM = o.lengthM;
  const posed = o.point !== undefined || o.forward !== undefined || o.up !== undefined;
  if (posed) {
    if (isPose(o.point, o.forward, o.up)) Object.assign(patch, { point: o.point, forward: o.forward, up: o.up });
    else warnOnce('hold: override point / forward / up must be given together (valid vectors); the pose override is ignored');
  }
  const overridden = Object.keys(patch) as (keyof Grip)[];
  let base: Grip;
  if (patch.point) {
    base = { kind: patch.kind ?? opts.grip?.kind ?? opts.kind ?? 'blade', point: patch.point, forward: patch.forward!, up: patch.up!, lengthM: patch.lengthM ?? opts.grip?.lengthM ?? 0 };
    if (!(base.lengthM > 0)) base.lengthM = DEFAULT_LENGTH_M[base.kind];
  } else if (opts.grip) base = opts.grip;
  else base = estimateGrip(scene, patch.kind ?? opts.kind ?? 'blade', patch.lengthM);
  const source: GripSource = opts.grip ? 'meta' : 'estimate';
  if (!overridden.length) return { grip: base, source, overridden };
  return { grip: { ...base, ...patch }, source: 'override', overridden };
}

/**
 * Canonical weapon frame (grip = origin, +Z = forward, +Y = up, metres) -> hand frame
 * (X = where a pointed index finger points, Y = knuckle line pinky → index, Z = X × Y).
 * gun: muzzle along the finger, sights up the knuckle line. melee: tip out of the top of the fist,
 * edge toward the finger direction.
 */
export function handMap(kind: GripKind) {
  const m = new THREE.Matrix4();
  if (kind === 'gun') m.makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
  else m.makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
  return m;
}

/** Model length along forward (model units) and the matrix model -> hand frame. */
export function gripMatrix(scene: THREE.Object3D, g: Grip) {
  const lengthModel = extentAlong(sceneTriangles(scene), g.forward);
  const scale = lengthModel > 0 ? g.lengthM / lengthModel : 1;
  const m = handMap(g.kind).multiply(canonMatrix(g.forward, g.up, g.point, scale));
  return { matrix: m, scale, lengthModel };
}

/** The prop group to hand to holdInHand: model inside, matrix baked, named for lookups. */
export function gripProp(model: THREE.Object3D, g: Grip) {
  const { matrix, scale, lengthModel } = gripMatrix(model, g);
  const prop = new THREE.Group();
  prop.name = 'held-prop';
  prop.matrixAutoUpdate = false;
  prop.matrix.copy(matrix);
  prop.add(model);
  prop.userData = { grip: g, scale, lengthModel };
  return prop;
}
