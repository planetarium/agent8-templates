// Game-wide settings. Flightview: a kinematic airplane over a runway, grass
// and sea, followed by a banking chase camera — no character.

/** Mount the rapier demo (lazy chunk). Off by default so the first load stays light; `?physics=1` also enables it. */
export const PHYSICS_DEMO = false;

/** Flight feel. Values carried over from the Incanto basic-3d-flightview template. */
export const FLIGHT = {
  /** Top speed (m/s) — the HUD tops out at 432 km/h. */
  maxSpeed: 120,
  /** Throttle up / down (m/s per s). */
  speedUp: 20,
  speedDown: 80,
  /** Pitch rate (rad/s) at full stick. */
  pitchSpeed: 0.5,
  /** Roll rate (rad/s) at full stick is rollSpeed × 0.5. */
  rollSpeed: Math.PI / 2,
  /** Yaw acceleration (rad/s²) while Q / E is held; decays when released. */
  yawAccel: 0.3,
  /** On the ground, pitch / roll / yaw authority grows linearly up to this speed (m/s). */
  fullRotationSpeed: 20,
  /** Above this height (m, plane origin over the ground) the plane counts as airborne. */
  groundAltitude: 1.0,
  /** Lowest height of the plane origin over the ground: the wheels sit on the runway. */
  restHeight: 0.3,
};

export const GUN = {
  /** Bullet speed (m/s), life (ms) and the minimum time between shots (ms). */
  bulletSpeed: 200,
  bulletLifeMs: 500,
  cooldownMs: 200,
};

export const CAMERA = {
  /** Chase offset in the plane's frame: up, and behind (+z, the plane flies along -z). */
  offset: [0, 3, 15] as [number, number, number],
  /** Fraction of the way the camera's attitude turns toward the plane's per 1/60 s. */
  slerp: 0.08,
  /** Position follow rate (1/s). */
  follow: 5,
  fov: 30,
  /** Portrait screens get a wider FOV. */
  portraitFov: 50,
  far: 5000,
};

export const WORLD = {
  /** Grass square (m), sea square (m) — the sea sits 1 m below the grass. */
  grass: 1000,
  sea: 10000,
  runway: { width: 6, length: 1000, stripes: 100 },
  /** Seeded decorations: boxes / spheres / cylinders on the grass, bright shapes drifting in the sky. */
  decor: { seed: 12345, ground: 500, sky: 150 },
};
