import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { keyboardMap } from '../../constants/controls';
import { Physics } from '@react-three/rapier';
import Experience from '../r3f/Experience';

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
const GameScene: React.FC = () => {
  return (
    <div className="relative w-full h-screen">
      {/* Keyboard preset */}
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).requestPointerLock();
          }}
        >
          <Physics>
            <Suspense fallback={null}>
              <Experience />
            </Suspense>
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

export default GameScene;
