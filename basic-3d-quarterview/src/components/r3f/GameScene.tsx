import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './Experience';
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
    <>
      <Canvas shadows>
        <Suspense fallback={null}>
          <KeyboardControls map={keyboardMap}>
            <Experience />
          </KeyboardControls>
        </Suspense>
      </Canvas>
    </>
  );
};
