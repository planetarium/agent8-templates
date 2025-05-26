import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from '../r3f/Experience';
import { keyboardMap } from '../../constants/controls';
import { KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { FollowLight, SideViewController } from 'vibe-starter-3d';

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
        <Canvas shadows>
          <Physics>
            <Suspense fallback={null}>
              <FollowLight />
              <SideViewController cameraMode="perspective" followCharacter={true} camDistance={10} />
              <Experience />
            </Suspense>
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

export default GameScene;
