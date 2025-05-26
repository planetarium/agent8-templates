import { RigidBodyObject } from 'vibe-starter-3d';
import { RigidBodyObjectType } from '../../constants/rigidBodyObjectType';

function Floor() {
  return (
    <RigidBodyObject type="fixed" colliders="trimesh" userData={{ type: RigidBodyObjectType.FLOOR }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#3f3f3f" />
      </mesh>
    </RigidBodyObject>
  );
}

export default Floor;
