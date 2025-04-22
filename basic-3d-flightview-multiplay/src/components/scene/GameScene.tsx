import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from '../r3f/Experience';
import { StatusDisplay } from '../ui/StatusDisplay';
import { FlightViewControllerHandle } from 'vibe-starter-3d';
import { RTT } from '../ui/RTT';
import { Physics } from '@react-three/rapier';
import { NetworkContainer } from '../r3f/NetworkContainer';
import { EffectContainer } from '../r3f/EffectContainer';

/**
 * Game scene props
 */
interface GameSceneProps {
  /** Current room ID */
  roomId: string;
  /** Handler for leaving room */
  onLeaveRoom: () => Promise<void>;
}

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export const GameScene: React.FC<GameSceneProps> = ({ roomId, onLeaveRoom }) => {
  const controllerRef = useRef<FlightViewControllerHandle>(null);

  return (
    <div className="relative w-full h-screen">
      <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center z-10">
        <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-black/30 text-white hover:bg-black/50" onClick={onLeaveRoom}>
          Leave Game
        </button>
        <div className="flex items-center space-x-2">
          <RTT />
          <div className="px-3 py-1 bg-black/30 text-white rounded border border-gray-500 text-sm">
            Room ID: <span className="font-semibold">{roomId}</span>
          </div>
        </div>
      </div>

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
        <Physics debug={false}>
          <Suspense fallback={null}>
            <Experience controllerRef={controllerRef} />
            <NetworkContainer />
            <EffectContainer />
          </Suspense>
        </Physics>
      </Canvas>
    </div>
  );
};
