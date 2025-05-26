import { Environment } from '@react-three/drei';
import Player from './Player';
import Floor from './Floor';

const Experience = () => {
  return (
    <>
      <ambientLight intensity={0.7} />
      <Environment preset="sunset" background={false} />
      <Player />
      <Floor />
    </>
  );
};

export default Experience;
