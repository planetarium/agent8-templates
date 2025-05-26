import { Environment, Grid } from '@react-three/drei';
import Floor from './Floor';
import Player from './Player';

function Experience() {
  return (
    <>
      <ambientLight intensity={0.7} />

      <Environment preset="sunset" background={false} />

      <Player />

      <Floor />
    </>
  );
}

export default Experience;
