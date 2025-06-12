import { useRef, useEffect, useState } from 'react';
import { useGameServer, useRoomState } from '@agent8/gameserver';
import { UserState } from '../../types';
import React from 'react';
import RemotePlayer, { RemotePlayerHandle } from './RemotePlayer';
import { DEFAULT_HEIGHT } from '../../constants/character';
import { UnsubscribeFunction } from '@agent8/gameserver/dist/src/server/GameServer';

/**
 * Main Experience component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements for the local player.
 */
function NetworkContainer() {
  const { connected, server, account } = useGameServer();
  const { roomId } = useRoomState();
  const [otherReadyPlayers, setUserStates] = useState<{ [account: string]: UserState }>({});
  const playerRefs = useRef<Record<string, React.RefObject<RemotePlayerHandle>>>({});

  useEffect(() => {
    if (!server || !connected || !roomId || !account) return;

    const unsubscribes: UnsubscribeFunction[] = [];

    unsubscribes.push(
      server.subscribeRoomState(roomId, (roomState) => {
        setUserStates((prevPlayers) => {
          let changed = false;
          const currentPlayers = Object.keys(prevPlayers);
          const newPlayers = { ...prevPlayers };
          for (const account of currentPlayers) {
            if (!roomState.$users.includes(account)) {
              delete newPlayers[account];
              delete playerRefs.current[account];
              changed = true;
            }
          }
          return changed ? newPlayers : prevPlayers;
        });
      }),
    );

    unsubscribes.push(
      server.subscribeRoomAllUserStates(roomId, (allUserStates: Record<string, UserState | null>) => {
        setUserStates((prevPlayers) => {
          let updated = false;
          const newPlayers = { ...prevPlayers };

          Object.values(allUserStates).forEach((playerState) => {
            // Skip self or null states
            if (!playerState || playerState.account === account) {
              return;
            }

            const playerAccount = playerState.account; // Get account from the state object

            // If player is ready and has position
            if (playerState.isReady && playerState.position) {
              // Add new ready players
              if (!newPlayers[playerAccount]) {
                newPlayers[playerAccount] = playerState;
                playerRefs.current[playerAccount] = React.createRef<RemotePlayerHandle>();
                updated = true;
              }

              // Sync existing players' state via refs
              const playerRef = playerRefs.current[playerAccount];
              if (playerRef?.current) {
                playerRef.current.syncState(playerState.state, playerState.position, playerState.rotation);
              }
            }
            // If player is NOT ready but exists in our list, remove them
            else if (!playerState.isReady && newPlayers[playerAccount]) {
              delete newPlayers[playerAccount];
              delete playerRefs.current[playerAccount]; // Clean up ref
              updated = true;
            }
          });

          // Note: Player removal due to leaving the room is handled by the subscribeRoomState callback

          return updated ? newPlayers : prevPlayers;
        });
      }),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [server, connected, roomId, account]);

  if (!server || !connected || !account) return null;

  return (
    <>
      {Object.values(otherReadyPlayers).map(
        (player) =>
          player.character && (
            <RemotePlayer
              key={player.account}
              ref={playerRefs.current[player.account]}
              position={player.position}
              rotation={player.rotation}
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

export default NetworkContainer;
