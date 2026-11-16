// Shared mutable game state, read every frame (never put this in React state).
import { CAMERA } from '../config';
import { createPlayer } from './player';

/** The one player simulation. Camera, lights and HUD read it; only <Player> writes it. */
export const player = createPlayer();

/** Camera zoom. CameraRig writes it (wheel); angle is fixed in CAMERA.quarter. */
export const rig = { distance: CAMERA.quarter.distance };
