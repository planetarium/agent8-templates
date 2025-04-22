import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Experience } from '../r3f/Experience';
import { StatsGl } from '@react-three/drei';
import { NetworkContainer } from '../r3f/NetworkContainer';
import { EffectContainer } from '../r3f/EffectContainer';
/**
 * Game scene props
 */
interface GameSceneProps {
  /** Current room ID */
  roomId: string;
  /** Game server instance */
  //server: GameServer;
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
  //const rtt = networkSyncStore((state) => state.rtt);
  // const userStates = useRoomAllUserStates() as UserState[];

  // const currentUser = useMemo(() => {
  //   return userStates.find((user) => user.account === server.account);
  // }, [server.account, userStates]);

  // const characterUrl = currentUser?.character;
  // if (!characterUrl) {
  //   return null;
  // }

  return (
    <div className="relative w-full h-screen">
      <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center z-10">
        <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-black/30 text-white hover:bg-black/50" onClick={onLeaveRoom}>
          Leave Game
        </button>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-black/30 text-white rounded border border-gray-500 text-sm">
            {/* Ping: <span className="font-semibold">{rtt !== null ? `${rtt.toFixed(0)}ms` : 'N/A'}</span> */}
          </div>
          <div className="px-3 py-1 bg-black/30 text-white rounded border border-gray-500 text-sm">
            Room ID: <span className="font-semibold">{roomId}</span>
          </div>
        </div>
      </div>

      <Canvas
        shadows
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).requestPointerLock();
        }}
      >
        <Physics debug={false}>
          <Suspense fallback={null}>
            <Experience characterUrl="solider.glb" />
            <NetworkContainer />
            <EffectContainer />
          </Suspense>
        </Physics>
        <StatsGl showPanel={0} className="stats absolute bottom-0 left-0" />
      </Canvas>
    </div>
  );
};
