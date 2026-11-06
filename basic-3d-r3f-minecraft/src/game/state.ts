// Shared mutable game state, read every frame (never put this in React state).
import { CAMERA, PLAYER } from '../config';
import { createPlayer } from './player';
import { GRASS, createWorld, spawnPoint, type Block, type ChunkKey, type RayHit } from './voxel';

/** The voxel world. <Builder> edits it, <Terrain> draws it, <Player> collides with it. */
export const world = createWorld();

// Start (and respawn) on the highest column near the origin.
PLAYER.spawn = spawnPoint(world);

/** The one player simulation. Camera, lights and HUD read it; only <Player> writes it. */
export const player = createPlayer();

/** Orbit angles. CameraRig writes them, Player reads yaw for camera-relative movement. */
export const rig = { yaw: 0, pitch: CAMERA.free.pitch, distance: CAMERA.free.distance };

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
