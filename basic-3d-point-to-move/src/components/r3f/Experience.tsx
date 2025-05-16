import { Environment, Grid } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import Player from './Player';
import Floor from './Floor';
import { PointToMoveController } from 'vibe-starter-3d';
import PointingSystem from './PointingSystem';

const Experience = () => {
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.7} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* player character with controller */}
      <PointToMoveController
        cameraMode="orthographic"
        followLight={{
          position: [60, 100, 30],
          intensity: 2,
        }}
      >
        <Player initState={CharacterState.IDLE} />
      </PointToMoveController>
      <PointingSystem />
      {/* Floor */}
      <Floor />
    </>
  );
};

export default Experience;
