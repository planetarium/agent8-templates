import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import Experience from '../r3f/Experience';
import { FollowLight, QuarterViewController } from 'vibe-starter-3d';
import { useGameStore } from '../../stores/gameStore';
import MapPhysicsReadyChecker from '../r3f/MapPhysicsReadyChecker';

/**
 * Game Scene Canvas — renders the entire 3D game world.
 * [DO NOT MODIFY] Physics/canvas setup and QuarterViewController are infrastructure.
 */
const GameSceneCanvas = () => {
  const { isMapPhysicsReady } = useGameStore();

  return (
    <>
      <Canvas shadows>
        <Physics paused={!isMapPhysicsReady}>
          <Suspense fallback={null}>
            {!isMapPhysicsReady && <MapPhysicsReadyChecker />}
            <FollowLight offset={[60, 100, 30]} intensity={2} />
            <QuarterViewController followCharacter={true} />
            <Experience />
          </Suspense>
        </Physics>
      </Canvas>
    </>
  );
};

export default GameSceneCanvas;
