import { Environment, Sky } from '@react-three/drei';
import { FirstPersonViewController } from 'vibe-starter-3d';
import Floor from './Floor';
import InstancedCubes from './InstancedCubes';
import CubePreview from './CubePreview';
import useCubeRaycaster from '../../hooks/useCubeRaycaster';

const Experience = () => {
  const targetHeight = 1.6;
  const { previewPosition } = useCubeRaycaster();

  return (
    <>
      <ambientLight intensity={2} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />
      <Sky sunPosition={[100, 20, 100]} />

      {/* player character with controller */}
      <FirstPersonViewController
        targetHeight={targetHeight}
        followLight={{
          intensity: 1.2,
        }}
        position={[0, 10, 0]}
      ></FirstPersonViewController>

      {/* Ground */}
      <Floor />

      {/* Render instanced cubes (optimized way) */}
      <InstancedCubes />

      {/* Cube Preview */}
      <CubePreview position={previewPosition} />
    </>
  );
};

export default Experience;
