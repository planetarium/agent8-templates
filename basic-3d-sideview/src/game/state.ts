// Shared mutable game state, read every frame (never put this in React state).
import { createPlayer } from './player';

/** The one player simulation. Camera, lights and HUD read it; only <Player> writes it. */
export const player = createPlayer();
// Start facing +x (into the course) instead of toward the camera.
player.facing = Math.PI / 2;
