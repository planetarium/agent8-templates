import { RigidBody } from '@react-three/rapier';

export function Floor() {
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#3f3f3f" />
      </mesh>
    </RigidBody>
  );
}
