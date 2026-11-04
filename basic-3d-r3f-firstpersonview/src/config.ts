// Game-wide settings. First-person view: the camera is the player's eyes,
// mouse look (pointer lock) or drag to turn.

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
  fp: {
    /** Eye height above the feet. */
    eyeHeight: 1.5,
    /** Start yaw: looking along +x (toward the stairs), turned a little toward −z. */
    yaw: -Math.PI / 2 + 0.35,
    minPitch: -1.45,
    maxPitch: 1.45,
    /** Radians per pixel. */
    mouseSensitivity: 0.0022,
    touchSensitivity: 0.006,
    fov: 70,
    portraitFov: 85,
  },
};
