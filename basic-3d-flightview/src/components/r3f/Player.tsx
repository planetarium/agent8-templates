import React, { useCallback, useEffect, useRef } from 'react';
import { FlightViewControllerHandle } from 'vibe-starter-3d';
import { Aircraft } from './Aircraft';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../store/effectStore';
import { useFrame } from '@react-three/fiber';
import { createBulletEffectConfig } from './effects/BulletEffectController';
import { EffectType } from '../../types';
import { usePlayerStore } from '../../store/playerStore';

const SHOOT_COOLDOWN = 200;

/**
 * Props for the Player component.
 */
interface PlayerProps {
  /** Reference to the PlayerController handle for accessing physics state. */
  controllerRef?: React.RefObject<FlightViewControllerHandle>;
  /** Target body length for the aircraft */
  bodyLength?: number;
}

export const Player: React.FC<PlayerProps> = ({ controllerRef, bodyLength = 3 }) => {
  const { server, connected, account } = useGameServer();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const [, getKeyboardInputs] = useKeyboardControls();
  if (!server || !account) return null;

  const shootTimestamp = useRef(0);

  useEffect(() => {
    if (!account || !controllerRef.current?.rigidBodyRef.current) return;

    const rigidBody = controllerRef.current.rigidBodyRef.current;
    if (rigidBody.userData) {
      rigidBody.userData['account'] = account;
    } else {
      rigidBody.userData = { account };
    }

    registerPlayerRef(account, controllerRef.current.rigidBodyRef);

    return () => {
      unregisterPlayerRef(account);
    };
  }, [account, controllerRef, registerPlayerRef, unregisterPlayerRef]);

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
        createBulletEffectConfig({ startPosition, direction: forward, speed: bulletSpeed, duration: 500, scale: 3, flashDuration: 30, color: 'black' }),
      );
    }
  });

  return <Aircraft bodyLength={bodyLength} controllerRef={controllerRef} />;
};
