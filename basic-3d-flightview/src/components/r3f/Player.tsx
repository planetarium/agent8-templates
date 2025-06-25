import { useCallback, useEffect, useRef } from 'react';
import { RigidBodyPlayer, RigidBodyPlayerRef, useControllerState } from 'vibe-starter-3d';
import * as THREE from 'three';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../stores/effectStore';
import { useFrame } from '@react-three/fiber';
import { EffectType } from '../../types';
import { useMultiPlayerStore } from '../../stores/multiPlayerStore';
import { CollisionPayload, CuboidCollider } from '@react-three/rapier';
import { createBulletEffectConfig } from '../../utils/effectUtils';
import Aircraft from './Aircraft';
import { ActiveCollisionTypes } from '@dimforge/rapier3d-compat';
import { useLocalPlayerStore } from '../../stores/localPlayerStore';
import { RigidBodyObjectType } from '../../constants/rigidBodyObjectType';

const SHOOT_COOLDOWN = 200;
const AIRCRAFT_BODY_LENGTH = 3;

// Action types enum
enum ActionType {
  RESET = 'reset',
  ATTACK = 'attack',
}

const keyMapping = {
  [ActionType.RESET]: ['KeyR'],
  [ActionType.ATTACK]: ['Space'],
};

const Player = () => {
  const { account } = useGameServer();
  const { registerConnectedPlayer, unregisterConnectedPlayer } = useMultiPlayerStore();
  const { setPosition: setLocalPlayerPosition, setSpeed: setLocalPlayerSpeed } = useLocalPlayerStore();
  const { setPosition, setRotation, setVelocity } = useControllerState();

  // IMPORTANT: rigidBodyPlayerRef.current type is RigidBody
  const rigidBodyPlayerRef = useRef<RigidBodyPlayerRef>(null);
  const canShootTimestamp = useRef(0);
  const lastFramePressedReset = useRef(false);

  // Speed calculation refs
  const previousPosition = useRef<THREE.Vector3 | null>(null);
  const speedHistory = useRef<{ distance: number; deltaTime: number }[]>([]);
  const SPEED_HISTORY_LENGTH = 5;

  // IMPORTANT: Register connected player reference
  useEffect(() => {
    if (!account) return;

    registerConnectedPlayer(account, rigidBodyPlayerRef);

    return () => {
      unregisterConnectedPlayer(account);
    };
  }, [account, registerConnectedPlayer, unregisterConnectedPlayer]);

  // IMPORTANT: Update local player store position information
  useFrame(() => {
    const playerRigidBody = rigidBodyPlayerRef.current;
    if (!playerRigidBody) return;

    const position = playerRigidBody.translation();
    setLocalPlayerPosition(position.x, position.y, position.z);
  });

  // IMPORTANT: Update local player speed calculation based on position changes over 5 frames
  useFrame((_, delta) => {
    const playerRigidBody = rigidBodyPlayerRef.current;
    if (!playerRigidBody) return;

    const currentPosition = new THREE.Vector3().copy(playerRigidBody.translation());

    if (previousPosition.current) {
      // Calculate distance moved this frame
      const distance = currentPosition.distanceTo(previousPosition.current);

      // Add to speed history
      speedHistory.current.push({ distance, deltaTime: delta });

      // Keep only the last 5 frames
      if (speedHistory.current.length > SPEED_HISTORY_LENGTH) {
        speedHistory.current.shift();
      }

      // Calculate average speed over the last frames
      if (speedHistory.current.length > 0) {
        const totalDistance = speedHistory.current.reduce((sum, frame) => sum + frame.distance, 0);
        const totalTime = speedHistory.current.reduce((sum, frame) => sum + frame.deltaTime, 0);

        // Calculate speed (distance per second)
        const speed = totalTime > 0 ? totalDistance / totalTime : 0;
        setLocalPlayerSpeed(speed);
      }
    }

    // Update previous position for next frame
    previousPosition.current = currentPosition.clone();
  });

  // Action input state management - only for actions, not movement
  const actionInputRef = useRef<Partial<Record<ActionType, boolean>>>({});

  // Set up key event listeners for actions only
  useEffect(() => {
    const actionKeys = Object.values(ActionType);

    const initialState: Partial<Record<ActionType, boolean>> = {};
    actionKeys.forEach((action) => {
      initialState[action] = false;
    });
    actionInputRef.current = initialState;

    const handleKeyDown = (event: KeyboardEvent) => {
      actionKeys.forEach((action) => {
        if (keyMapping[action]?.includes(event.code)) {
          actionInputRef.current[action] = true;
        }
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      actionKeys.forEach((action) => {
        if (keyMapping[action]?.includes(event.code)) {
          actionInputRef.current[action] = false;
        }
      });
    };

    const handleMouseDown = (event: MouseEvent) => {
      const mouseButton = `Mouse${event.button}`;
      actionKeys.forEach((action) => {
        if (keyMapping[action]?.includes(mouseButton)) {
          actionInputRef.current[action] = true;
        }
      });
    };

    const handleMouseUp = (event: MouseEvent) => {
      const mouseButton = `Mouse${event.button}`;
      actionKeys.forEach((action) => {
        if (keyMapping[action]?.includes(mouseButton)) {
          actionInputRef.current[action] = false;
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
      if (!account) return;

      // Add effect locally via store
      addEffect(type, account, config);
    },
    [account, addEffect],
  );

  useFrame(() => {
    const playerRigidBody = rigidBodyPlayerRef.current;
    if (!playerRigidBody) return;

    // Shooting Logic
    const attack = actionInputRef.current[ActionType.ATTACK];
    const now = Date.now();
    const canAttack = attack && now > canShootTimestamp.current;
    if (canAttack) {
      canShootTimestamp.current = now + SHOOT_COOLDOWN;

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

  // Handle reset action input processing on every frame
  // Prevents reset from being called continuously while key is held down
  useFrame(() => {
    if (!rigidBodyPlayerRef.current) return;

    // Reset key input handling - prevents continuous execution
    // Compare with previous frame state to execute only once even when key is held down
    const inputReset = actionInputRef.current[ActionType.RESET];
    if (inputReset && !lastFramePressedReset.current) {
      // Execute reset only when key is pressed in current frame but not in previous frame
      reset();
    }

    // Store current frame's key input state for next frame comparison
    lastFramePressedReset.current = inputReset;
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
