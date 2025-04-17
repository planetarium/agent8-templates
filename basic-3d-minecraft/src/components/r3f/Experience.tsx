import { useRef } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment, Grid, KeyboardControls, Sky, Html } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { FreeViewController, ControllerHandle } from 'vibe-starter-3d';
import { useState } from 'react';
import { useEffect } from 'react';
import { Player, PlayerRef } from './Player';
import { Floor } from './Floor';
import { InstancedCubes } from './InstancedCubes';
import { CubePreview } from './CubePreview';
import { useCubeRaycaster } from '../../hooks/useCubeRaycaster';
import { useCubeStore } from '../../store/cubeStore';

export function Experience() {
  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);
  const targetHeight = 1.6;
  const { previewPosition } = useCubeRaycaster();

  /**
   * Delay physics activate
   */
  const [pausedPhysics, setPausedPhysics] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      const boundingBox = playerRef.current.boundingBox;

      if (boundingBox) {
        console.log('Character size information updated:', { boundingBox });
      }
    }
  }, [playerRef.current?.boundingBox]);

  return (
    <>
      <ambientLight intensity={2} />

      <Physics debug={false} paused={pausedPhysics}>
        {/* Environment */}
        <Environment preset="sunset" background={false} />
        <Sky sunPosition={[100, 20, 100]} />

        {/* player character with controller */}
        <FreeViewController
          ref={controllerRef}
          targetHeight={targetHeight}
          followLight={{
            position: [20, 30, 10],
            intensity: 1.2,
          }}
        >
          <Player ref={playerRef} initState={CharacterState.IDLE} controllerRef={controllerRef} targetHeight={targetHeight} />
        </FreeViewController>

        {/* Ground */}
        <Floor />

        {/* Render instanced cubes (optimized way) */}
        <InstancedCubes />

        {/* Cube Preview */}
        <CubePreview position={previewPosition} />
      </Physics>
    </>
  );
}
