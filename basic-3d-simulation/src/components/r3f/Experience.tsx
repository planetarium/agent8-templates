import { Environment, Grid } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import Player from './Player';
import Floor from './Floor';
import { SimulationViewController, FollowLight } from 'vibe-starter-3d';
import { useMemo } from 'react';
import Selectable from './Selectable.tsx';
import useSelectStore from '../../stores/selectStore.ts';

const Experience = () => {
  // Clear selection when clicking on the floor
  const clearSelection = useSelectStore((state) => state.clearSelection);

  // Define positions and colors for 4 boxes
  const boxes = useMemo(
    () => [
      { position: [3, 0.5, 3] as [number, number, number], color: '#ff4444' }, // Red
      { position: [3, 0.5, -3] as [number, number, number], color: '#44ff44' }, // Green
      { position: [-3, 0.5, 3] as [number, number, number], color: '#4444ff' }, // Blue
      { position: [-3, 0.5, -3] as [number, number, number], color: '#ff44ff' }, // Purple
    ],
    [],
  );

  // Define positions and colors for 2 spheres
  const spheres = useMemo(
    () => [
      { position: [0, 1, 5] as [number, number, number], color: '#f5a742' }, // Orange
      { position: [0, 1, -5] as [number, number, number], color: '#42f5d7' }, // Cyan
    ],
    [],
  );

  return (
    <>
      {/* For debugging purposes only */}
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

      {/* Ambient light */}
      <ambientLight intensity={0.7} />

      <FollowLight offset={[60, 100, 30]} intensity={2} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      <SimulationViewController cameraMode="perspective" />

      {/* Clear selection when clicking on the floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={clearSelection}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial visible={false} />
      </mesh>

      {/* Floor */}
      <Floor />
    </>
  );
};

export default Experience;
