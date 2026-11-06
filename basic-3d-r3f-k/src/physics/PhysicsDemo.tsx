// Example rapier world: crates that fall and stack on the floor. Only loaded
// through LazyPhysics. The player is NOT a rapier body (it uses the kinematic
// step in game/player.ts); see PROJECT/Structure.md for how to swap it in.
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';

const CRATES: [number, number, number][] = [
  [-2, 4, -3],
  [-1.6, 6, -3.2],
  [-2.2, 8, -2.8],
  [2, 5, -4],
];

export default function PhysicsDemo() {
  return (
    <Physics gravity={[0, -26, 0]}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[40, 0.5, 40]} position={[0, -0.5, 0]} />
      </RigidBody>
      {CRATES.map((p, i) => (
        <RigidBody key={i} position={p} colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#b5835a" />
          </mesh>
        </RigidBody>
      ))}
    </Physics>
  );
}
