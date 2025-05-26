import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AnimationConfigMap, AnimationType, CharacterRenderer, RigidBodyPlayer, RigidBodyPlayerRef, useMouseControls } from 'vibe-starter-3d';
import * as THREE from 'three';
import { useGameServer } from '@agent8/gameserver';
import { useEffectStore } from '../../stores/effectStore';
import { useFrame, Vector3 } from '@react-three/fiber';
import { EffectType } from '../../types';
import { usePlayerStore } from '../../stores/playerStore';
import { createBulletEffectConfig } from '../../utils/effectUtils';
import Assets from '../../assets.json';
import { CharacterState } from '../../constants/character';
import { useKeyboardControls } from '@react-three/drei';
import { CollisionPayload } from '@react-three/rapier';
import { RigidBodyObjectType } from '../../constants/rigidBodyObjectType';

const SHOOT_COOLDOWN = 200;
const targetHeight = 1.6;

/**
 * Player props
 */
interface PlayerProps {
  /** Initial position of the player */
  position?: Vector3;
}

/**
 * Player input parameters for action determination
 */
interface PlayerInputs {
  /** Whether player is being revived */
  isRevive: boolean;
  /** Whether player is dying */
  isDying: boolean;
  /** Whether player is being hit */
  isHit: boolean;
  /** Whether player is jumping */
  isJumping: boolean;
  /** Whether player is moving */
  isMoving: boolean;
  /** Whether player is running */
  isRunning: boolean;
}

/**
 * Hook containing the logic to determine the player's animation state based on inputs.
 */
function usePlayerStates() {
  // Determines the next character state based on current state and inputs.
  const determinePlayerState = React.useCallback((currentState: CharacterState, inputs: PlayerInputs): CharacterState => {
    const { isRevive, isDying, isHit, isJumping, isMoving, isRunning } = inputs;

    // State transition priority:
    if (isRevive && currentState === CharacterState.DIE) return CharacterState.IDLE;
    if (isDying || currentState === CharacterState.DIE) return CharacterState.DIE;
    if (isHit) return CharacterState.HIT;
    if (isJumping && currentState !== CharacterState.PUNCH && currentState !== CharacterState.HIT) return CharacterState.JUMP;

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

const Player = ({ position }: PlayerProps) => {
  const { account } = useGameServer();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const getMouseInputs = useMouseControls();
  const [, getKeyboardInputs] = useKeyboardControls();
  const { determinePlayerState } = usePlayerStates();

  const rigidBodyPlayerRef = useRef<RigidBodyPlayerRef>(null);
  const currentStateRef = useRef<CharacterState>(CharacterState.IDLE);

  const shootTimestamp = useRef(0);
  const leftPressedLastFrame = useRef(false);

  // IMPORTANT: Register player reference
  useEffect(() => {
    if (!account) return;

    registerPlayerRef(account, rigidBodyPlayerRef);

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

  // Memoized map of animation configurations.
  const animationConfigMap: AnimationConfigMap = useMemo(
    () => ({
      [CharacterState.IDLE]: {
        url: Assets.animations.idle.url,
        loop: true,
      },
      [CharacterState.WALK]: {
        url: Assets.animations.walk.url,
        loop: true,
      },
      [CharacterState.RUN]: {
        url: Assets.animations.run.url,
        loop: true,
      },
      [CharacterState.JUMP]: {
        url: Assets.animations.jump.url,
        loop: false,
        clampWhenFinished: true,
      },
      [CharacterState.HIT]: {
        url: Assets.animations.hit.url,
        loop: false,
        clampWhenFinished: true,
      },
      [CharacterState.DIE]: {
        url: Assets.animations.die.url,
        loop: false,
        duration: 3,
        clampWhenFinished: true,
      },
    }),
    [],
  );

  // Callback triggered when a non-looping animation finishes.
  const handleAnimationComplete = React.useCallback(
    (type: AnimationType) => {
      // Transition back to IDLE only if the state hasn't changed
      if (currentStateRef.current === type) {
        switch (type) {
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

  // useFrame hook for handling shooting logic AND ground checking
  useFrame(({ camera }) => {
    if (!rigidBodyPlayerRef.current) return;

    // Shooting Logic
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

  // Main update loop for player state
  useFrame(() => {
    if (!rigidBodyPlayerRef.current) return;

    // 1. Process inputs
    const inputs = getKeyboardInputs();
    const { forward, backward, leftward, rightward, run, jump } = inputs;

    // 2. Calculate movement state
    const isMoving = forward || backward || leftward || rightward;

    // 3. Determine player state
    const playerInputs: PlayerInputs = {
      isRevive: false,
      isDying: false,
      isHit: false,
      isJumping: jump,
      isMoving,
      isRunning: run,
    };
    const newState = determinePlayerState(currentStateRef.current, playerInputs);
    currentStateRef.current = newState;
  });

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
      position={position}
      targetHeight={targetHeight}
      onTriggerEnter={handleTriggerEnter}
      onTriggerExit={handleTriggerExit}
    >
      <CharacterRenderer
        /**
         * IMPORTANT: In First Person View (FPS), the player's own character should not be visible,
         * so the visible property is set to false. This setting is crucial for the FPS implementation.
         */
        visible={false}
        url={Assets.characters['base-model'].url}
        animationConfigMap={animationConfigMap}
        currentAnimationRef={currentStateRef}
        targetHeight={targetHeight}
        onAnimationComplete={handleAnimationComplete}
      />
    </RigidBodyPlayer>
  );
};

export default Player;
