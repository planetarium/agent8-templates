import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from '../r3f/Experience';
import { KeyboardControls } from '@react-three/drei';
import { keyboardMap } from '../../constants/controls';
import TileSelector from '../ui/TileSelector';
import Crosshair from '../ui/Crosshair';
import { Physics } from '@react-three/rapier';
import { FirstPersonViewController } from 'vibe-starter-3d';
import { FollowLight } from 'vibe-starter-3d';

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
            <FollowLight intensity={0.8} />
            <FirstPersonViewController />
            <Experience />
          </Physics>
        </Canvas>
      </KeyboardControls>
      {/* Place UI components outside the Canvas */}
      <TileSelector />
      <Crosshair />
    </div>
  );
};

export default GameScene;
