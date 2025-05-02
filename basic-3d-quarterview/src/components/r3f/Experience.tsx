import { useRef, useEffect } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment, Grid } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { useState } from 'react';
import { Player, PlayerRef } from './Player';
import { Floor } from './Floor';
import { QuarterViewController, ControllerHandle } from 'vibe-starter-3d';

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
        {/* Environment */}
        <Environment preset="sunset" background={false} />

        {/* player character with controller */}
        <QuarterViewController
          cameraMode="orthographic"
          zoom={1}
          followCharacter={true}
          ref={controllerRef}
          followLight={{
            position: [0.6, 1, 0.3],
            intensity: 2,
          }}
        >
          <Player ref={playerRef} initState={CharacterState.IDLE} controllerRef={controllerRef} />
        </QuarterViewController>

        {/* Floor */}
        <Floor />
      </Physics>
    </>
  );
}
