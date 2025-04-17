import { useRef, useState } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment, Grid, KeyboardControls } from '@react-three/drei';
import { CharacterState, DEFAULT_HEIGHT } from '../../constants/character';
import { ControllerHandle } from 'vibe-starter-3d';
import { useEffect } from 'react';
import { keyboardMap } from '../../constants/controls';
import { Player, PlayerRef } from './Player';
import { Floor } from './Floor';
import { QuarterViewController } from 'vibe-starter-3d';
import { TargetingSystem } from './TargetingSystem';
import { Box } from './Box';
import { Vector3 } from 'three';

export function Experience() {
  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);
  const [targetObject, setTargetObject] = useState<string | null>(null);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);

  // Box position setup
  const boxPosition: [number, number, number] = [5, 0.5, 5];

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

  // Box left-click handler
  const handleBoxClick = () => {
    setTargetObject('box');
    setTargetPosition(new Vector3(boxPosition[0], boxPosition[1], boxPosition[2]));
    console.log('Box clicked - attacking target');
  };

  // Box right-click handler
  const handleBoxRightClick = () => {
    setTargetObject('box');
    setTargetPosition(new Vector3(boxPosition[0], boxPosition[1], boxPosition[2]));
    console.log('Box right-clicked - attacking target');
  };

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
          <QuarterViewController
            cameraMode="orthographic"
            inputMode="pointToMove"
            followCharacter={true}
            ref={controllerRef}
            targetHeight={DEFAULT_HEIGHT}
            followLight={{
              position: [20, 30, 10],
              intensity: 1.2,
            }}
          >
            <Player ref={playerRef} initState={CharacterState.IDLE} controllerRef={controllerRef} targetHeight={DEFAULT_HEIGHT} isAttacking={!!targetObject} />
          </QuarterViewController>
        </KeyboardControls>

        {/* Floor */}
        <Floor />

        {/* Attack target box */}
        <Box position={boxPosition} size={[1, 1, 1]} color="red" onClick={handleBoxClick} onRightClick={handleBoxRightClick} />

        {/* Targeting system */}
        <TargetingSystem targetObject={targetObject} setTargetObject={setTargetObject} targetPosition={targetPosition} />
      </Physics>
    </>
  );
}
