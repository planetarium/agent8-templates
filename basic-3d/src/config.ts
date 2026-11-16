// Game-wide settings. Empty stage: ground, sky, sun and a marker cube under an
// orbit camera — no character.

/** Mount the rapier demo (lazy chunk). Off by default so the first load stays light; `?physics=1` also enables it. */
export const PHYSICS_DEMO = false;

export const STAGE = {
  /** Ground is a size × size box whose top face is y = 0. */
  size: 80,
  /** Clickable grid centered on the origin: `cells` × `cells` squares of `cell` m (odd, so one cell sits on the origin). */
  grid: { cell: 1, cells: 21 },
};

export const CAMERA = {
  position: [8, 7, 10] as [number, number, number],
  fov: 50,
  minDistance: 3,
  maxDistance: 60,
  /** Keep the camera above the ground. */
  maxPolarAngle: Math.PI / 2 - 0.05,
};
