import React, { useCallback, useEffect, useRef } from 'react';
import { useControllerState } from 'vibe-starter-3d';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../stores/effectStore';
import { useFrame } from '@react-three/fiber';
import { EffectType } from '../../types';
import { usePlayerStore } from '../../stores/playerStore';
import { RapierRigidBody } from '@react-three/rapier';
import { createBulletEffectConfig } from '../../utils/effectUtils';
import Aircraft from './Aircraft';

const SHOOT_COOLDOWN = 200;

/**
 * Props for the Player component.
 */
interface PlayerProps {
  /** Target body length for the aircraft */
  bodyLength?: number;
}

const Player: React.FC<PlayerProps> = ({ bodyLength = 3 }) => {
  const { account } = useGameServer();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const [subscribeKeys, getKeyboardInputs] = useKeyboardControls();
  const { rigidBody: controllerRigidBody, setPosition, setRotation, setVelocity } = useControllerState();

  const playerRef = useRef<RapierRigidBody>(null);
  const shootTimestamp = useRef(0);
  const canReset = useRef(true);

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

  useEffect(() => {
    return subscribeKeys((state) => {
      if (!state.reset && !canReset.current) {
        canReset.current = true;
      }
    });
  }, [subscribeKeys]);

  const reset = useCallback(() => {
    setPosition(new THREE.Vector3(0, 0, 0));
    setRotation(new THREE.Quaternion());
    setVelocity(new THREE.Vector3(0, 0, 0));
  }, [setPosition, setRotation, setVelocity]);

  // Get addEffect action from the store
  const addEffect = useEffectStore((state) => state.addEffect);

  // Callback for Player to request a cast
  const spawnEffect = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      // Add effect locally via store
      addEffect(type, account, config);
    },
    [account, addEffect],
  );

  useFrame(() => {
    if (!controllerRigidBody) return;

    const inputs = getKeyboardInputs();
    const now = Date.now();
    if (inputs.attack && now > shootTimestamp.current) {
      shootTimestamp.current = now + SHOOT_COOLDOWN;

      const position = new THREE.Vector3(controllerRigidBody.translation().x, controllerRigidBody.translation().y, controllerRigidBody.translation().z);
      const rotation = new THREE.Quaternion(
        controllerRigidBody.rotation().x,
        controllerRigidBody.rotation().y,
        controllerRigidBody.rotation().z,
        controllerRigidBody.rotation().w,
      );

      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(rotation);
      forward.normalize();

      const bulletSpeed = 200;

      const offset = forward
        .clone()
        .multiplyScalar(2)
        .add(new THREE.Vector3(0, 0.5, 0));
      const startPosition = position.clone().add(offset);
      spawnEffect(
        EffectType.BULLET,
        createBulletEffectConfig({ startPosition, direction: forward, speed: bulletSpeed, duration: 500, scale: 3, flashDuration: 30, color: 'black' }),
      );
    }
  });

  useFrame(() => {
    if (!controllerRigidBody || !canReset.current) return;

    const inputs = getKeyboardInputs();
    if (inputs.reset) {
      reset();
      canReset.current = false;
    }
  });

  if (!account) return null;

  return <Aircraft bodyLength={bodyLength} localPlayer={true} />;
};

export default Player;
