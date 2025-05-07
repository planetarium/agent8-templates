import React, { useRef, useMemo, useCallback, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import Assets from '../../assets.json';
import { useGameServer, useRoomState } from '@agent8/gameserver';
import throttle from 'lodash/throttle';
import { PlayerInputs, PlayerRef } from '../../types/player';
import {
  AnimationConfigMap,
  CharacterRenderer,
  CharacterRendererRef,
  CharacterResource,
  toQuaternionArray,
  toVector3Array,
  useControllerState,
  useMouseControls,
} from 'vibe-starter-3d';
import { usePlayerStore } from '../../stores/playerStore';
import { EffectType } from '../../types';
import { useEffectStore } from '../../stores/effectStore';
import { RapierRigidBody } from '@react-three/rapier';
import { createBulletEffectConfig } from '../../utils/effectUtils';

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

const SHOOT_COOLDOWN = 200;

/**
 * Props for the Player component.
 */
interface PlayerProps {
  /** Initial animation state for the character. */
  initialState?: CharacterState;
  /** Target height for the character model */
  targetHeight?: number;
  /** Callback to request spawn effect */
  spawnEffect?: (type: string, config?: { [key: string]: any }) => void;
  /** Key identifying the character model/resources to use. */
  characterKey?: string;
}

/**
 * Hook containing the logic to determine the player's animation state based on inputs.
 */
function usePlayerStates() {
  // Determines the next character state based on current state and inputs.
  const determinePlayerState = React.useCallback((currentState: CharacterState, inputs: PlayerInputs): CharacterState => {
    const { isRevive, isDying, isPunching, isHit, isJumping, isMoving, isRunning } = inputs;

    // State transition priority:
    if (isRevive && currentState === CharacterState.DIE) return CharacterState.IDLE;
    if (isDying || currentState === CharacterState.DIE) return CharacterState.DIE;
    if (isHit) return CharacterState.HIT;
    if (isPunching && currentState !== CharacterState.PUNCH && currentState !== CharacterState.JUMP && currentState !== CharacterState.HIT)
      return CharacterState.PUNCH;
    if (isJumping && currentState !== CharacterState.PUNCH && currentState !== CharacterState.HIT) return CharacterState.JUMP;
    if (currentState === CharacterState.PUNCH) return CharacterState.PUNCH; // Maintain punch until animation finishes

    // Movement states (only if not in an interruptible state like jump/hit/punch)
    if (currentState !== CharacterState.JUMP && currentState !== CharacterState.HIT && currentState !== CharacterState.PUNCH) {
      if (isMoving) {
        return isRunning ? CharacterState.RUN : CharacterState.WALK;
      } else {
        return CharacterState.IDLE;
      }
    }
    // Default: maintain current state
    return currentState;
  }, []);

  return { determinePlayerState };
}

/**
 * Hook for managing player animations.
 */
function usePlayerAnimations(currentStateRef: React.MutableRefObject<CharacterState>) {
  // Callback triggered when a non-looping animation finishes.
  const handleAnimationComplete = React.useCallback(
    (completedState: CharacterState) => {
      // Transition back to IDLE only if the state hasn't changed
      if (currentStateRef.current === completedState) {
        switch (completedState) {
          case CharacterState.JUMP:
          case CharacterState.PUNCH:
          case CharacterState.HIT:
            currentStateRef.current = CharacterState.IDLE;
            break;
          default:
            break;
        }
      }
    },
    [currentStateRef],
  );

  // Memoized map of animation configurations.
  const animationConfigMap: Partial<AnimationConfigMap<CharacterState>> = useMemo(
    () => ({
      [CharacterState.IDLE]: {
        animationType: 'IDLE',
        loop: true,
      },
      [CharacterState.WALK]: {
        animationType: 'WALK',
        loop: true,
      },
      [CharacterState.RUN]: {
        animationType: 'RUN',
        loop: true,
      },
      [CharacterState.JUMP]: {
        animationType: 'JUMP',
        loop: false,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.JUMP),
      },
      [CharacterState.PUNCH]: {
        animationType: 'PUNCH',
        loop: false,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.PUNCH),
      },
      [CharacterState.HIT]: {
        animationType: 'HIT',
        loop: false,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.HIT),
      },
      [CharacterState.DIE]: {
        animationType: 'DIE',
        loop: false,
        duration: 10,
        clampWhenFinished: true,
      },
    }),
    [handleAnimationComplete],
  );

  return { animationConfigMap };
}

/**
 * Player component - Represents the local player character.
 * Manages inputs, state transitions, animations, and network synchronization.
 */
