// Level geometry, shared by every variant of this skeleton so benchmarks run
// on the same terrain: axis-aligned boxes, one ramp and one moving platform.
// The renderer (Level.tsx) draws all of it; each variant builds its own
// collision from the same numbers.

export type Box = {
  /** Center [x, y, z] and full size [w, h, d]. */
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
};

export const BOXES: Box[] = [
  // Floor: top face at y = 0.
  { pos: [0, -0.5, 0], size: [80, 1, 80], color: '#7fb069' },
  // Steps along the x axis (z = 0).
  { pos: [4, 0.5, 0], size: [2, 1, 2], color: '#e6aa68' },
  { pos: [7, 1.25, 0], size: [2, 2.5, 2], color: '#ca3c25' },
  { pos: [10.5, 2.5, 0], size: [3, 0.5, 2], color: '#4f6d7a' },
  { pos: [-5, 0.75, 0], size: [2.5, 1.5, 2.5], color: '#e6aa68' },
  // Scenery behind the z = 0 line.
  { pos: [-6, 1, -7], size: [3, 2, 3], color: '#4f6d7a' },
  { pos: [6, 0.5, -9], size: [4, 1, 2], color: '#ca3c25' },
  // Stairs: three 0.3 m steps, walkable without jumping (rise < stepHeight).
  { pos: [1.5, 0.15, -4], size: [1, 0.3, 3], color: '#d9c5a0' },
  { pos: [2.5, 0.3, -4], size: [1, 0.6, 3], color: '#c9b48c' },
  { pos: [3.5, 0.45, -4], size: [1, 0.9, 3], color: '#b9a378' },
  // Landing at the top of the ramp; the moving platform turns around at its edge.
  { pos: [-6, 0.75, 7], size: [2, 1.5, 3], color: '#4f6d7a' },
];

/** A wedge standing on the floor, rising linearly along +x from y = 0 at minX to `height` at maxX. */
export type Ramp = { minX: number; maxX: number; minZ: number; maxZ: number; height: number; color: string };

export const RAMPS: Ramp[] = [
  // 1.5 m over 6 m ≈ 14°.
  { minX: -13, maxX: -7, minZ: 5.5, maxZ: 8.5, height: 1.5, color: '#e6aa68' },
];

/** Ramp surface height at (x, z), or null outside its footprint. */
export function rampHeight(r: Ramp, x: number, z: number): number | null {
  if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) return null;
  return ((x - r.minX) / (r.maxX - r.minX)) * r.height;
}

/** The wedge's 6 corners as flat xyz (low edge, then high edge) — for meshes and convex-hull colliders. */
export function rampVertices(r: Ramp): number[] {
  const { minX: x0, maxX: x1, minZ: z0, maxZ: z1, height: h } = r;
  return [x0, 0, z0, x0, 0, z1, x1, 0, z0, x1, 0, z1, x1, h, z0, x1, h, z1];
}

/** Platform sliding back and forth along x at a constant speed. */
export const PLATFORM = {
  size: [3, 0.3, 3] as [number, number, number],
  /** Height of the top face. */
  top: 2,
  z: 7,
  /** Center x travels between these. */
  minX: -3.5,
  maxX: 2.5,
  speed: 2,
  color: '#8e7dbe',
};

/** Platform center x at time t (s): ping-pong between minX and maxX. */
export function platformX(t: number): number {
  const span = PLATFORM.maxX - PLATFORM.minX;
  const s = (((t * PLATFORM.speed) % (2 * span)) + 2 * span) % (2 * span);
  return s < span ? PLATFORM.minX + s : PLATFORM.maxX - (s - span);
}

export type Aabb = {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  /** Set on moving boxes: displacement at the last update, so whoever stands on it is carried along. */
  moved?: { x: number; y: number; z: number };
};

export function boxAabb({ pos: [x, y, z], size: [w, h, d] }: Pick<Box, 'pos' | 'size'>): Aabb {
  return { minX: x - w / 2, minY: y - h / 2, minZ: z - d / 2, maxX: x + w / 2, maxY: y + h / 2, maxZ: z + d / 2 };
}

/** Moves a platform AABB to time t and records how far it moved since the last update. */
export function updatePlatformAabb(b: Aabb, t: number) {
  const x = platformX(t);
  const [w, h, d] = PLATFORM.size;
  const was = (b.minX + b.maxX) / 2;
  const first = b.moved === undefined;
  Object.assign(b, boxAabb({ pos: [x, PLATFORM.top - h / 2, PLATFORM.z], size: [w, h, d] }));
  b.moved = { x: first ? 0 : x - was, y: 0, z: 0 };
}
