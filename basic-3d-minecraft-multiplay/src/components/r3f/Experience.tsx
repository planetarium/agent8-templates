import { useCallback, useEffect, useRef } from 'react';
import { Environment, KeyboardControls } from '@react-three/drei';
import { Player } from './Player';
import { PlayerRef } from '../../types/player';
import { CharacterState, DEFAULT_HEIGHT } from '../../constants/character';
import { keyboardMap } from '../../constants/controls';
import { Floor } from './Floor';
import { useGameServer } from '@agent8/gameserver';
import { Vector3 } from 'three';
import { useEffectStore } from '../../store/effectStore';
import { ControllerHandle, FirstPersonViewController, FreeViewController } from 'vibe-starter-3d';
import { useFrame } from '@react-three/fiber';
import { CubePreview } from './CubePreview';
import { InstancedCubes } from './InstancedCubes';
import { useCubeRaycaster } from '../../hooks/useCubeRaycaster';

/**
 * Experience component props
 */
interface ExperienceProps {
  /** Current player's character key */
  characterUrl: string;
}

// Utility to convert THREE.Vector3 to array (needed for store/server)
const vecToArray = (vec: Vector3): [number, number, number] => {
  return [vec.x, vec.y, vec.z];
};

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
  const targetHeight = 1.6;
  const { previewPosition } = useCubeRaycaster();

  const prevTime = useRef(Date.now());

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

  useFrame(() => {
    const now = Date.now();
    prevTime.current = now;
  });

  return (
    <>
      {/* Keyboard preset */}
      <KeyboardControls map={keyboardMap}>
        {/* Environment */}
        <Environment preset="sunset" background={false} />

        {/* Local player character with controller */}
        <FirstPersonViewController
          ref={controllerRef}
          targetHeight={targetHeight}
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
        </FirstPersonViewController>

        {/* Ground */}
        <Floor />

        {/* Cube Preview */}
        <CubePreview position={previewPosition} />
      </KeyboardControls>

      {/* Floor */}
      <Floor />
    </>
  );
}
