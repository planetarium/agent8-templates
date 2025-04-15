import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Experience } from '../r3f/Experience';
import { StatsGl } from '@react-three/drei';
import { NetworkContainer } from '../r3f/NetworkContainer';
import { EffectContainer } from '../r3f/EffectContainer';
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
    <div className="absolute top-0 left-0 w-full h-screen">
      <Canvas shadows>
        <Physics debug={true}>
          <Suspense fallback={null}>
            <Experience characterUrl={characterUrl} />
            <NetworkContainer />
            <EffectContainer />
          </Suspense>
        </Physics>
        <StatsGl showPanel={0} className="stats absolute bottom-0 left-0" />
      </Canvas>
      {/* 
        pointer-events-none: Container itself ignores mouse events
        Only add pointer-events-auto to child elements that need interaction
      */}
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
