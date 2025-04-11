import { useRef, useEffect, useMemo } from 'react';
import { useGameServer, useRoomAllUserStates, useRoomState } from '@agent8/gameserver';
import { UserState } from '../../types';
import React from 'react';
import { RemotePlayer, RemotePlayerHandle } from './RemotePlayer';
import { DEFAULT_HEIGHT } from '../../constants/character';

/**
 * Main Experience component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements for the local player.
 */
export function NetworkContainer() {
  const { connected, server, account } = useGameServer();
  if (!connected) return null;
  const { roomId } = useRoomState();
  const userStates = useRoomAllUserStates() as UserState[];

  const otherReadyPlayers = useMemo(() => {
    return userStates.filter((user) => user.account !== account && user.isReady && user.transform);
  }, [server.account, userStates]);

  const playerRefs = useRef<Record<string, React.RefObject<RemotePlayerHandle>>>({});

  useEffect(() => {
    const currentAccounts = new Set(otherReadyPlayers.map((p) => p.account));
    const existingAccounts = new Set(Object.keys(playerRefs.current));

    otherReadyPlayers.forEach((player) => {
      if (!existingAccounts.has(player.account)) {
        console.log(`[GameScene RefMgmt] Creating ref for player: ${player.account}`);
        playerRefs.current[player.account] = React.createRef<RemotePlayerHandle>();
      }
    });

    existingAccounts.forEach((account) => {
      if (!currentAccounts.has(account)) {
        console.log(`[GameScene RefMgmt] Removing ref for player: ${account}`);
        delete playerRefs.current[account];
      }
    });
  }, [otherReadyPlayers]);

  useEffect(() => {
    if (!roomId || !server) return;

    console.log(`[GameScene Sub] Subscribing to room user states for room: ${roomId}`);

    const unsubscribe = server.subscribeRoomAllUserStates(roomId, (allUserStates: Record<string, UserState | null>) => {
      Object.values(allUserStates).forEach((playerState) => {
        if (playerState && playerState.account !== account) {
          const playerRef = playerRefs.current[playerState.account];
          if (playerRef?.current && playerState.transform && playerState.state && playerState.isReady) {
            playerRef.current.syncState(playerState.state, playerState.transform.position, playerState.transform.rotation);
          }
        }
      });
    });

    return () => {
      console.log(`[GameScene Sub] Unsubscribing from room user states for room: ${roomId}`);
      unsubscribe();
    };
  }, [roomId, server]);

  return (
    <>
      {otherReadyPlayers.map(
        (player) =>
          player.character && (
            <RemotePlayer
              key={player.account}
              ref={playerRefs.current[player.account]}
              account={player.account}
              characterUrl={player.character}
              nickname={player.nickname}
              targetHeight={DEFAULT_HEIGHT}
            />
          ),
      )}
    </>
  );
}
