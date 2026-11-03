// Game-wide settings. This variant is freeview (3rd-person orbit) only; the
// player is an ecctrl character on an always-on rapier world.

export const PLAYER = {
  radius: 0.35,
  height: 1.6,
  walkSpeed: 2.5,
  runSpeed: 6,
  /** ecctrl jumpVel. With rapier's 9.81 gravity this peaks at ~1.55 m, like the kinematic variant (measured). */
  jumpVelocity: 4.9,
  /** ecctrl floats the capsule this far above the ground (spring); it also lets the capsule ride up steps. */
  floatHeight: 0.3,
  /** Falling below this respawns the player. */
  killY: -20,
  spawn: [0, 2, 0] as [number, number, number],
};

export const CAMERA = {
  free: { distance: 8, minDistance: 3, maxDistance: 16, pitch: 0.35, minPitch: -0.1, maxPitch: 1.2, height: 1.2 },
};
