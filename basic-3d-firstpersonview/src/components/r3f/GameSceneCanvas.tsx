import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { FirstPersonViewController, FollowLight } from 'vibe-starter-3d';
import { useGameStore } from '../../stores/gameStore';
import { Environment, Grid } from '@react-three/drei';
import MapPhysicsReadyChecker from '../r3f/MapPhysicsReadyChecker';
import EffectContainer from './EffectContainer';
import Player from './Player';
import Floor from './Floor';

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
      <Canvas
        shadows
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).requestPointerLock();
        }}
      >
        {/* For debugging purposes only */}
        <Grid
          args={[100, 100]}
          position={[0, 0.1, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#9f9f9f"
          fadeDistance={100}
          fadeStrength={1}
          userData={{ camExcludeCollision: true }}
        />
        <Physics paused={!isMapPhysicsReady}>
          <Suspense fallback={null}>
            {/* ⚠️ MUST INCLUDE: Essential checker for map physics initialization */}
            {!isMapPhysicsReady && <MapPhysicsReadyChecker />}
            <FirstPersonViewController />
            <EffectContainer />
            <Environment preset="sunset" background={false} />
            <ambientLight intensity={0.7} />
            <FollowLight />
            <Player />
            <Floor />
          </Suspense>
        </Physics>
      </Canvas>
    </>
  );
};

export default GameSceneCanvas;
