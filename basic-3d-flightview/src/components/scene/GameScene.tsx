import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls } from '@react-three/drei';
import { keyboardMap } from '../../constants/controls';
import Experience from '../r3f/Experience';
import EffectContainer from '../r3f/EffectContainer';
import StatusDisplay from '../ui/StatusDisplay';
import { FlightViewController, FollowLight } from 'vibe-starter-3d';
import { useLocalPlayerStore } from '../../stores/localPlayerStore';

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
const GameScene = () => {
  const { setSpeed } = useLocalPlayerStore();

  return (
    <div className="relative w-full h-screen">
      {/* UI Overlay */}
      <StatusDisplay />

      {/* Keyboard preset */}
      <KeyboardControls map={keyboardMap}>
        {/* Single Canvas for the 3D scene */}
        <Canvas
          shadows
          camera={{ far: 5000 }}
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).requestPointerLock();
          }}
        >
          <Physics>
            <Suspense fallback={null}>
              <FollowLight />
              <FlightViewController minSpeed={0} maxSpeed={120} onSpeedChange={setSpeed} />
              <Experience />
              <EffectContainer />
            </Suspense>
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

export default GameScene;
