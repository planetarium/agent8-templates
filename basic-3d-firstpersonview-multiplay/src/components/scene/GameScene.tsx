import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from '../r3f/Experience';
import { keyboardMap } from '../../constants/controls';
import { KeyboardControls } from '@react-three/drei';
import { NetworkContainer } from '../r3f/NetworkContainer';
import { EffectContainer } from '../r3f/EffectContainer';
import { Physics } from '@react-three/rapier';
import { RTT } from '../ui/RTT';

/**
 * Game scene props
 */
interface GameSceneProps {
  /** Current room ID */
  roomId: string;
  /** Handler for leaving room */
  onLeaveRoom: () => Promise<void>;
  /** Current player's character key */
  characterUrl: string;
}

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export const GameScene: React.FC<GameSceneProps> = ({ roomId, onLeaveRoom, characterUrl }) => {
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
              <Experience characterUrl={characterUrl} />
              <NetworkContainer />
              <EffectContainer />
            </Suspense>
          </Physics>
        </Canvas>
      </KeyboardControls>

      {/* Crosshair rendered as a standard HTML element outside the Canvas */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
        <div className="crosshair-container relative flex items-center justify-center w-6 h-6">
          {/* Horizontal line with black outline */}
          <div className="w-3 h-[1px] bg-white opacity-100 absolute shadow-[0_0_0_1px_rgba(0,0,0,0.8)]"></div>
          {/* Vertical line with black outline */}
          <div className="h-3 w-[1px] bg-white opacity-100 absolute shadow-[0_0_0_1px_rgba(0,0,0,0.8)]"></div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center z-10 pointer-events-none">
        <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-black/30 text-white hover:bg-black/50 pointer-events-auto" onClick={onLeaveRoom}>
          Leave Game
        </button>
        <div className="flex items-center space-x-2 pointer-events-none">
          {/* Add pointer-events-auto to RTT component if interaction is needed */}
          <div className="pointer-events-auto">
            <RTT />
          </div>
          <div className="px-3 py-1 bg-black/30 text-white rounded border border-gray-500 text-sm pointer-events-none">
            Room ID: <span className="font-semibold">{roomId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
