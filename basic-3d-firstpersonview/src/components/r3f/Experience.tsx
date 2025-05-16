import { Environment } from '@react-three/drei';
import { FirstPersonViewController, FollowLight } from 'vibe-starter-3d';
import Floor from './Floor';
import Player from './Player';

const targetHeight = 1.6;

function Experience() {
  return (
    <>
      <ambientLight intensity={0.7} />

      <FollowLight />

      <Environment preset="sunset" background={false} />

      {/* player with controller */}
      <FirstPersonViewController targetHeight={targetHeight}>
        <Player />
      </FirstPersonViewController>

      {/* Floor */}
      <Floor />
    </>
  );
}

export default Experience;
