// Rapier colliders for the level in game/world.ts. The meshes are drawn by
// Level.tsx; this only adds the physics: fixed boxes and ramps, and the moving
// platform as a kinematic body (ecctrl carries a character standing on it).
import { useRef } from 'react';
import {
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
  useBeforePhysicsStep,
  type RapierRigidBody,
} from '@react-three/rapier';
import { PlatformMesh } from '../components/Level';
import { BOXES, PLATFORM, RAMPS, platformX, rampVertices } from '../game/world';

const PLATFORM_Y = PLATFORM.top - PLATFORM.size[1] / 2;

function MovingPlatform() {
  const body = useRef<RapierRigidBody>(null);
  const t = useRef(0);
  // Move on the physics clock so the platform and the character step together.
  useBeforePhysicsStep((world) => {
    t.current += world.timestep;
    body.current?.setNextKinematicTranslation({ x: platformX(t.current), y: PLATFORM_Y, z: PLATFORM.z });
  });
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders="cuboid" position={[platformX(0), PLATFORM_Y, PLATFORM.z]}>
      <PlatformMesh />
    </RigidBody>
  );
}

export function World() {
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {BOXES.map(({ pos, size: [w, h, d] }, i) => (
          <CuboidCollider key={i} position={pos} args={[w / 2, h / 2, d / 2]} />
        ))}
        {RAMPS.map((r, i) => (
          <ConvexHullCollider key={i} args={[rampVertices(r)]} />
        ))}
      </RigidBody>
      <MovingPlatform />
    </>
  );
}