const Player = forwardRef<PlayerRef, PlayerProps>(({ initialState = CharacterState.IDLE, targetHeight = 1.6, characterKey = 'y-bot.glb' }, ref) => {
  const { server, connected, account } = useGameServer();
  const { roomId } = useRoomState();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const getMouseInputs = useMouseControls();
  const [, getKeyboardInputs] = useKeyboardControls();
  const { determinePlayerState } = usePlayerStates();
  const { rigidBody: controllerRigidBody, childrenGroup: controllerChildrenGroup, setPosition, setRotation, setVelocity } = useControllerState();

  const playerRef = useRef<RapierRigidBody>(null);
  const [die, setDie] = useState(false);
  const latestState = useRef(CharacterState.IDLE);
  const shootTimestamp = useRef(0);
  const leftPressedLastFrame = useRef(false);

  const currentStateRef = useRef<CharacterState>(initialState);
  const { animationConfigMap } = usePlayerAnimations(currentStateRef);

  const characterRendererRef = useRef<CharacterRendererRef>(null);

  // Ref to store the previously *sent* state for dirty checking
  const prevSentStateRef = useRef({
    position: new THREE.Vector3(0, Number.MAX_VALUE, 0),
    rotation: new THREE.Quaternion(),
    state: initialState,
  });

  useImperativeHandle(
    ref,
    () => ({
      get boundingBox() {
        return characterRendererRef.current?.boundingBox || null;
      },
    }),
    [],
  );

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
      // Add effect locally via store
      addEffect(type, account, config);
    },
    [addEffect, account],
  );

  const reset = useCallback(() => {
    const offsetY = controllerChildrenGroup?.position?.y ?? 0;
    setPosition(new THREE.Vector3(0, -offsetY, 0));
    setRotation(new THREE.Quaternion());
    setVelocity(new THREE.Vector3(0, 0, 0));
  }, [setPosition, setRotation, setVelocity, controllerChildrenGroup]);

  useEffect(() => {
    if (!server || !connected || !roomId) return;

    const unsubscribe = server.subscribeRoomMyState(roomId, (roomMyState) => {
      if (latestState.current !== CharacterState.DIE && roomMyState.state === CharacterState.DIE) {
        latestState.current = CharacterState.DIE;
        setDie(true);
      } else if (latestState.current === CharacterState.DIE && roomMyState.state !== CharacterState.DIE) {
        latestState.current = roomMyState.state;
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
  const throttledSyncToNetwork = useMemo(
    () =>
      throttle(
        async (position: THREE.Vector3, rotation: THREE.Quaternion, state: CharacterState) => {
          if (!server) return;

          try {
            server.remoteFunction('updateMyState', [{ position: toVector3Array(position), rotation: toQuaternionArray(rotation), state }], {
              needResponse: false,
              throttle: 50,
            });
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
  const syncToNetwork = useCallback(
    async (currentPosition: THREE.Vector3, currentRotation: THREE.Quaternion, currentState: CharacterState) => {
      if (!server) return;

      // Efficient dirty checking
      const positionDiff = currentPosition.distanceTo(prevSentStateRef.current.position);
      const rotationDiff = currentRotation.angleTo(prevSentStateRef.current.rotation);
      const stateChanged = currentState !== prevSentStateRef.current.state;

      // Network update only when there's sufficient change
      if (
        stateChanged ||
        positionDiff >= NETWORK_CONSTANTS.SYNC.POSITION_CHANGE_THRESHOLD ||
        rotationDiff >= NETWORK_CONSTANTS.SYNC.ROTATION_CHANGE_THRESHOLD
      ) {
        // Update state before network call to prevent duplicate calls
        prevSentStateRef.current.position.copy(currentPosition);
        prevSentStateRef.current.rotation.copy(currentRotation);
        prevSentStateRef.current.state = currentState;

        // Async call without await to avoid blocking frame rendering
        throttledSyncToNetwork(currentPosition, currentRotation, currentState);
      }
    },
    [server, throttledSyncToNetwork],
  );

  // cast bullet
  useFrame(({ camera }) => {
    if (latestState.current === CharacterState.DIE) return;
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

  const currentPosition = new THREE.Vector3();
  const currentRotation = new THREE.Quaternion();

  // Main update loop
  useFrame(() => {
    if (!controllerRigidBody || !controllerChildrenGroup) return;
    if (latestState.current === CharacterState.DIE) return;

    // 1. Process inputs
    const inputs = getKeyboardInputs();
    const { forward, backward, leftward, rightward, run, jump, action1, action2, action3, action4 } = inputs;

    // 2. Calculate movement state
    const isMoving = forward || backward || leftward || rightward;
    const currentVel = controllerRigidBody.linvel() || { y: 0 };

    // 3. Determine player state
    const playerInputs: PlayerInputs = {
      isRevive: action4,
      isDying: action3,
      isPunching: action1,
      isHit: action2,
      isJumping: jump,
      isMoving,
      isRunning: run,
      currentVelY: currentVel.y,
    };
    const newState = determinePlayerState(currentStateRef.current, playerInputs);
    currentStateRef.current = newState;

    // 4. Get current transform information
    controllerChildrenGroup.getWorldPosition(currentPosition);
    controllerChildrenGroup.getWorldQuaternion(currentRotation);

    // 5. Network synchronization
    syncToNetwork(currentPosition, currentRotation, newState);
  });

  // Memoized character resource loading.
  const characterResource: CharacterResource = useMemo(() => {
    const characterData = (Assets.characters as Record<string, { url: string }>)[characterKey];
    const characterUrl = characterData?.url || Assets.characters['y-bot.glb'].url;
    return {
      name: characterKey,
      url: characterUrl,
      animations: {
        IDLE: Assets.animations.idle.url,
        WALK: Assets.animations.walk.url,
        RUN: Assets.animations.run.url,
        JUMP: Assets.animations.jump.url,
        PUNCH: Assets.animations.punch.url,
        HIT: Assets.animations.hit.url,
        DIE: Assets.animations.die.url,
      },
    };
  }, [characterKey]);

  if (!server || !account) return null;

  return (
    <CharacterRenderer
      ref={characterRendererRef}
      /**
       * IMPORTANT: In First Person View (FPS), the player's own character should not be visible,
       * so the visible property is set to false. This setting is crucial for the FPS implementation.
       */
      visible={false}
      characterResource={characterResource}
      animationConfigMap={animationConfigMap}
      currentActionRef={currentStateRef}
      targetHeight={targetHeight}
    />
  );
});

export default Player;
