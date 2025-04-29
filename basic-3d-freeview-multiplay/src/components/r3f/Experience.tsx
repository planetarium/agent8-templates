import { useCallback, useEffect, useRef } from 'react';
import { Environment, Grid } from '@react-three/drei';
import { Player } from './Player';
import { PlayerRef } from '../../types/player';
import { CharacterState, DEFAULT_HEIGHT } from '../../constants/character';
import { Floor } from './Floor';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../stores/effectStore';
import { ControllerHandle, FreeViewController } from 'vibe-starter-3d';

/**
 * Experience component props
 */
interface ExperienceProps {
  /** Current player's character key */
  characterUrl: string;
}

/**
 * Main Experience component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements for the local player.
 */
export function Experience({ characterUrl }: ExperienceProps) {
  const { server, account } = useGameServer();
  if (!server) return null;
  if (!account) return null;
  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);

  // Get addEffect action from the store
  const addEffect = useEffectStore((state) => state.addEffect);

  // Function to send effect event to the server
  const sendEffectToServer = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      if (!server) return;
      try {
        await server.remoteFunction('sendEffectEvent', [type, config]);
      } catch (error) {
        console.error(`[${type}] Failed to send effect event:`, error);
      }
    },
    [server], // Dependency on server object
  );

  // Callback for Player to request a magic cast
  const spawnEffect = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      // 1. Add effect locally via store
      addEffect(type, account, config);

      console.log('[Experience] Cast magic:', type, config);

      // 2. Send effect event to server
      await sendEffectToServer(type, config);
    },
    [addEffect, sendEffectToServer], // Dependencies
  );

  useEffect(() => {
    if (!account || !controllerRef.current?.rigidBodyRef.current) return;

    const rigidBodyRef = controllerRef.current.rigidBodyRef.current;
    if (rigidBodyRef.userData) {
      rigidBodyRef.userData['account'] = account;
    } else {
      rigidBodyRef.userData = { account };
    }
  }, [account, controllerRef.current?.rigidBodyRef.current]);

  return (
    <>
      {/* Grid */}
      <Grid
        args={[100, 100]}
        position={[0, 0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9f9f9f"
        fadeDistance={100}
        fadeStrength={1}
        userData={{ camExcludeCollision: true }} // this won't be collide by camera ray
      />

      <ambientLight intensity={0.7} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* Local player character with controller */}
      <FreeViewController
        ref={controllerRef}
        targetHeight={DEFAULT_HEIGHT}
        followLight={{
          position: [20, 30, 10],
          intensity: 1.2,
        }}
      >
        <Player
          spawnEffect={spawnEffect}
          initialState={CharacterState.IDLE}
          controllerRef={controllerRef}
          characterKey={characterUrl}
          server={server}
          ref={playerRef}
        />
      </FreeViewController>

      {/* Floor */}
      <Floor />
    </>
  );
}
