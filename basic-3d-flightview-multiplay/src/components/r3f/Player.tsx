import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useControllerState } from 'vibe-starter-3d';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { throttle } from 'lodash';
import { useGameServer, useRoomState } from '@agent8/gameserver';
import { AircraftState } from '../../constants/aircraft';
import { useEffectStore } from '../../stores/effectStore';
import { useFrame } from '@react-three/fiber';
import { EffectType } from '../../types';
import { usePlayerStore } from '../../stores/playerStore';
import { RapierRigidBody } from '@react-three/rapier';
import { createBulletEffectConfig } from '../../utils/effectUtils';
import Aircraft from './Aircraft';

const SHOOT_COOLDOWN = 200;

/**
 * Network synchronization constants.
 */
const NETWORK_CONSTANTS = {
  SYNC: {
    /** Interval (in milliseconds) for sending updates to the server via throttle. */
    INTERVAL_MS: 100,
    /** Minimum position change (in meters) required to trigger a network update. */
    POSITION_CHANGE_THRESHOLD: 0.01,
    /** Minimum rotation change (in radians) required to trigger a network update. */
    ROTATION_CHANGE_THRESHOLD: 0.01,
  },
};

/**
 * Props for the Player component.
 */
interface PlayerProps {
  /** Target body length for the aircraft */
  bodyLength?: number;
}

const Player: React.FC<PlayerProps> = ({ bodyLength = 3 }) => {
  const { server, connected, account } = useGameServer();
  const { roomId } = useRoomState();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const [, getKeyboardInputs] = useKeyboardControls();
  const { rigidBody: controllerRigidBody, setPosition, setRotation, setVelocity } = useControllerState();

  const [die, setDie] = useState(false);
  const playerRef = useRef<RapierRigidBody>(null);
  const latestState = useRef(AircraftState.ACTIVE);
  const shootTimestamp = useRef(0);

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

  // Ref to store the previously *sent* state for dirty checking
  const prevSentTransformRef = useRef({
    position: new THREE.Vector3(0, Number.MAX_VALUE, 0),
    rotation: new THREE.Quaternion(),
  });

  const reset = useCallback(() => {
    setPosition(new THREE.Vector3(0, 0, 0));
    setRotation(new THREE.Quaternion());
    setVelocity(new THREE.Vector3(0, 0, 0));
  }, [setPosition, setRotation, setVelocity]);

  useEffect(() => {
    if (!server || !connected || !roomId) return;

    const unsubscribe = server.subscribeRoomMyState(roomId, (roomMyState) => {
      if (latestState.current !== AircraftState.DIE && roomMyState.state === AircraftState.DIE) {
        latestState.current = AircraftState.DIE;
        setDie(true);
      } else if (latestState.current === AircraftState.DIE && roomMyState.state !== AircraftState.DIE) {
        latestState.current = AircraftState.ACTIVE;
        setDie(false);
        reset();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [server, connected, roomId, reset]);

  useEffect(() => {
    if (!server || !connected || !roomId) return;

    if (die) {
      server.remoteFunction('revive', []);
    }
  }, [server, connected, roomId, die]);

  // Optimized network synchronization function
  const throttledSyncToNetworkTransform = useMemo(
    () =>
      throttle(
        async (position: THREE.Vector3, rotation: THREE.Quaternion) => {
          if (!server) return;

          try {
            server.remoteFunction('updateMyState', [{ position: position.toArray(), rotation: rotation.toArray() }], { needResponse: false, throttle: 50 });
          } catch (error) {
            console.error(`[Player] Network sync failed:`, error);
          }
        },
        NETWORK_CONSTANTS.SYNC.INTERVAL_MS,
        { leading: true, trailing: true },
      ),
    [server],
  );

  // Simplified network synchronization logic
  const syncToNetworkTransform = useCallback(
    async (currentPosition: THREE.Vector3, currentRotation: THREE.Quaternion) => {
      if (!server) return;

      // Efficient dirty checking
      const positionDiff = currentPosition.distanceTo(prevSentTransformRef.current.position);
      const rotationDiff = currentRotation.angleTo(prevSentTransformRef.current.rotation);

      // Network update only when there's sufficient change
      if (positionDiff >= NETWORK_CONSTANTS.SYNC.POSITION_CHANGE_THRESHOLD || rotationDiff >= NETWORK_CONSTANTS.SYNC.ROTATION_CHANGE_THRESHOLD) {
        // Update state before network call to prevent duplicate calls
        prevSentTransformRef.current.position.copy(currentPosition);
        prevSentTransformRef.current.rotation.copy(currentRotation);

        // Async call without await to avoid blocking frame rendering
        throttledSyncToNetworkTransform(currentPosition, currentRotation);
      }
    },
    [server, throttledSyncToNetworkTransform],
  );

  // Function to send effect event to the server
  const sendEffectToServer = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      if (!server) return;
      try {
        await server.remoteFunction('sendEffectEvent', [type, config]);
      } catch (error) {
        console.error(`[${type}] Failed to send effect event:`, error);
      }
    },
    [server], // Dependency on server object
  );

  // Get addEffect action from the store
  const addEffect = useEffectStore((state) => state.addEffect);

  // Callback for Player to request a cast
  const spawnEffect = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      // 1. Add effect locally via store
      addEffect(type, account, config);

      // 2. Send effect event to server
      await sendEffectToServer(type, config);
    },
    [account, addEffect, sendEffectToServer],
  );

  useFrame(() => {
    if (!controllerRigidBody) return;
    if (latestState.current === AircraftState.DIE) return;

    const position = new THREE.Vector3(controllerRigidBody.translation().x, controllerRigidBody.translation().y, controllerRigidBody.translation().z);
    const rotation = new THREE.Quaternion(
      controllerRigidBody.rotation().x,
      controllerRigidBody.rotation().y,
      controllerRigidBody.rotation().z,
      controllerRigidBody.rotation().w,
    );
    const inputs = getKeyboardInputs();
    const now = Date.now();
    if (inputs.attack && now > shootTimestamp.current) {
      shootTimestamp.current = now + SHOOT_COOLDOWN;

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

    syncToNetworkTransform(position, rotation);
  });

  if (!server || !account) return null;

  return <>{!die && <Aircraft bodyLength={bodyLength} localPlayer={true} />}</>;
};

export default Player;
