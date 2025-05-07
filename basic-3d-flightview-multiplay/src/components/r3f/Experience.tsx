import { Sky } from '@react-three/drei';
import { FlightViewController } from 'vibe-starter-3d';
import { DEFAULT_BODY_LENGTH } from '../../constants/aircraft';
import FloatingShapes from './FloatingShapes';
import Ground from './Ground';
import Player from './Player';

function Experience() {
  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 30, 10]} turbidity={0.8} rayleigh={0.4} />
      <ambientLight intensity={1.2} />

      <FlightViewController minSpeed={0} maxSpeed={120} hitBodySize={[1, 0.6, 3]}>
        <Player bodyLength={DEFAULT_BODY_LENGTH} />
      </FlightViewController>

      <Ground />
      <FloatingShapes />
    </>
  );
}

export default Experience;
