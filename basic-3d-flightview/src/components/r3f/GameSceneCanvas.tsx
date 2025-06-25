import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import Experience from '../r3f/Experience';
import { FlightControllerKeyMapping, FlightViewController, FollowLight } from 'vibe-starter-3d';
import { useGameStore } from '../../stores/gameStore';
import MapPhysicsReadyChecker from '../r3f/MapPhysicsReadyChecker';
import EffectContainer from './EffectContainer';

const movementKeyMapping: FlightControllerKeyMapping = {
  forward: ['KeyW'],
  backward: ['KeyS'],
  leftward: ['KeyA'],
  rightward: ['KeyD'],
  pitchUp: ['ArrowUp'],
  pitchDown: ['ArrowDown'],
  rollLeft: ['ArrowLeft'],
  rollRight: ['ArrowRight'],
};

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
    <Canvas
      shadows
      camera={{ far: 5000 }}
      onPointerDown={(e) => {
        (e.target as HTMLCanvasElement).requestPointerLock();
      }}
    >
      <Physics paused={!isMapPhysicsReady} debug={false}>
        <Suspense fallback={null}>
          {/* ⚠️ MUST INCLUDE: Essential checker for map physics initialization */}
          {!isMapPhysicsReady && <MapPhysicsReadyChecker />}
          <FollowLight />
          <FlightViewController keyMapping={movementKeyMapping} />
          <Experience />
          <EffectContainer />
        </Suspense>
      </Physics>
    </Canvas>
  );
};

export default GameSceneCanvas;
