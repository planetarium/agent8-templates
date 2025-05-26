import { Sky } from '@react-three/drei';
import Ground from './Ground';
import FloatingShapes from './FloatingShapes';
import Player from './Player';

function Experience() {
  return (
    <>
      <ambientLight intensity={1.2} />

      <Sky distance={450000} sunPosition={[-20, 30, 10]} turbidity={0.8} rayleigh={0.4} />

      <Player />

      <Ground />

      <FloatingShapes />
    </>
  );
}

export default Experience;
