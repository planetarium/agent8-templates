// Game-wide settings. Minecraft: a seeded voxel world, a 3rd-person orbit
// camera behind the player, a crosshair that mines and places blocks.
// Import only plain data here: game modules (world.ts, player.ts, voxel.ts) import config,
// so config importing them back would crash at start (see game/imports.test.ts).
import { CAMERA_PRESETS, type CameraPreset } from './game/cameraPresets';

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
  /** Overwritten with the terrain's spawnPoint() in game/state.ts. */
  spawn: [0, 20, 0] as [number, number, number],
};

/** Camera framing: 'wide' (default here: see the ground you build on), 'follow' or 'shoulder' — see PROJECT/Structure.md. */
const PRESET: CameraPreset = 'wide';

export const CAMERA = {
  preset: PRESET,
  /** The preset's numbers (distance, pitch, eye height, shoulder offset, FOV); tweak them here. */
  free: { ...CAMERA_PRESETS[PRESET] },
  /** While the player is not dragging, swing the camera behind the direction of motion. */
  followYaw: true,
};

export const VOXEL = {
  /** String seed of the terrain (same seed, same world). */
  seed: 'minecraft123-cubemap',
  /** World is size × size columns centered on the origin, up to `height` blocks tall. */
  size: 80,
  height: 48,
  /** Chunk edge (blocks). One mesh per chunk; an edit rebuilds only the chunks it touches. */
  chunk: 10,
  /** Chunks within this many chunks of the player's chunk are meshed and drawn. */
  activeRadius: 3,
};

export const BUILDER = {
  /** Reach (m) from the player's eye for mining and placing. */
  range: 15,
  /** A click that moved the pointer more than this many pixels was a camera drag. */
  clickSlop: 4,
};
