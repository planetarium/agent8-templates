import { RigidBody } from '@react-three/rapier';

export const Floor = () => {
  return (
    <RigidBody type="fixed" colliders={'cuboid'}>
      <mesh receiveShadow position={[0, -1, 0]} rotation-x={-Math.PI / 2}>
        <boxGeometry args={[100, 100, 2]} />
        <meshStandardMaterial color="#3f3f3f" />
      </mesh>
    </RigidBody>
  );
};
