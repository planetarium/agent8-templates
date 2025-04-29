import React, { useCallback, useEffect, useRef } from 'react';
import { ControllerHandle, useMouseControls } from 'vibe-starter-3d';
import * as THREE from 'three';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../stores/effectStore';
import { useFrame } from '@react-three/fiber';
import { createBulletEffectConfig } from './effects/BulletEffectController';
import { EffectType } from '../../types';
import { usePlayerStore } from '../../stores/playerStore';

const SHOOT_COOLDOWN = 200;

/**
 * Props for the Player component.
 */
interface PlayerProps {
  /** Reference to the PlayerController handle for accessing physics state. */
  controllerRef?: React.RefObject<ControllerHandle>;
}

export const Player: React.FC<PlayerProps> = ({ controllerRef }) => {
  const { server, connected, account } = useGameServer();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const getMouseInputs = useMouseControls();

  if (!server || !account) return null;

  const shootTimestamp = useRef(0);
  const leftPressedLastFrame = useRef(false);

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

  useFrame(({ camera }, delta) => {
    const rigidBody = controllerRef.current?.rigidBodyRef?.current;
    if (!rigidBody) return;

    const { left } = getMouseInputs();

    const now = Date.now();
    const leftJustPressed = left && !leftPressedLastFrame.current;
    leftPressedLastFrame.current = left;

    if (leftJustPressed && now > shootTimestamp.current) {
      shootTimestamp.current = now + SHOOT_COOLDOWN;

      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);

      const bulletSpeed = 200;

      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);
      const startPosition = cameraPosition.add(direction.clone().multiplyScalar(1.5));

      spawnEffect(
        EffectType.BULLET,
        createBulletEffectConfig({ startPosition, direction, speed: bulletSpeed, duration: 500, scale: 3, flashDuration: 30, color: 'black' }),
      );
    }
  });
};
