// Shared mutable game state, read every frame (never put this in React state).
import { CAMERA, PLAYER } from '../config';
import type { MoveLatch } from './camera';
import { createPlayer } from './player';
import { GRASS, createWorld, spawnPoint, type Block, type ChunkKey, type RayHit } from './voxel';

/** The voxel world. <Builder> edits it, <Terrain> draws it, <Player> collides with it. */
export const world = createWorld();

// Start (and respawn) on the highest column near the origin.
PLAYER.spawn = spawnPoint(world);

/** The one player simulation. Camera, lights and HUD read it; only <Player> writes it. */
export const player = createPlayer();

/** Orbit camera. CameraRig writes it, Player reads it for camera-relative movement. */
export const rig = {
  yaw: 0,
  pitch: CAMERA.free.pitch,
  /** Wanted distance (wheel zoom). */
  distance: CAMERA.free.distance,
  /** Distance this frame: shorter while blocks are between the player and the camera. */
  reach: CAMERA.free.distance,
  /** Clock seconds of the last camera drag (auto-follow waits after it). */
  draggedAt: -Infinity,
  /** Movement basis held while a direction is held (see latchMoveYaw). */
  latch: { yaw: 0, ax: 0, ay: 0 } as MoveLatch,
};

export const builder = {
  /** Block the next placement uses. */
  selected: GRASS as Block,
  /** Block under the crosshair (within reach), or null. <Builder> updates it every frame. */
  target: null as RayHit | null,
  /** Chunks whose mesh must be rebuilt. Edits add to it, <Terrain> drains it. */
  dirty: new Set<ChunkKey>(),
  /** Bumped on every edit, for HUD / sound hooks. */
  edits: 0,
};

// Dev server only: inspect the game from the browser console (`game.player.pos`, `game.world`).
if (import.meta.env.DEV) Object.assign(window, { game: { world, player, rig, builder } });
