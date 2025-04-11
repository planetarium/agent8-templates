import { useRef } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment, Grid, KeyboardControls } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { FreeViewController, ControllerHandle } from 'vibe-starter-3d';
import { useState } from 'react';
import { useEffect } from 'react';
import { keyboardMap } from '../../constants/controls';
import { Floor } from './Floor';
import { Player, PlayerRef } from './Player';
export function Experience() {
  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);
  const targetHeight = 1.6;

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

  useEffect(() => {
    if (playerRef.current) {
      const boundingBox = playerRef.current.boundingBox;

      if (boundingBox) {
        console.log('Player character size information updated:', boundingBox);
      }
    }
  }, [playerRef.current?.boundingBox]);

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

      <Physics debug={true} paused={pausedPhysics}>
        {/* Keyboard preset */}
        <KeyboardControls map={keyboardMap}>
          {/* Environment */}
          <Environment preset="sunset" background={false} />

          {/* player character with controller */}
          <FreeViewController
            ref={controllerRef}
            targetHeight={targetHeight}
            followLight={{
              position: [20, 30, 10],
              intensity: 1.2,
            }}
          >
            <Player ref={playerRef} initState={CharacterState.IDLE} controllerRef={controllerRef} targetHeight={targetHeight} />
          </FreeViewController>
        </KeyboardControls>

        {/* Floor */}
        <Floor />
      </Physics>
    </>
  );
}
