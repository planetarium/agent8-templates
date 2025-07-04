import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import Experience from '../r3f/Experience';
import { FollowLight, QuarterViewController } from 'vibe-starter-3d';
import { useGameStore } from '../../stores/gameStore';
import MapPhysicsReadyChecker from '../r3f/MapPhysicsReadyChecker';

/**
 * Game Scene Canvas Component
 *
 * This component is responsible for rendering the entire 3D game world using React Three Fiber.
 * It serves as the root container for all 3D elements, physics simulation, and game interactions.
 */
const GameSceneCanvas = () => {
  // ⚠️ MUST CHECK: Map physics system ready state
  // Physics paused and loading screen displayed while this value is false
  const { isMapPhysicsReady } = useGameStore();

  return (
    <>
      {/* ⚠️ DO NOT DELETE: Core Canvas component for React Three Fiber */}
      <Canvas shadows>
        <Physics paused={!isMapPhysicsReady}>
          <Suspense fallback={null}>
            {/* ⚠️ MUST INCLUDE: Essential checker for map physics initialization */}
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
