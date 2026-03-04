import { RigidBody } from '@react-three/rapier';

const ROOM_SIZE = 22;

const Floor = () => {
  return (
    <>
      <RigidBody type="fixed" colliders={'cuboid'}>
        <mesh receiveShadow position={[0, 0, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
          <meshStandardMaterial color="#1a1528" roughness={0.9} metalness={0.1} />
        </mesh>
      </RigidBody>
    </>
  );
};

export default Floor;
