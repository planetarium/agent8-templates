import { useCallback, useEffect, useRef } from 'react';
import { RigidBodyPlayer, RigidBodyPlayerRef, useControllerState } from 'vibe-starter-3d';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../stores/effectStore';
import { useFrame } from '@react-three/fiber';
import { EffectType } from '../../types';
import { usePlayerStore } from '../../stores/playerStore';
import { CollisionPayload, CuboidCollider } from '@react-three/rapier';
import { createBulletEffectConfig } from '../../utils/effectUtils';
import Aircraft from './Aircraft';
import { ActiveCollisionTypes } from '@dimforge/rapier3d-compat';
import { useLocalPlayerStore } from '../../stores/localPlayerStore';
import { RigidBodyObjectType } from '../../constants/rigidBodyObjectType';

const SHOOT_COOLDOWN = 200;
const AIRCRAFT_BODY_LENGTH = 3;

const Player = () => {
  const { account } = useGameServer();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const [subscribeKeys, getKeyboardInputs] = useKeyboardControls();
  const { setPosition, setRotation, setVelocity } = useControllerState();
  const { setPosition: setLocalPlayerPosition } = useLocalPlayerStore();

  const rigidBodyPlayerRef = useRef<RigidBodyPlayerRef>(null);
  const shootTimestamp = useRef(0);
  const canReset = useRef(true);

  // IMPORTANT: Register player reference
  useEffect(() => {
    if (!account) return;

    registerPlayerRef(account, rigidBodyPlayerRef);

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
    const playerRigidBody = rigidBodyPlayerRef.current;
    if (!playerRigidBody) return;

    const inputs = getKeyboardInputs();
    const now = Date.now();
    if (inputs.attack && now > shootTimestamp.current) {
      shootTimestamp.current = now + SHOOT_COOLDOWN;

      const originPosition = playerRigidBody.translation();
      const originRotation = playerRigidBody.rotation();
      const position = new THREE.Vector3(originPosition.x, originPosition.y, originPosition.z);
      const rotation = new THREE.Quaternion(originRotation.x, originRotation.y, originRotation.z, originRotation.w);

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
    if (!rigidBodyPlayerRef.current || !canReset.current) return;

    const inputs = getKeyboardInputs();
    if (inputs.reset) {
      reset();
      canReset.current = false;
    }
  });

  useFrame(() => {
    const playerRigidBody = rigidBodyPlayerRef.current;
    if (!playerRigidBody) return;

    const position = playerRigidBody.translation();
    setLocalPlayerPosition(position.x, position.y, position.z);
  });

  if (!account) return null;

  const hitBodySizeVector = new THREE.Vector3(AIRCRAFT_BODY_LENGTH / 3, AIRCRAFT_BODY_LENGTH / 5, AIRCRAFT_BODY_LENGTH);
  const colliderOffsetY = hitBodySizeVector.y / 2;

  /** handleTriggerEnter: Called when the player intersects or collides with another object.
   * - Handles when entering a specific area or colliding with another object
   */
  const handleTriggerEnter = (payload: CollisionPayload) => {
    if (payload.other.rigidBody?.userData?.['type']) {
      // TODO: Handle when entering a specific area or colliding with another object
    }
  };

  /** handleTriggerExit: Called when the player exits an intersection or ends a collision with another object.
   * - Handles when exiting a specific area or when collision with another object ends
   */
  const handleTriggerExit = (payload: CollisionPayload) => {
    if (payload.other.rigidBody?.userData?.['type']) {
      // TODO: Handle when exiting a specific area or when collision with another object ends
    }
  };

  return (
    <RigidBodyPlayer
      ref={rigidBodyPlayerRef}
      userData={{ account, type: RigidBodyObjectType.LOCAL_PLAYER }}
      onTriggerEnter={handleTriggerEnter}
      onTriggerExit={handleTriggerExit}
      autoCreateCollider={false}
      offsetY={0}
      type="kinematicPosition"
      sensor={true}
      enabledRotations={[false, false, false]}
      gravityScale={0}
    >
      <CuboidCollider
        position={[0, colliderOffsetY, 0]}
        args={[hitBodySizeVector.x / 2, hitBodySizeVector.y / 2, hitBodySizeVector.z / 2]}
        activeCollisionTypes={ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_KINEMATIC | ActiveCollisionTypes.KINEMATIC_FIXED}
      />

      <Aircraft bodyLength={AIRCRAFT_BODY_LENGTH} localPlayer={true} />
    </RigidBodyPlayer>
  );
};

export default Player;
