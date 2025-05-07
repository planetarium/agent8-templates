import { useTexture } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { RepeatWrapping } from 'three';
import Assets from '../../assets.json';

const Floor = () => {
  const texture = useTexture(Assets.sprites.dirt.url);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  return (
    <RigidBody type="fixed" colliders={'cuboid'}>
      <mesh receiveShadow position={[0, -1, 0]} rotation-x={-Math.PI / 2} userData={{ type: 'fixed', isFloor: true }}>
        <boxGeometry args={[1000, 1000, 2]} />
        <meshStandardMaterial map={texture} map-repeat={[240, 240]} color="green" />
      </mesh>
    </RigidBody>
  );
};

export default Floor;
