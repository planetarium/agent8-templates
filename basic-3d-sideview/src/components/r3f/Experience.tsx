import { useRef } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment, Grid, KeyboardControls } from '@react-three/drei';
import { CharacterState, DEFAULT_HEIGHT } from '../../constants/character';
import { ControllerHandle } from 'vibe-starter-3d';
import { useState } from 'react';
import { useEffect } from 'react';
import { keyboardMap } from '../../constants/controls';
import { Player, PlayerRef } from './Player';
import { Floor } from './Floor';
import { SideViewController } from 'vibe-starter-3d';

export function Experience() {
  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);

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
        console.log('Character size information updated:', { boundingBox });
      }
    }
  }, [playerRef.current?.boundingBox]);

  return (
    <>
      {/* Grid */}
      <Grid
        args={[100, 100]}
        rotation={[Math.PI / 2, 0, 0]}
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

      <Physics debug={false} paused={pausedPhysics}>
        {/* Keyboard preset */}
        <KeyboardControls map={keyboardMap}>
          {/* Environment */}
          <Environment preset="sunset" background={false} />

          {/* player character with controller */}
          <SideViewController
            ref={controllerRef}
            targetHeight={DEFAULT_HEIGHT}
            followLight={{
              position: [20, 30, 10],
              intensity: 1.2,
            }}
          >
            <Player ref={playerRef} initState={CharacterState.IDLE} controllerRef={controllerRef} targetHeight={DEFAULT_HEIGHT} />
          </SideViewController>
        </KeyboardControls>

        {/* Floor */}
        <Floor seed={Math.floor(Math.random() * 10000)} />
      </Physics>
    </>
  );
}
