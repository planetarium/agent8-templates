import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './Experience';

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export const GameScene: React.FC = () => {
  const [inputMode, setInputMode] = useState<'keyboard' | 'pointToMove'>('keyboard');

  return (
    <>
      {/* 모드 전환 UI */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
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
        <Suspense fallback={null}>
          <Experience inputMode={inputMode} />
        </Suspense>
      </Canvas>
    </>
  );
};
