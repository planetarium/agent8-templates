// Game-wide settings. Quarterview: a fixed, high-angle camera follows the
// player; it never rotates and movement is along the world axes.

/** Mount the rapier demo (lazy chunk). Off by default so the first load stays light; `?physics=1` also enables it. */
export const PHYSICS_DEMO = false;

export const PLAYER = {
  radius: 0.35,
  height: 1.6,
  walkSpeed: 2.5,
  runSpeed: 6,
  groundAccel: 60,
  airAccel: 24,
  jumpVelocity: 9,
  gravity: 26,
  maxFall: 30,
  /** Highest ledge the player walks up without jumping (stairs are 0.3). */
  stepHeight: 0.35,
  /** Seconds after leaving the ground during which a jump still counts. */
  coyoteTime: 0.12,
  /** Seconds a jump press is remembered (from the moment it was pressed) before landing. */
  jumpBuffer: 0.1,
  /** Falling below this respawns the player. */
  killY: -20,
  spawn: [0, 2, 0] as [number, number, number],
};

export const CAMERA = {
  /**
   * Looks down `pitch` radians from the +z side (yaw 0, so screen up = world −z).
   * A narrow `fov` from far away flattens perspective toward the isometric look.
   */
  quarter: { pitch: Math.PI / 4, distance: 24, minDistance: 14, maxDistance: 40, fov: 30, portraitFov: 45, height: 0.8 },
};
