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

  // Define player start position state
  const [playerStartPosition, setPlayerStartPosition] = useState<[number, number, number]>([80, 100, 80]);

  // Get cube information from cube store
  const cubes = useCubeStore((state) => state.cubes);

  // Calculate player start position after cubes are loaded
  useEffect(() => {
    if (cubes.length > 0) {
      // Find the highest position at the center point (around x=80, z=80)
      const centerX = 40;
      const centerZ = 40;
      const searchRadius = 5;

      let highestY = 0;
      let foundSurface = false;

      // Search the area around the center
      for (let x = centerX - searchRadius; x <= centerX + searchRadius; x++) {
        for (let z = centerZ - searchRadius; z <= centerZ + searchRadius; z++) {
          // Find the highest block at this position
          for (const cube of cubes) {
            const [cubeX, cubeY, cubeZ] = cube.position;
            if (Math.floor(cubeX) === x && Math.floor(cubeZ) === z && cubeY > highestY) {
              highestY = cubeY;
              foundSurface = true;
            }
          }
        }
      }

      // Set appropriate start position (30 blocks above terrain - to better see the mountain ranges)
      if (foundSurface) {
        setPlayerStartPosition([centerX, highestY + 30, centerZ]);
      } else {
        // Start from a high position if no suitable terrain is found
        setPlayerStartPosition([80, 100, 80]);
      }
    }
  }, [cubes]);

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
