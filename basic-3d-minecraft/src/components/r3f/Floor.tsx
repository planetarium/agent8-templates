import { RigidBody } from '@react-three/rapier';

const Floor = () => {
  return (
    <RigidBody type="fixed" colliders={'cuboid'}>
      <mesh receiveShadow position={[0, 0, 0]} rotation-x={-Math.PI / 2} userData={{ type: 'fixed', isFloor: true }}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#5E4522" />
      </mesh>
    </RigidBody>
  );
};

export default Floor;
