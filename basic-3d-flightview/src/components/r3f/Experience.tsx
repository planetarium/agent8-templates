import { Sky } from '@react-three/drei';
import { FlightViewController, FollowLight } from 'vibe-starter-3d';
import { DEFAULT_BODY_LENGTH } from '../../constants/aircraft';
import Runway from './Runway';
import FloatingShapes from './FloatingShapes';
import Player from './Player';

function Experience() {
  return (
    <>
      <ambientLight intensity={1.2} />

      <FollowLight />

      <Sky distance={450000} sunPosition={[-20, 30, 10]} turbidity={0.8} rayleigh={0.4} />

      <FlightViewController minSpeed={0} maxSpeed={120} hitBodySize={[1, 0.6, 3]}>
        <Player bodyLength={DEFAULT_BODY_LENGTH} />
      </FlightViewController>

      <Runway />
      <FloatingShapes />
    </>
  );
}

export default Experience;
