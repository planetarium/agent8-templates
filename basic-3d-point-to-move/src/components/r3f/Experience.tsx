import { Environment, Grid } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import Player from './Player';
import Floor from './Floor';
import { PointToMoveController, FollowLight } from 'vibe-starter-3d';
import PointingSystem from './PointingSystem';

const Experience = () => {
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

      <ambientLight intensity={0.7} />

      <FollowLight offset={[60, 100, 30]} intensity={2} />

      <Environment preset="sunset" background={false} />

      {/* player character with controller */}
      <PointToMoveController cameraMode="orthographic">
        <Player initState={CharacterState.IDLE} />
      </PointToMoveController>
      <PointingSystem />
      {/* Floor */}
      <Floor />
    </>
  );
};

export default Experience;
