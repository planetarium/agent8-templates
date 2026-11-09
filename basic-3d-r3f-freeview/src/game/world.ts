// Level geometry. The renderer (Level.tsx) draws it and the player
// (player.ts) collides with it, so adding an entry here adds a visible,
// standable surface. The stage starts empty — just the floor:
// - obstacles, stairs, ledges: boxes in BOXES
// - slopes: wedges in RAMPS
// - terrain: height fields in FIELDS (heightAt(x, z) over a rectangle)
// - moving platforms: an Aabb that records `moved` (see updatePlatformAabb)
// PROJECT/Structure.md has a short example of each.
// Lay courses out from the spawn toward −z (away from the start camera);
// x is the course's width.

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

/**
 * A wedge standing on the floor, rising linearly from y = 0 to `height`
 * along `dir` (default '+x'). '-z' rises away from the start camera: low
 * edge at maxZ, high edge at minZ.
 */
export type Ramp = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  color: string;
  dir?: '+x' | '-x' | '+z' | '-z';
};

export const RAMPS: Ramp[] = [];

/** How far up the ramp (x, z) is, 0 at the low edge … 1 at the high edge. */
function rise(r: Ramp, x: number, z: number) {
  switch (r.dir ?? '+x') {
    case '+x':
      return (x - r.minX) / (r.maxX - r.minX);
    case '-x':
      return (r.maxX - x) / (r.maxX - r.minX);
    case '+z':
      return (z - r.minZ) / (r.maxZ - r.minZ);
    case '-z':
      return (r.maxZ - z) / (r.maxZ - r.minZ);
  }
}

/** Ramp surface height at (x, z), or null outside its footprint. */
export function rampHeight(r: Ramp, x: number, z: number): number | null {
  if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) return null;
  return rise(r, x, z) * r.height;
}

/**
 * The wedge's 6 corners as flat xyz (low edge, then high edge bottom, then
 * high edge top) — for meshes and convex-hull colliders. Each `dir` is the
 * '+x' wedge turned about y, so the triangle winding stays outward.
 */
export function rampVertices(r: Ramp): number[] {
  const { minX: x0, maxX: x1, minZ: z0, maxZ: z1, height: h } = r;
  // (u along the rise, w across it) → (x, z)
  const at = (u: number, w: number): [number, number] => {
    switch (r.dir ?? '+x') {
      case '+x':
        return [x0 + u * (x1 - x0), z0 + w * (z1 - z0)];
      case '-z':
        return [x0 + w * (x1 - x0), z1 - u * (z1 - z0)];
      case '-x':
        return [x1 - u * (x1 - x0), z1 - w * (z1 - z0)];
      case '+z':
        return [x1 - w * (x1 - x0), z0 + u * (z1 - z0)];
    }
  };
  const out: number[] = [];
  for (const [u, w, y] of [
    [0, 0, 0],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, h],
    [1, 1, h],
  ]) {
    const [x, z] = at(u, w);
    out.push(x, y, z);
  }
  return out;
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

/**
 * A box sliding back and forth at a constant speed: along z (center z
 * between minZ and maxZ at a fixed x — a ferry along a forward course) or
 * along x (center x between minX and maxX at a fixed z).
 */
export type Platform = {
  size: [number, number, number];
  /** Height of the top face. */
  top: number;
  speed: number;
} & ({ x: number; minZ: number; maxZ: number } | { z: number; minX: number; maxX: number });

/** Ping-pong between lo and hi at `speed`, at time t (s). */
function pingPong(lo: number, hi: number, speed: number, t: number) {
  const span = hi - lo;
  const s = (((t * speed) % (2 * span)) + 2 * span) % (2 * span);
  return s < span ? lo + s : hi - (s - span);
}

/** Platform center (x, z) at time t (s). */
export function platformCenter(p: Platform, t: number): { x: number; z: number } {
  if ('minZ' in p) return { x: p.x, z: pingPong(p.minZ, p.maxZ, p.speed, t) };
  return { x: pingPong(p.minX, p.maxX, p.speed, t), z: p.z };
}

/** Moves a platform AABB to time t and records how far it moved since the last update. */
export function updatePlatformAabb(b: Aabb, p: Platform, t: number) {
  const c = platformCenter(p, t);
  const [w, h, d] = p.size;
  const wasX = (b.minX + b.maxX) / 2;
  const wasZ = (b.minZ + b.maxZ) / 2;
  const first = b.moved === undefined;
  Object.assign(b, boxAabb({ pos: [c.x, p.top - h / 2, c.z], size: [w, h, d] }));
  b.moved = first ? { x: 0, y: 0, z: 0 } : { x: c.x - wasX, y: 0, z: c.z - wasZ };
}
