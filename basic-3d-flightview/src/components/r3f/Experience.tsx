import { KeyboardControls, Sky } from '@react-three/drei';
import { keyboardMap } from '../../constants/controls';
import { Airplane } from './Airplane';
import { BulletManager } from './BulletManager';
import FloatingShapes from './FloatingShapes';
import { Ground } from './Ground';
import { CollisionPayload, Physics } from '@react-three/rapier';
import { FlightViewController, FlightViewControllerHandle } from 'vibe-starter-3d';

interface ExperienceProps {
  controllerRef: React.RefObject<FlightViewControllerHandle>;
}

export function Experience({ controllerRef }: ExperienceProps) {
  const handleIntersectionEnter = (event: CollisionPayload) => {
    console.log('Collision detected!', event.colliderObject?.name, event.other.rigidBodyObject?.name);
  };

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 30, 10]} turbidity={0.8} rayleigh={0.4} />

      <ambientLight intensity={1.2} />

      <Physics debug={false} gravity={[0, -9.81, 0]}>
        <KeyboardControls map={keyboardMap}>
          <FlightViewController ref={controllerRef} minSpeed={0} maxSpeed={120} hitBodySize={[1, 0.6, 3]} onIntersectionEnter={handleIntersectionEnter}>
            <Airplane controllerRef={controllerRef} />
          </FlightViewController>
        </KeyboardControls>

        <BulletManager controllerRef={controllerRef} />

        <Ground />
        <FloatingShapes />
      </Physics>
    </>
  );
}
