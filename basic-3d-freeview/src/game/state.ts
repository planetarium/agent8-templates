// Shared mutable game state, read every frame (never put this in React state).
import { CAMERA } from '../config';
import type { MoveLatch } from './camera';
import { createPlayer } from './player';

/** The one player simulation. Camera, lights and HUD read it; only <Player> writes it. */
export const player = createPlayer();

/** Orbit camera. CameraRig writes it, Player reads it for camera-relative movement. */
export const rig = {
  yaw: 0,
  pitch: CAMERA.free.pitch,
  /** Wanted distance (wheel zoom). */
  distance: CAMERA.free.distance,
  /** Distance this frame: shorter while something is between the player and the camera. */
  reach: CAMERA.free.distance,
  /** Clock seconds of the last camera drag (auto-follow waits after it). */
  draggedAt: -Infinity,
  /** Movement basis held while a direction is held (see latchMoveYaw). */
  latch: { yaw: 0, ax: 0, ay: 0 } as MoveLatch,
};
