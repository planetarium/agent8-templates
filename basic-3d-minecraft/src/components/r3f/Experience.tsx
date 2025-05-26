import { Environment } from '@react-three/drei';

import InstancedCube from './InstancedCube';
import CubePreview from './CubePreview';
import useCubeRaycaster from '../../hooks/useCubeRaycaster';
import Water from './Water';
import Player from './Player';

const Experience = () => {
  const { previewPosition } = useCubeRaycaster();

  return (
    <>
      {/* Lower ambient light intensity for stronger shadows and contrast */}
      <ambientLight intensity={0.5} />

      {/* Main directional light - acts as the sun */}
      <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />

      {/* Secondary light - side lighting for enhanced depth */}
      <directionalLight position={[-30, 50, -30]} intensity={0.8} color="#b9d4ff" />

      {/* Weak fill light from below */}
      <directionalLight position={[0, -10, 0]} intensity={0.3} color="#fff9e8" />

      <Environment preset="dawn" background={true} />

      {/* Water */}
      <Water />

      {/* Render instanced cubes (optimized way) */}
      <InstancedCube />

      {/* Cube Preview */}
      <CubePreview position={previewPosition} />

      <Player />
    </>
  );
};

export default Experience;
