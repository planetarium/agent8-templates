// Shared mutable game state, read every frame (never put this in React state).
import { createFlight, createGun } from './flight';

/** The one plane simulation. Camera, sun and HUD read it; only <Airplane> writes it. */
export const plane = createFlight();

/** Live bullets. <Airplane> fires and moves them, <Bullets> draws them. */
export const gun = createGun();
