import { useRef, useEffect, useMemo } from 'react';
import { useGameServer, useRoomAllUserStates, useRoomState } from '@agent8/gameserver';
import { UserState } from '../../types';
import React from 'react';
import { RemotePlayer, RemotePlayerHandle } from './RemotePlayer';
import { DEFAULT_HEIGHT } from '../../constants/character';
import { RoomState } from '../../types/room';
import { InstancedCubes } from './InstancedCubes';
import { useCubeStore, CubeInfo, TERRAIN_CONFIG } from '../../store/cubeStore';
import { generateTerrain } from '../../utils/terrainGenerator';

// Interface for server's cube data
interface ServerCubeData {
  position: [number, number, number];
  type: number;
  createdBy: string;
  createdAt: number;
}

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

  const updateCubes = useCubeStore((state) => state.updateCubes);

  // Add ref for tracking previous cube state (declared at top level)
  const prevCubesRef = useRef<Record<string, any>>({});

  // Flag to check initial load (moved to top level)
  const isFirstLoadRef = useRef(true);

  // Flag to track if terrain is initialized
  const terrainInitializedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !server) return;

    console.log(`[GameScene Sub] Subscribing to room states for room: ${roomId}`);

    const unsubscribe = server.subscribeRoomState(roomId, (roomState: RoomState) => {
      console.log(`[GameScene Sub] Room state: ${JSON.stringify(roomState)}`);

      // Generate terrain if cubes are empty and terrain hasn't been initialized yet
      if ((!roomState.cubes || Object.keys(roomState.cubes).length === 0) && !terrainInitializedRef.current) {
        console.log(`[GameScene] No cubes found in room, generating terrain`);
        terrainInitializedRef.current = true; // Prevent duplicate calls

        // Create seed from verse + roomId combination
        const seed = `verse${roomId}`;
        console.log(`[GameScene] Generating terrain with seed: ${seed}`);

        // Generate terrain
        const terrainCubes = generateTerrain(seed, TERRAIN_CONFIG.width, TERRAIN_CONFIG.depth);
        console.log(`[GameScene] Generated ${terrainCubes.length} terrain cubes`);

        // Send terrain cube data to server
        server
          .remoteFunction('initializeCubes', [terrainCubes])
          .then((result) => {
            console.log(`[GameScene] Terrain initialization result:`, result);
          })
          .catch((error) => {
            console.error(`[GameScene] Failed to initialize terrain:`, error);
            terrainInitializedRef.current = false; // Reset flag to allow retry if failed
          });

        return;
      }

      if (roomState.cubes) {
        console.log(`[GameScene Sub] Received cubes from server`);

        // Current cube state
        const currentCubes = roomState.cubes;

        // Update all cubes on first load
        if (isFirstLoadRef.current) {
          console.log(`[GameScene Sub] First load - Updating all cubes`);
          // Convert server cube data to client format
          const allCubes: CubeInfo[] = Object.entries(currentCubes).map(([key, cube]) => {
            const serverCube = cube as unknown as ServerCubeData;
            return {
              position: serverCube.position,
              tileIndex: serverCube.type,
            };
          });

          // Update all cubes
          updateCubes(allCubes);

          // Mark initial load as complete
          isFirstLoadRef.current = false;
          // Update previous state
          prevCubesRef.current = { ...currentCubes };
          return;
        }

        // Compare previous and current cubes to find added/removed cubes
        const addedCubes: ServerCubeData[] = [];
        const removedKeys: string[] = [];

        // Find newly added or changed cubes
        Object.entries(currentCubes).forEach(([key, cube]) => {
          if (!prevCubesRef.current[key] || JSON.stringify(prevCubesRef.current[key]) !== JSON.stringify(cube)) {
            addedCubes.push(cube as unknown as ServerCubeData);
          }
        });

        // Find removed cubes
        Object.keys(prevCubesRef.current).forEach((key) => {
          if (!currentCubes[key]) {
            removedKeys.push(key);
          }
        });

        // Log changes
        if (addedCubes.length > 0) {
          console.log(`[GameScene Sub] Adding/Updating ${addedCubes.length} cubes`);
          // Add cubes individually using addCube method
          addedCubes.forEach((cube) => {
            const { position, type } = cube;
            // Convert position format and add cube
            useCubeStore.getState().addCube(position[0], position[1], position[2], type);
          });
        }

        if (removedKeys.length > 0) {
          console.log(`[GameScene Sub] Removing ${removedKeys.length} cubes`);
          // Remove cubes individually using removeCube method
          removedKeys.forEach((key) => {
            const [x, y, z] = key.split(',').map(Number);
            useCubeStore.getState().removeCube(x, y, z);
          });
        }

        // Update previous state
        prevCubesRef.current = { ...currentCubes };
      }
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
      <InstancedCubes />
    </>
  );
}
