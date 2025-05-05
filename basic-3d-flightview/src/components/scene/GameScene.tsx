import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from '../r3f/Experience';
import { StatusDisplay } from '../ui/StatusDisplay';
import { Physics } from '@react-three/rapier';
import { EffectContainer } from '../r3f/EffectContainer';
import { KeyboardControls } from '@react-three/drei';
import { keyboardMap } from '../../constants/controls';

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export const GameScene: React.FC = () => {
  return (
    <div className="relative w-full h-screen">
      {/* UI Overlay */}
      <StatusDisplay />

      {/* Keyboard preset */}
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          camera={{ far: 5000 }}
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).requestPointerLock();
          }}
        >
          <Physics>
            <Suspense fallback={null}>
              <Experience />
              <EffectContainer />
            </Suspense>
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};
