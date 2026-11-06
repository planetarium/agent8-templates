// Level geometry. The renderer (Level.tsx) draws it and the player
// (player.ts) collides with it, so adding an entry here adds a visible,
// standable surface. The stage starts empty — just the floor:
// - obstacles, stairs, ledges: boxes in BOXES
// - slopes: wedges in RAMPS
// - terrain: height fields in FIELDS (heightAt(x, z) over a rectangle)
// - moving platforms: an Aabb that records `moved` (see updatePlatformAabb)
// PROJECT/Structure.md has a short example of each.

export type Box = {
  /** Center [x, y, z] and full size [w, h, d]. */
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
};

export const BOXES: Box[] = [
  // Floor: top face at y = 0.
  { pos: [0, -0.5, 0], size: [80, 1, 80], color: '#7fb069' },
];

/** A wedge standing on the floor, rising linearly along +x from y = 0 at minX to `height` at maxX. */
export type Ramp = { minX: number; maxX: number; minZ: number; maxZ: number; height: number; color: string };

export const RAMPS: Ramp[] = [];

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

/**
 * Terrain: a surface height for every (x, z) inside the rectangle. The player
 * stands on it like on a ramp; slopes steeper than PLAYER.maxSlope are walls.
 * `heightAt` must be cheap (it runs several times per substep) and continuous
 * wherever the player should walk.
 */
export type HeightField = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  heightAt: (x: number, z: number) => number;
  /** Mesh color in Level.tsx. */
  color?: string;
};

export const FIELDS: HeightField[] = [];

/** Height-field surface at (x, z), or null outside its rectangle. */
export function fieldHeight(f: HeightField, x: number, z: number): number | null {
  if (x < f.minX || x > f.maxX || z < f.minZ || z > f.maxZ) return null;
  return f.heightAt(x, z);
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

/** A box sliding back and forth along x at a constant speed. */
export type Platform = {
  size: [number, number, number];
  /** Height of the top face. */
  top: number;
  z: number;
  /** Center x travels between these. */
  minX: number;
  maxX: number;
  speed: number;
};

/** Platform center x at time t (s): ping-pong between minX and maxX. */
export function platformX(p: Platform, t: number): number {
  const span = p.maxX - p.minX;
  const s = (((t * p.speed) % (2 * span)) + 2 * span) % (2 * span);
  return s < span ? p.minX + s : p.maxX - (s - span);
}

/** Moves a platform AABB to time t and records how far it moved since the last update. */
export function updatePlatformAabb(b: Aabb, p: Platform, t: number) {
  const x = platformX(p, t);
  const [w, h, d] = p.size;
  const was = (b.minX + b.maxX) / 2;
  const first = b.moved === undefined;
  Object.assign(b, boxAabb({ pos: [x, p.top - h / 2, p.z], size: [w, h, d] }));
  b.moved = { x: first ? 0 : x - was, y: 0, z: 0 };
}
