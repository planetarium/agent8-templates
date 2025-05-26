import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from '../r3f/Experience';
import { KeyboardControls } from '@react-three/drei';
import { keyboardMap } from '../../constants/controls';
import { Physics } from '@react-three/rapier';
import { FollowLight } from 'vibe-starter-3d';
import { PointToMoveController } from 'vibe-starter-3d';
import PointingSystem from '../r3f/PointingSystem';

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
              <FollowLight offset={[60, 100, 30]} intensity={2} />
              <PointToMoveController cameraMode="orthographic" />
              <PointingSystem />
              <Experience />
            </Suspense>
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

export default GameScene;
