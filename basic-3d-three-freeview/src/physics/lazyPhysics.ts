// Rapier is installed but kept out of the first-load bundle: this dynamic
// import becomes its own chunk (wasm included) that is only fetched when
// loadPhysics() is actually called.
import type * as THREE from 'three';

/** A physics world stepped once per frame; `dispose()` frees it and removes its meshes. */
export type PhysicsSystem = { update(dt: number): void; dispose(): void };

export async function loadPhysics(scene: THREE.Scene): Promise<PhysicsSystem> {
  const { createPhysicsDemo } = await import('./physicsDemo');
  return createPhysicsDemo(scene);
}
