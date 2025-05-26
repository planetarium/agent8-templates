import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { keyboardMap } from '../../constants/controls';
import { KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import Experience from '../r3f/Experience';
import EffectContainer from '../r3f/EffectContainer';
import { FirstPersonViewController, FollowLight } from 'vibe-starter-3d';
import Crosshair from '../ui/Crosshair';

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
const GameScene = () => {
  return (
    <div className="relative w-full h-screen">
      {/* Keyboard preset */}
      <KeyboardControls map={keyboardMap}>
        {/* Single Canvas for the 3D scene */}
        <Canvas
          shadows
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).requestPointerLock();
          }}
        >
          <Physics>
            <Suspense fallback={null}>
              <FollowLight />
              <FirstPersonViewController />
              <Experience />
              <EffectContainer />
            </Suspense>
          </Physics>
        </Canvas>
      </KeyboardControls>

      <Crosshair />
    </div>
  );
};

export default GameScene;
