import { useRef } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment, Grid, KeyboardControls } from '@react-three/drei';
import { Player } from './Player';
import { CharacterState } from '../constants/character';
import { FreeViewController, ControllerHandle } from 'vibe-starter-3d';
import { useState } from 'react';
import { useEffect } from 'react';
import Lights from './Lights';
import { keyboardMap } from '../constants/controls';
import { Floor } from './Floor';
import { Vector3 } from 'three';

export function Experience() {
  /**
   * Delay physics activate
   */
  const [pausedPhysics, setPausedPhysics] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  const controllerRef = useRef<ControllerHandle>(null);
  const camDistance = -4;
  const capsuleRadius = 0.3;
  const capsuleHeight = 0.8;
  const position = new Vector3(0, capsuleHeight / 2 + capsuleRadius, 0);
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

      <Lights />

      <Physics debug={false} paused={pausedPhysics}>
        {/* Keyboard preset */}
        <KeyboardControls map={keyboardMap}>
          {/* Environment */}
          <Environment preset="sunset" background={false} />

          {/* player character with controller */}
          <FreeViewController
            ref={controllerRef}
            position={position}
            camInitDis={camDistance}
            camMinDis={camDistance}
            camMaxDis={camDistance}
            capsuleRadius={capsuleRadius}
            capsuleHeight={capsuleHeight}
          >
            <Player initState={CharacterState.IDLE} controllerRef={controllerRef} />
          </FreeViewController>
        </KeyboardControls>

        {/* Floor */}
        <Floor />
      </Physics>
    </>
  );
}
