import { Environment, Sky } from '@react-three/drei';
import { FirstPersonViewController, FollowLight } from 'vibe-starter-3d';

import InstancedCube from './InstancedCube';
import CubePreview from './CubePreview';
import useCubeRaycaster from '../../hooks/useCubeRaycaster';
import useCubeStore from '../../stores/cubeStore';
import { useEffect, useState } from 'react';
import Water from './Water';

const Experience = () => {
  const targetHeight = 1.6;
  const { previewPosition } = useCubeRaycaster();
  const playerStartPosition: [number, number, number] = [0, 40, 0];

  return (
    <>
      <ambientLight intensity={2.5} />

      <FollowLight />

      <Environment preset="sunset" background={false} />
      <Sky sunPosition={[100, 30, 100]} />

      {/* player character with controller */}
      <FirstPersonViewController targetHeight={targetHeight} position={playerStartPosition}></FirstPersonViewController>

      {/* Water */}
      <Water />

      {/* Render instanced cubes (optimized way) */}
      <InstancedCube />

      {/* Cube Preview */}
      <CubePreview position={previewPosition} />
    </>
  );
};

export default Experience;
