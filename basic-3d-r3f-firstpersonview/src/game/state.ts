// Shared mutable game state, read every frame (never put this in React state).
import { CAMERA } from '../config';
import { createPlayer } from './player';

/** The one player simulation. Camera, lights and HUD read it; only <Player> writes it. */
export const player = createPlayer();

/** Look angles (yaw 0 = looking along −z). CameraRig writes them, Player reads yaw for view-relative movement. */
export const rig = { yaw: CAMERA.fp.yaw, pitch: 0 };
