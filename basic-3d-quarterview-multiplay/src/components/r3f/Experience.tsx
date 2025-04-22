import { useCallback, useEffect, useRef } from 'react';
import { Environment, Grid, KeyboardControls } from '@react-three/drei';
import { Player } from './Player';
import { PlayerRef } from '../../types/player';
import { CharacterState, DEFAULT_HEIGHT } from '../../constants/character';
import { keyboardMap } from '../../constants/controls';
import { Floor } from './Floor';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../store/effectStore';
import { ControllerHandle, FreeViewController, QuarterViewController } from 'vibe-starter-3d';
import { TargetingSystem } from './TargetingSystem';

/**
 * Experience component props
 */
interface ExperienceProps {
  /** Current player's character key */
  characterUrl: string;
  /** Input mode for character control */
  inputMode: 'keyboard' | 'pointToMove';
}

/**
 * Main Experience component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements for the local player.
 */
export function Experience({ characterUrl, inputMode }: ExperienceProps) {
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
      {/* Keyboard preset */}
      <KeyboardControls map={keyboardMap}>
        {/* Environment */}
        <Environment preset="sunset" background={false} />

        {/* Local player character with controller */}
        <QuarterViewController
          inputMode={inputMode}
          followCharacter={false}
          ref={controllerRef}
          targetHeight={DEFAULT_HEIGHT}
          cameraMode="orthographic"
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
        </QuarterViewController>
      </KeyboardControls>

      {/* Floor */}
      <Floor />

      {/* Targeting System */}
      <TargetingSystem />
    </>
  );
}
