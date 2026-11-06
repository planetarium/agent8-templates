// Game-wide settings. Freeview: 3rd-person orbit camera behind the player.

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
  /** Highest ledge the player walks up without jumping (0.3 m stair steps are walkable). */
  stepHeight: 0.35,
  /** Steepest height-field slope the player walks up (radians); steeper is a wall. */
  maxSlope: (60 * Math.PI) / 180,
  /** Seconds after leaving the ground during which a jump still counts. */
  coyoteTime: 0.12,
  /** Seconds a jump press is remembered (from the moment it was pressed) before landing. */
  jumpBuffer: 0.1,
  /** Falling below this respawns the player. */
  killY: -20,
  spawn: [0, 2, 0] as [number, number, number],
};

export const CAMERA = {
  free: { distance: 8, minDistance: 3, maxDistance: 16, pitch: 0.35, minPitch: -0.1, maxPitch: 1.2, height: 1.2 },
};
