import React, { useCallback, useEffect, useRef } from 'react';
import { useControllerState, useMouseControls } from 'vibe-starter-3d';
import * as THREE from 'three';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../stores/effectStore';
import { useFrame } from '@react-three/fiber';
import { EffectType } from '../../types';
import { usePlayerStore } from '../../stores/playerStore';
import { RapierRigidBody } from '@react-three/rapier';
import { createBulletEffectConfig } from '../../utils/effectUtils';

const SHOOT_COOLDOWN = 200;

const Player: React.FC = () => {
  const { account } = useGameServer();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const getMouseInputs = useMouseControls();
  const { rigidBody: controllerRigidBody } = useControllerState();

  const playerRef = useRef<RapierRigidBody>(null);
  const shootTimestamp = useRef(0);
  const leftPressedLastFrame = useRef(false);

  // IMPORTANT: Update player reference
  useEffect(() => {
    playerRef.current = controllerRigidBody;
  }, [controllerRigidBody]);

  // IMPORTANT: Register player reference
  useEffect(() => {
    if (!account) return;

    registerPlayerRef(account, playerRef);

    return () => {
      unregisterPlayerRef(account);
    };
  }, [account, registerPlayerRef, unregisterPlayerRef]);

  // Get addEffect action from the store
  const addEffect = useEffectStore((state) => state.addEffect);

  // Callback for Player to request a cast
  const spawnEffect = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      if (!account) return;

      // Add effect locally via store
      addEffect(type, account, config);
    },
    [addEffect, account],
  );

  // useFrame hook for handling shooting logic
  useFrame(({ camera }) => {
    if (!controllerRigidBody) return;

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

  return null;
};

export default Player;
