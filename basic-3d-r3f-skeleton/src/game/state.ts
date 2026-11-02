// Shared mutable game state, read every frame (never put this in React state).
import { CAMERA } from '../config';
import { createPlayer } from './player';

/** The one player simulation. Camera, lights and HUD read it; only <Player> writes it. */
export const player = createPlayer();

/** Freeview orbit angles. CameraRig writes them, Player reads yaw for camera-relative movement. */
export const rig = { yaw: 0, pitch: CAMERA.free.pitch, distance: CAMERA.free.distance };
