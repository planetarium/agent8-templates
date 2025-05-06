import { useRef } from 'react';
import { Environment, Sky } from '@react-three/drei';
import { ControllerHandle, FirstPersonViewController } from 'vibe-starter-3d';
import { Floor } from './Floor';
import { InstancedCubes } from './InstancedCubes';
import { CubePreview } from './CubePreview';
import { useCubeRaycaster } from '../../hooks/useCubeRaycaster';

export function Experience() {
  const controllerRef = useRef<ControllerHandle>(null);
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
        ref={controllerRef}
        targetHeight={targetHeight}
        followLight={{
          position: [20, 30, 10],
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
}
