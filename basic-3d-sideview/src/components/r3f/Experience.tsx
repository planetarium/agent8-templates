import { useRef, useEffect } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment, Grid } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { useState } from 'react';
import { Player, PlayerRef } from './Player';
import { Floor } from './Floor';
import { ControllerHandle, SideViewController } from 'vibe-starter-3d';

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
      <SideViewController cameraMode="perspective" followCharacter={true} ref={controllerRef}>
        <Player ref={playerRef} initState={CharacterState.IDLE} controllerRef={controllerRef} />
      </SideViewController>

      {/* Floor */}
      <Floor seed={12345} />
    </>
  );
}
