import { useRef, useEffect } from 'react';
import { Environment, Grid } from '@react-three/drei';
import { Player } from './Player';
import { PlayerRef } from '../../types/player';
import { Floor } from './Floor';
import { ControllerHandle, FirstPersonViewController } from 'vibe-starter-3d';
import { useGameServer } from '@agent8/gameserver';
import { CharacterState } from '../../constants/character';

const targetHeight = 1.6;

/**
 * Experience component props
 */
interface ExperienceProps {
  /** Current player's character key */
  characterUrl: string;
}

export function Experience({ characterUrl }: ExperienceProps) {
  const { server, account } = useGameServer();

  if (!server) return null;
  if (!account) return null;

  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    if (playerRef.current) {
      const boundingBox = playerRef.current.boundingBox;

      if (boundingBox) {
        console.log('Character size information updated:', boundingBox);
      }
    }
  }, [playerRef.current?.boundingBox]);

  return (
    <>
      {/* Grid */}
      <Grid
        args={[100, 100]}
        position={[0, 0.1, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9f9f9f"
        fadeDistance={100}
        fadeStrength={1}
        userData={{ camExcludeCollision: true }}
      />

      <ambientLight intensity={0.7} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* player character with controller */}
      <FirstPersonViewController
        ref={controllerRef}
        camInitDis={-5}
        targetHeight={targetHeight}
        followLight={{
          position: [20, 30, 10],
          intensity: 1.2,
        }}
      >
        <Player ref={playerRef} targetHeight={targetHeight} initialState={CharacterState.IDLE} controllerRef={controllerRef} characterKey={characterUrl} />
      </FirstPersonViewController>

      {/* Floor */}
      <Floor />
    </>
  );
}
