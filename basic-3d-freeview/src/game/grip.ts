// How a weapon / tool model is held: its grip values, where they come from, and the matrix that
// turns the model into the canonical held frame (grip point at the origin, +Z = muzzle / tip,
// +Y = sights / edge, metres).
//
// Grip values (agent8-library metadata `grip`, plus `muzzleTip`), all in the GLB scene's own
// coordinates (node transforms applied):
//   kind: gun | blade | hafted | polearm
//   point: where the fist closes (gun: the pistol grip)
//   forward: muzzle / tip / head direction (unit), up: sights (gun) or edge / striking face (unit)
//   lengthM: real length in metres, along `forward`
//   muzzleTip: the muzzle end (gun), where a shot starts
// Resolution: game override > the value for the weapon URL (grips.json, generated from the
// library by scripts/grips.mjs) > a shape estimate.
import * as THREE from 'three';
import { canonMatrix, estimate } from './gripEstimate';
import TABLE from './grips.json';

export type GripKind = 'gun' | 'blade' | 'hafted' | 'polearm';
export type V3 = [number, number, number];
export type Grip = { kind: GripKind; point: V3; forward: V3; up: V3; lengthM: number; muzzleTip?: V3 };
export type GripSource = 'override' | 'library' | 'estimate';
export type Resolved = { grip: Grip; source: GripSource };

const KINDS: GripKind[] = ['gun', 'blade', 'hafted', 'polearm'];

/** Used only when nothing says how long the weapon is (estimate path, no override). */
export const DEFAULT_LENGTH_M: Record<GripKind, number> = { gun: 0.7, blade: 0.9, hafted: 0.6, polearm: 1.8 };

/**
 * The library path of a model URL ("weapons/ak47.glb", "objects/weapons ranged/x.glb"): the part
 * after /assets/3d/, URL-decoded, lower case (the CDN serves both 3d and 3D, raw and %20 spaces).
 */
export function libraryKey(url: string): string | null {
  let path = url;
  try {
    path = decodeURIComponent(new URL(url, 'http://x').pathname);
  } catch {
    // not a URL: match the raw string
  }
  const m = path.match(/\/assets\/3d\/(.+\.glb)$/i);
  return m ? m[1].toLowerCase() : null;
}

const v3 = (a: unknown): a is V3 => Array.isArray(a) && a.length === 3 && a.every((x) => typeof x === 'number' && Number.isFinite(x));

/** A grip object if it is well formed (unit-ish vectors, positive length), else null. */
export function validGrip(g: unknown): Grip | null {
  const o = g as Partial<Grip> | null | undefined;
  if (!o || !KINDS.includes(o.kind as GripKind) || !v3(o.point) || !v3(o.forward) || !v3(o.up)) return null;
  if (!(typeof o.lengthM === 'number' && o.lengthM > 0 && o.lengthM < 20)) return null;
  const f = new THREE.Vector3(...o.forward), u = new THREE.Vector3(...o.up);
  if (f.lengthSq() < 1e-6 || u.lengthSq() < 1e-6 || f.normalize().cross(u.normalize()).lengthSq() < 1e-4) return null;
  if (o.muzzleTip !== undefined && !v3(o.muzzleTip)) return null;
  return { kind: o.kind as GripKind, point: o.point, forward: o.forward, up: o.up, lengthM: o.lengthM, ...(o.muzzleTip ? { muzzleTip: o.muzzleTip } : {}) };
}

const GRIPS = (TABLE as { grips: Record<string, unknown> }).grips;

/** The library's grip for a weapon URL, or null when the table does not have it. */
export function gripForUrl(url: string): Grip | null {
  const key = libraryKey(url);
  return key ? validGrip(GRIPS[key]) : null;
}

/** Kind from the URL alone (table first, then the folder / file name). */
export function kindOf(url: string): GripKind {
  const g = gripForUrl(url);
  if (g) return g.kind;
  const k = (libraryKey(url) ?? url).toLowerCase();
  if (/weapons ranged|^weapons\/|gun|rifle|pistol|revolver|blaster|carbine|smg|launcher/.test(k)) return 'gun';
  if (/spear|halberd|glaive|polearm|trident|lance|pike|staff/.test(k)) return 'polearm';
  if (/axe|hammer|mace|club|maul|hatchet/.test(k)) return 'hafted';
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
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    const d = pos[i] * f.x + pos[i + 1] * f.y + pos[i + 2] * f.z;
    if (d < lo) lo = d;
    if (d > hi) hi = d;
  }
  return { lo, hi };
}

/** The muzzle end when the values have none: centre of the vertices in the front 2 % along forward. */
export function frontTip(pos: Float32Array, g: Grip): V3 {
  const f = new THREE.Vector3(...g.forward).normalize();
  const { lo, hi } = extentAlong(pos, g.forward);
  const cut = hi - 0.02 * (hi - lo);
  const c = new THREE.Vector3();
  let n = 0;
  for (let i = 0; i < pos.length; i += 3) {
    if (pos[i] * f.x + pos[i + 1] * f.y + pos[i + 2] * f.z >= cut) {
      c.x += pos[i]; c.y += pos[i + 1]; c.z += pos[i + 2];
      n++;
    }
  }
  if (!n) return [g.point[0] + f.x * (hi - lo), g.point[1] + f.y * (hi - lo), g.point[2] + f.z * (hi - lo)];
  c.divideScalar(n);
  return [c.x, c.y, c.z];
}

/** Shape-only fallback: kind comes from the caller (URL / override). */
export function estimateGrip(pos: Float32Array, kind: GripKind, lengthM?: number): Grip {
  const e = estimate(pos, kind === 'gun' ? 'gun' : 'melee');
  return { kind, point: e.grip, forward: e.fwd, up: e.up, lengthM: lengthM ?? DEFAULT_LENGTH_M[kind] };
}

/**
 * override > the URL's library value > shape estimate. A partial override replaces only the
 * fields it names (on top of the library value or the estimate); a full one is used as-is.
 */
export function resolveGrip(pos: Float32Array, opts: { url: string; override?: Partial<Grip>; kind?: GripKind }): Resolved {
  const o = opts.override ?? {};
  const full = validGrip(o);
  if (full) return { grip: full, source: 'override' };
  const lib = gripForUrl(opts.url);
  const kind = o.kind ?? opts.kind ?? lib?.kind ?? kindOf(opts.url);
  const base = lib ?? estimateGrip(pos, kind, o.lengthM);
  const touched = Object.keys(o).length > 0;
  const merged = validGrip({ ...base, ...o }) ?? base;
  return { grip: merged, source: touched ? 'override' : lib ? 'library' : 'estimate' };
}

/**
 * Model (scene coordinates) → canonical held frame in metres (grip at the origin, +Z forward,
 * +Y up). Also the muzzle tip in that frame and the model length along forward.
 */
export function gripMatrix(pos: Float32Array, g: Grip) {
  const { lo, hi } = extentAlong(pos, g.forward);
  const lengthModel = hi - lo || 1;
  const scale = g.lengthM / lengthModel;
  const matrix = canonMatrix(g.forward, g.up, g.point, scale);
  const tip = new THREE.Vector3(...(g.muzzleTip ?? frontTip(pos, g))).applyMatrix4(matrix);
  return { matrix, scale, lengthModel, tip };
}
