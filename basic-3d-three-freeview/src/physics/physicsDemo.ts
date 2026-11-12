// Example rapier world: crates that fall and stack on the floor. Only loaded
// through lazyPhysics, so rapier and its wasm stay out of the first load.
// Build dynamic bodies here (anything that should roll, tip over or be
// pushed). The floor collider matches the 80 × 80 floor whose top is y = 0.
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import type { PhysicsSystem } from './lazyPhysics';

const CRATES: [number, number, number][] = [
  [-2, 4, -3],
  [-1.6, 6, -3.2],
  [-2.2, 8, -2.8],
  [2, 5, -4],
];
/** Fixed physics step (s), like @react-three/rapier's default. */
const STEP = 1 / 60;

export async function createPhysicsDemo(scene: THREE.Scene): Promise<PhysicsSystem> {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -26, z: 0 });
  world.timestep = STEP;
  world.createCollider(RAPIER.ColliderDesc.cuboid(40, 0.5, 40).setTranslation(0, -0.5, 0));

  const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const material = new THREE.MeshStandardMaterial({ color: '#b5835a' });
  const crates = CRATES.map(([x, y, z]) => {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.4, 0.4, 0.4), body);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return { body, mesh };
  });

  let acc = 0;
  return {
    update(dt) {
      acc = Math.min(acc + dt, 0.25);
      while (acc >= STEP) {
        world.step();
        acc -= STEP;
      }
      for (const { body, mesh } of crates) {
        const t = body.translation();
        const r = body.rotation();
        mesh.position.set(t.x, t.y, t.z);
        mesh.quaternion.set(r.x, r.y, r.z, r.w);
      }
    },
    dispose() {
      for (const { mesh } of crates) scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      world.free();
    },
  };
}
