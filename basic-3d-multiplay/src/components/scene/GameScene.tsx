import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "../r3f/Experience";
import { GameServer, useRoomAllUserStates } from "@agent8/gameserver";
import { UserState } from "../../types";

/**
 * Game scene props
 */
interface GameSceneProps {
  /** Current room ID */
  roomId: string;
  /** Game server instance */
  server: GameServer;
  /** Handler for leaving room */
  onLeaveRoom: () => Promise<void>;
}

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export const GameScene: React.FC<GameSceneProps> = ({
  roomId,
  server,
  onLeaveRoom,
}) => {
  // Get all user states from the server
  const userStates = useRoomAllUserStates() as UserState[];

  // Find current user's state to get selected character
  const currentUser = useMemo(() => {
    return userStates.find((user) => user.account === server.account);
  }, [server.account, userStates]);

  // Get character key from user state or use default
  const characterKey = currentUser?.character || "avatarsample_d_darkness.vrm";

  return (
    <div className="relative w-full h-screen">
      <div className="absolute z-10 w-full p-4 flex justify-between pointer-events-none">
        <button
          className="bg-black/50 text-white rounded px-4 py-2 pointer-events-auto"
          onClick={onLeaveRoom}
        >
          Exit
        </button>
        <div className="bg-black/50 text-white rounded px-4 py-2 pointer-events-auto">
          Room ID: {roomId}
        </div>
      </div>

      <Canvas
        shadows
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).requestPointerLock();
        }}
      >
        <Suspense fallback={null}>
          <Experience
            server={server}
            userStates={userStates}
            characterKey={characterKey}
            roomId={roomId}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
