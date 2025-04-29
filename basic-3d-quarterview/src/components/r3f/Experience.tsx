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
import { Enemy } from './Enemy';
import { Vector3, Group } from 'three';

type ExperienceProps = {
  inputMode: 'keyboard' | 'pointToMove';
};

export function Experience({ inputMode }: ExperienceProps) {
  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);
  const enemyRef = useRef<Group>(null);
  const [targetObject, setTargetObject] = useState<string | null>(null);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);

  // Box position setup
  const boxPosition: [number, number, number] = [5, 0.5, 5];
  // Enemy positions
  const enemyPosition: [number, number, number] = [5, 0, 5];

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

  // Handle enemy hover
  const handleEnemyHover = (id: string, isHovered: boolean) => {
    if (isHovered) {
      setHoveredEnemyId(id);
      console.log('Enemy hovered:', id);
    } else if (hoveredEnemyId === id) {
      setHoveredEnemyId(null);
      console.log('Enemy unhovered:', id);
    }
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

      <Physics debug={false} paused={pausedPhysics}>
        {/* Keyboard preset */}
        <KeyboardControls map={keyboardMap}>
          {/* Environment */}
          <Environment preset="sunset" background={false} />

          {/* player character with controller */}
          <QuarterViewController
            cameraMode="orthographic"
            inputMode={inputMode}
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

        {/* Visual container for the enemy with ref for outline */}
        <group ref={enemyRef}>
          {/* Enemy character */}
          <Enemy position={enemyPosition} characterKey="zombie" id="enemy-1" onHover={handleEnemyHover} />

          {/* Outline effect when hovered */}
          {hoveredEnemyId && (
            <>
              {/* Glowing circle under enemy */}
              <mesh position={[enemyPosition[0], 0.05, enemyPosition[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1.1, 32]} />
                <meshBasicMaterial color="#ff0000" transparent opacity={0.7} />
              </mesh>
            </>
          )}
        </group>

        {/* Targeting system */}
        <TargetingSystem />
      </Physics>
    </>
  );
}
