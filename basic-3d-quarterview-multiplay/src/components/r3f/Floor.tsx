import { RigidBody } from '@react-three/rapier';

/**
 * Floor - Floor component
 * Handles only the physical floor role, with event handling removed.
 */
export const Floor = () => {
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#3f3f3f" />
        </mesh>
      </group>
    </RigidBody>
  );
};
