// Seeded scenery for the flight stage: shapes scattered on the grass (kept
// off the runway) and bright shapes drifting in circles high in the sky.
// Pure (no React, no three) — World.tsx turns these lists into instanced meshes.

export type Shape = 'box' | 'sphere' | 'cylinder' | 'capsule';

export type GroundDecor = { shape: Shape; x: number; z: number; size: number; height: number; yaw: number; color: string };

export type SkyDecor = {
  shape: Shape;
  size: number;
  color: string;
  /** Circle center and radius, base height, angular speed (rad/s), bob amplitude, start angle. */
  cx: number;
  cz: number;
  r: number;
  y0: number;
  speed: number;
  amp: number;
  a0: number;
};

const GREENS_BROWNS = ['#5a8a38', '#6b9c46', '#88ab6c', '#8b4513', '#a0522d'];
const BRIGHTS = ['#ff4444', '#4477ff', '#ffdd44', '#ffffff', '#ff8833', '#aa66ff', '#44dddd', '#ff77bb'];
const GROUND_SHAPES: Shape[] = ['box', 'sphere', 'cylinder'];
const SKY_SHAPES: Shape[] = ['sphere', 'box', 'capsule'];

/** Ground decor stays at least this far (m) from the runway centerline. */
export const RUNWAY_CLEARANCE = 8;

/** Deterministic 0 … 1 sequence from an integer seed (sin hash — fine for scenery, not for gameplay). */
export function seededRandom(seed: number) {
  let s = seed;
  return (lo = 0, hi = 1) => {
    const v = Math.sin(s++) * 10000;
    return lo + (v - Math.floor(v)) * (hi - lo);
  };
}

const pick = <T>(list: T[], r: number) => list[Math.floor(r) % list.length];

/**
 * `ground` shapes on the half-extent × half-extent grass, `sky` shapes in a
 * 3 × wider square at 100 … 400 m. Same seed, same layout.
 */
export function makeDecor(seed: number, ground: number, sky: number, half = 500) {
  const rand = seededRandom(seed);
  const groundList: GroundDecor[] = [];
  for (let i = 0; i < ground; i++) {
    let x = rand(-half, half);
    if (Math.abs(x) < RUNWAY_CLEARANCE) x = Math.sign(x || 1) * (RUNWAY_CLEARANCE + rand() * (half - RUNWAY_CLEARANCE));
    const z = rand(-half, half);
    const size = rand(1, 4);
    const height = size * rand(0.8, 1.5);
    groundList.push({
      shape: pick(GROUND_SHAPES, rand(0, 3)),
      x,
      z,
      size,
      height,
      yaw: rand(0, Math.PI * 2),
      color: pick(GREENS_BROWNS, rand(0, 5)),
    });
  }
  const skyList: SkyDecor[] = [];
  for (let i = 0; i < sky; i++) {
    skyList.push({
      shape: pick(SKY_SHAPES, rand(0, 3)),
      size: rand(5, 10),
      color: pick(BRIGHTS, rand(0, 8)),
      cx: rand(-3 * half, 3 * half),
      cz: rand(-3 * half, 3 * half),
      y0: rand(100, 400),
      r: rand(10, 20),
      speed: rand(0.1, 0.4),
      amp: rand(1, 5),
      a0: rand(0, Math.PI * 2),
    });
  }
  return { ground: groundList, sky: skyList };
}

/** Where a sky shape is at time t (s). */
export function skyPosition(d: SkyDecor, t: number) {
  const a = d.a0 + d.speed * t;
  return { x: d.cx + Math.cos(a) * d.r, y: d.y0 + Math.sin(a * 0.5 + d.cx) * d.amp, z: d.cz + Math.sin(a) * d.r };
}
