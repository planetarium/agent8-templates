import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { FlightControllerKeyMapping, FlightViewController, FollowLight } from 'vibe-starter-3d';
import { useGameStore } from '../../stores/gameStore';
import { Sky } from '@react-three/drei';
import MapPhysicsReadyChecker from '../r3f/MapPhysicsReadyChecker';
import EffectContainer from './EffectContainer';
import Player from './Player';
import FloatingShapes from './FloatingShapes';
import Ground from './Ground';

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
    <>
      {/* ⚠️ DO NOT DELETE: Core Canvas component for React Three Fiber */}
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
            <FlightViewController keyMapping={movementKeyMapping} />
            <EffectContainer />
            <Sky distance={450000} sunPosition={[-20, 30, 10]} turbidity={0.8} rayleigh={0.4} />
            <ambientLight intensity={1.2} />
            <FollowLight />
            <Player />
            <FloatingShapes />
            <Ground />
          </Suspense>
        </Physics>
      </Canvas>
    </>
  );
};

export default GameSceneCanvas;
