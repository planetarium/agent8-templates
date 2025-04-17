import * as THREE from 'three';
import { Sky, useKeyboardControls } from '@react-three/drei';
import { Airplane } from './Airplane';
import FloatingShapes from './FloatingShapes';
import { Ground } from './Ground';
import { CollisionPayload, Physics } from '@react-three/rapier';
import { FlightViewController, FlightViewControllerHandle } from 'vibe-starter-3d';
import { useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../store/effectStore';
import { EffectType } from '../../types';
import { EffectContainer } from './EffectContainer';
import { createBulletEffectConfig } from './effects/BulletEffectController';

const SHOOT_COOLDOWN = 200;

interface ExperienceProps {
  controllerRef: React.RefObject<FlightViewControllerHandle>;
}

export function Experience({ controllerRef }: ExperienceProps) {
  const { server, account } = useGameServer();
  if (!server) return null;
  if (!account) return null;
  const [, getKeyboardInputs] = useKeyboardControls();
  const shootTimestamp = useRef(0);

  useEffect(() => {
    if (!account || !controllerRef.current?.rigidBodyRef.current) return;

    const rigidBodyRef = controllerRef.current.rigidBodyRef.current;
    if (rigidBodyRef.userData) {
      rigidBodyRef.userData['account'] = account;
    } else {
      rigidBodyRef.userData = { account };
    }
  }, [account, controllerRef.current?.rigidBodyRef.current]);

  const handleIntersectionEnter = (event: CollisionPayload) => {
    console.log('Collision detected!', event.colliderObject?.name, event.other.rigidBodyObject?.name);
  };

  // Get addEffect action from the store
  const addEffect = useEffectStore((state) => state.addEffect);

  // Callback for Player to request a cast
  const spawnEffect = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      // Add effect locally via store
      addEffect(type, account, config);

      console.log('[Experience] Cast:', type, config);
    },
    [addEffect],
  );

  useFrame((_, delta) => {
    const currentState = controllerRef.current;
    const inputs = getKeyboardInputs();
    const now = Date.now();
    if (currentState && inputs.attack && now > shootTimestamp.current) {
      shootTimestamp.current = now + SHOOT_COOLDOWN;

      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(currentState.orientation);
      forward.normalize();

      const bulletSpeed = 200;

      const offset = forward
        .clone()
        .multiplyScalar(2)
        .add(new THREE.Vector3(0, 0.5, 0));
      const startPosition = currentState.position.clone().add(offset);
      spawnEffect(
        EffectType.BULLET,
        createBulletEffectConfig({ startPosition, direction: forward, speed: bulletSpeed, duration: 2000, scale: 3, flashDuration: 30, color: 'black' }),
      );
    }
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 30, 10]} turbidity={0.8} rayleigh={0.4} />

      <ambientLight intensity={1.2} />

      <Physics debug={false} gravity={[0, -9.81, 0]}>
        <FlightViewController ref={controllerRef} minSpeed={0} maxSpeed={120} hitBodySize={[1, 0.6, 3]} onIntersectionEnter={handleIntersectionEnter}>
          <Airplane controllerRef={controllerRef} />
        </FlightViewController>

        <Ground />
        <FloatingShapes />

        <EffectContainer />
      </Physics>
    </>
  );
}
