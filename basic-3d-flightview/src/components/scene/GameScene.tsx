import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from '../r3f/Experience';
import { FlightViewControllerHandle } from 'vibe-starter-3d';
import { StatusDisplay } from '../ui/StatusDisplay';
import { KeyboardControls } from '@react-three/drei';
import { keyboardMap } from '../../constants/controls';
import { EffectContainer } from '../r3f/EffectContainer';

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export const GameScene: React.FC = () => {
  const controllerRef = useRef<FlightViewControllerHandle>(null);

  return (
    <>
      <KeyboardControls map={keyboardMap}>
        {/* UI Overlay */}
        <StatusDisplay controllerRef={controllerRef} />

        <Canvas
          shadows
          camera={{ far: 5000 }}
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).requestPointerLock();
          }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} // Ensure canvas doesn't overlap UI
        >
          <Suspense fallback={null}>
            <Experience controllerRef={controllerRef} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  );
};
