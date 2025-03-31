import { useRef, createRef } from "react";
import { Physics } from "@react-three/rapier";
import {
  Environment,
  Grid,
  KeyboardControls,
  Billboard,
  Text,
} from "@react-three/drei";
import { Player } from "./Player";
import { RemotePlayer } from "./RemotePlayer";
import { CharacterState } from "../../constants/character";
import { FreeViewController, ControllerHandle } from "vibe-starter-3d";
import { useState, useMemo, useEffect, useCallback } from "react";
import { keyboardMap } from "../../constants/controls";
import { Floor } from "./Floor";
import { Vector3 } from "three";
import { Lights } from "./Lights";
import { GameServer } from "@agent8/gameserver";
import { useFrame } from "@react-three/fiber";
import { UserState } from "../../types";

/**
 * Experience component props
 */
interface ExperienceProps {
  /** Game server instance */
  server: GameServer;
  /** All user states in the room */
  userStates: UserState[];
  /** Current player's character key */
  characterKey: string;
  /** Room ID */
  roomId: string;
}

// Remote players state - global reference for performance (avoid re-renders)
export const remotePlayersStateRef = {
  current: {} as Record<string, { state: UserState }>,
};

/**
 * Main Experience component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export function Experience({
  server,
  userStates,
  characterKey,
  roomId,
}: ExperienceProps) {
  /**
   * Delay physics activate
   */
  const [pausedPhysics, setPausedPhysics] = useState(true);

  // 렌더링 트리거를 위한 상태 (실제 데이터는 ref에 저장)
  const [remotePlayersUpdate, setRemotePlayersUpdate] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  const controllerRef = useRef<ControllerHandle>(null);

  // 최초 userStates에서 원격 플레이어 상태 초기화
  useEffect(() => {
    const newRemotePlayersState: Record<string, { state: UserState }> = {};

    userStates.forEach((user) => {
      if (user.account !== server.account) {
        newRemotePlayersState[user.account] = {
          state: user,
        };
      }
    });

    // 이전 상태에 있던 플레이어가 새 상태에 없으면 유지
    const merged = { ...remotePlayersStateRef.current };

    // 새 플레이어 상태 추가/업데이트
    Object.keys(newRemotePlayersState).forEach((account) => {
      merged[account] = newRemotePlayersState[account];
    });

    remotePlayersStateRef.current = merged;
    setRemotePlayersUpdate((prev) => prev + 1); // 렌더링 트리거
  }, [userStates, server.account]);

  // 서버에서 사용자 상태 업데이트 구독
  useEffect(() => {
    if (!server || !roomId) return;

    console.log(`[Experience] Subscribing to room users`);

    // 모든 유저 상태 구독
    const setupSubscription = async () => {
      try {
        const unsubscribe = await server.subscribeRoomAllUserStates(
          roomId,
          (updatedUserStates: UserState[]) => {
            // 현재 플레이어를 제외한 다른 플레이어 상태만 업데이트
            const remoteUsers = updatedUserStates.filter(
              (state) => state.account !== server.account
            );

            const newState = { ...remotePlayersStateRef.current };

            remoteUsers.forEach((user) => {
              newState[user.account] = {
                state: user,
              };
            });

            remotePlayersStateRef.current = newState;
            setRemotePlayersUpdate((prev) => prev + 1); // 렌더링 트리거
          }
        );

        return () => {
          console.log(`[Experience] Unsubscribing from room`);
          unsubscribe?.();
        };
      } catch (error) {
        console.error("[Experience] Failed to subscribe to room users:", error);
        return () => {}; // 빈 cleanup 함수
      }
    };

    const cleanupFn = setupSubscription();

    return () => {
      cleanupFn.then((cleanup) => cleanup());
    };
  }, [server, roomId]);

  // Filter out other players (all users except current user)
  const otherPlayers = useMemo(() => {
    return Object.values(remotePlayersStateRef.current)
      .map((entry) => entry.state)
      .filter((user) => user.character && user.isReady);
  }, [remotePlayersUpdate]); // remotePlayersUpdate가 변경될 때만 다시 계산

  return (
    <>
      <Lights />

      <Physics debug={false} paused={pausedPhysics}>
        {/* Keyboard preset */}
        <KeyboardControls map={keyboardMap}>
          {/* Environment */}
          <Environment preset="sunset" background={false} />

          {/* Local player character with controller */}
          <FreeViewController
            ref={controllerRef}
            camInitDis={4}
            camMinDis={4}
            camMaxDis={4}
          >
            <Player
              initState={CharacterState.IDLE}
              controllerRef={controllerRef}
              characterKey={characterKey}
              server={server}
            />
          </FreeViewController>

          {/* Other players */}
          {otherPlayers.map(
            (player) =>
              player.character && (
                <RemotePlayer
                  key={player.account}
                  account={player.account}
                  characterKey={player.character}
                  nickname={player.nickname}
                  transform={player.transform}
                  state={player.state}
                />
              )
          )}
        </KeyboardControls>

        {/* Floor */}
        <Floor />
      </Physics>
    </>
  );
}
