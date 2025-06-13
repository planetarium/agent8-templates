import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { keyboardMap } from '../../constants/controls';
import { KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import Experience from '../r3f/Experience';
import NetworkContainer from '../r3f/NetworkContainer';
import { FollowLight, QuarterViewController } from 'vibe-starter-3d';
import MapPhysicsReadyChecker from '../r3f/MapPhysicsReadyChecker';
import { useGameStore } from '../../stores/gameStore';
import RTT from '../ui/RTT';

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
const GameScene: React.FC<GameSceneProps> = ({ roomId, onLeaveRoom, characterUrl }) => {
  const { isMapPhysicsReady, setMapPhysicsReady } = useGameStore();

  // cleanup
  useEffect(() => {
    return () => {
      setMapPhysicsReady(false);
    };
  }, [setMapPhysicsReady]);

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
      {/* Keyboard preset */}
      <KeyboardControls map={keyboardMap}>
        {/* Single Canvas for the 3D scene */}
        <Canvas shadows>
          <Physics> 
            <Suspense fallback={null}>
              {!isMapPhysicsReady && <MapPhysicsReadyChecker />}
              <FollowLight offset={[60, 100, 30]} intensity={2} />
              {isMapPhysicsReady && <QuarterViewController followCharacter={true} />}
              <Experience characterUrl={characterUrl} />
              <NetworkContainer />
            </Suspense>
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

export default GameScene;
