import { useRef } from 'react';
import { Environment } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { Player, PlayerRef } from './Player';
import { Floor } from './Floor';
import { PointToMoveController, ControllerHandle } from 'vibe-starter-3d';
import { PointSystem } from './PointSystem';
export function Experience() {
  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.7} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* player character with controller */}
      <PointToMoveController
        cameraMode="orthographic"
        followCharacter={true}
        ref={controllerRef}
        followLight={{
          position: [0.6, 1, 0.3],
          intensity: 2,
        }}
      >
        <Player ref={playerRef} initState={CharacterState.IDLE} controllerRef={controllerRef} />
      </PointToMoveController>
      <PointSystem />
      {/* Floor */}
      <Floor />
    </>
  );
}
