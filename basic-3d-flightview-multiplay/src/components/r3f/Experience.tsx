import { KeyboardControls, Sky } from '@react-three/drei';
import FloatingShapes from './FloatingShapes';
import { Ground } from './Ground';
import { CollisionPayload } from '@react-three/rapier';
import { useGameServer } from '@agent8/gameserver';
import { FlightViewController, FlightViewControllerHandle } from 'vibe-starter-3d';
import { Player } from './Player';
import { DEFAULT_BODY_LENGTH } from '../../constants/aircraft';
import { keyboardMap } from '../../constants/controls';

interface ExperienceProps {
  controllerRef: React.RefObject<FlightViewControllerHandle>;
}

export function Experience({ controllerRef }: ExperienceProps) {
  const { server, account } = useGameServer();
  if (!server) return null;
  if (!account) return null;

  const handleIntersectionEnter = (event: CollisionPayload) => {
    console.log('Collision detected!', event.colliderObject?.name, event.other.rigidBodyObject?.name);
  };

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 30, 10]} turbidity={0.8} rayleigh={0.4} />
      <ambientLight intensity={1.2} />

      {/* Keyboard preset */}
      <KeyboardControls map={keyboardMap}>
        <FlightViewController ref={controllerRef} minSpeed={0} maxSpeed={120} hitBodySize={[1, 0.6, 3]} onIntersectionEnter={handleIntersectionEnter}>
          <Player controllerRef={controllerRef} bodyLength={DEFAULT_BODY_LENGTH} />
        </FlightViewController>
      </KeyboardControls>

      <Ground />
      <FloatingShapes />
    </>
  );
}
