import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './Experience';
import { KeyboardControls, StatsGl } from '@react-three/drei';
import { keyboardMap } from '../../constants/controls';
import { TileSelector } from '../TileSelector';
import { Crosshair } from '../Crosshair';

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export const GameScene: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Canvas
        shadows
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).requestPointerLock();
        }}
        className="absolute inset-0 w-full h-full"
        camera={{ fov: 75, near: 0.1, far: 1000 }}
      >
        <Suspense fallback={null}>
          <KeyboardControls map={keyboardMap}>
            <Experience />
          </KeyboardControls>
        </Suspense>

        {/* FPS display for development */}
        <StatsGl className="absolute bottom-0 left-0" />
      </Canvas>

      {/* Place UI components outside the Canvas */}
      <TileSelector />
      <Crosshair />
    </div>
  );
};
