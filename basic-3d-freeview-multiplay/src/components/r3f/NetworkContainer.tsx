import { useRef, useEffect, useState } from 'react';
import { useGameServer, useRoomState } from '@agent8/gameserver';
import { UserState } from '../../types';
import React from 'react';
import { RemotePlayer, RemotePlayerHandle } from './RemotePlayer';
import { DEFAULT_HEIGHT } from '../../constants/character';
import { UnsubscribeFunction } from '@agent8/gameserver/dist/src/server/GameServer';

/**
 * Main Experience component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements for the local player.
 */
export function NetworkContainer() {
  const { connected, server, account } = useGameServer();
  if (!server) return null;
  if (!connected) return null;
  const { roomId } = useRoomState();
  const [otherReadyPlayers, setUserStates] = useState<{ [account: string]: UserState }>({});

  const playerRefs = useRef<Record<string, React.RefObject<RemotePlayerHandle>>>({});

  useEffect(() => {
    if (!server || !connected || !roomId || !account) return;

    const unsubscribes: UnsubscribeFunction[] = [];

    unsubscribes.push(
      server.subscribeRoomState(roomId, (roomState) => {
        for (const account in otherReadyPlayers) {
          if (!roomState.$users.includes(account)) {
            delete playerRefs.current[account];
            delete otherReadyPlayers[account];
          }
        }

        setUserStates(otherReadyPlayers);
      }),
    );

    unsubscribes.push(
      server.subscribeRoomAllUserStates(roomId, (allUserStates: Record<string, UserState | null>) => {
        let needUpdateUserStates = false;
        Object.values(allUserStates).forEach((playerState) => {
          if (playerState && playerState.account !== account && playerState.isReady && playerState.transform) {
            if (!otherReadyPlayers[playerState.account]) {
              otherReadyPlayers[playerState.account] = playerState;
              playerRefs.current[playerState.account] = React.createRef<RemotePlayerHandle>();
              needUpdateUserStates = true;
            }

            const playerRef = playerRefs.current[playerState.account];
            if (playerRef?.current) {
              playerRef.current.syncState(playerState.state, playerState.transform.position, playerState.transform.rotation);
            }
          }
        });

        if (needUpdateUserStates) {
          setUserStates({ ...otherReadyPlayers });
        }
      }),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [server, connected, roomId, account]);

  return (
    <>
      {Object.values(otherReadyPlayers).map(
        (player) =>
          player.character && (
            <RemotePlayer
              key={player.account}
              ref={playerRefs.current[player.account]}
              position={player.transform?.position}
              rotation={player.transform?.rotation}
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
