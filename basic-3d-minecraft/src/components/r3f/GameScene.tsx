import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './Experience';
import { KeyboardControls, StatsGl } from '@react-three/drei';
import { keyboardMap } from '../../constants/controls';
import { TileSelector } from '../TileSelector';
import { Crosshair } from '../Crosshair';
import { Physics } from '@react-three/rapier';

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export const GameScene: React.FC = () => {
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
      {/* Place UI components outside the Canvas */}
      <TileSelector />
      <Crosshair />
    </div>
  );
};
