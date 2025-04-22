import React, { Suspense, useState } from 'react';
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
  const [inputMode, setInputMode] = useState<'keyboard' | 'pointToMove'>('keyboard');

  return (
    <div className="absolute top-0 left-0 w-full h-screen">
      {/* 모드 전환 UI */}
      <div
        style={{
          position: 'absolute',
          top: '60px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '8px',
          borderRadius: '4px',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          userSelect: 'none',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={() => setInputMode('keyboard')}
          style={{
            padding: '5px 10px',
            backgroundColor: inputMode === 'keyboard' ? '#4CAF50' : '#555',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Keyboard
        </button>
        <button
          onClick={() => setInputMode('pointToMove')}
          style={{
            padding: '5px 10px',
            backgroundColor: inputMode === 'pointToMove' ? '#4CAF50' : '#555',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Point & Click
        </button>
      </div>

      <Canvas shadows>
        <Physics debug={false}>
          <Suspense fallback={null}>
            <Experience characterUrl={characterUrl} inputMode={inputMode} />
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
