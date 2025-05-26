import { Environment, Grid } from '@react-three/drei';
import Player from './Player';
import Floor from './Floor';

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
      <Environment preset="sunset" background={false} />
      <Player />
      <Floor />
    </>
  );
};

export default Experience;
