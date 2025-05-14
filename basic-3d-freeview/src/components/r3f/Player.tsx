import React, { useRef, useMemo, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame, Vector3 } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import { AnimationConfigMap, AnimationType, CharacterRenderer, CharacterRendererRef, useControllerState } from 'vibe-starter-3d';
import { useGameServer } from '@agent8/gameserver';
import { usePlayerStore } from '../../stores/playerStore';
import { RapierRigidBody } from '@react-three/rapier';
import Assets from '../../assets.json';

interface PlayerState {
  isRevive: boolean;
  isDying: boolean;
  isPunching: boolean;
  isHit: boolean;
  isJumping: boolean;
  isMoving: boolean;
  isRunning: boolean;
  currentVelY: number;
}

/**
 * Player ref interface
 */
interface PlayerRef {
  /** Bounding box of the character model */
  boundingBox: THREE.Box3 | null;
}

/**
 * Player props
 */
interface PlayerProps {
  /** Initial position of the player */
  position?: Vector3;
  /** Initial action for the character */
  initState?: CharacterState;
  /** Target height for the character model */
  targetHeight?: number;
}

/**
 * Hook for player state determination logic
 */
function usePlayerStates() {
  // Function to determine player state based on inputs and current state
  const determinePlayerState = React.useCallback(
    (currentState: CharacterState, { isRevive, isDying, isPunching, isHit, isJumping, isMoving, isRunning }: PlayerState): CharacterState => {
      // Revival processing - transition from DIE to IDLE
      if (isRevive && currentState === CharacterState.DIE) {
        return CharacterState.IDLE;
      }

      // Maintain death state
      if (isDying || currentState === CharacterState.DIE) {
        return CharacterState.DIE;
      }

      // Punch animation - start only if not already punching
      if (isPunching && currentState !== CharacterState.PUNCH) {
        return CharacterState.PUNCH;
      }

      // Hit animation - immediately transition to HIT
      if (isHit) {
        return CharacterState.HIT;
      }

      // Jump animation (can't jump while punching)
      if (isJumping && currentState !== CharacterState.PUNCH) {
        return CharacterState.JUMP;
      }

      // Maintain punch animation until completion
      if (currentState === CharacterState.PUNCH) {
        return CharacterState.PUNCH;
      }

      // Idle state
      if (!isMoving) {
        return CharacterState.IDLE;
      }

      // Walk/Run animation
      if (isMoving) {
        return isRunning ? CharacterState.RUN : CharacterState.WALK;
      }

      // Default - maintain current action
      return currentState;
    },
    [],
  );

  return { determinePlayerState: determinePlayerState };
}

/**
 * Player component that manages character model and animations
 *
 * Handles player state management and delegates rendering to CharacterRenderer.
 */
const Player = forwardRef<PlayerRef, PlayerProps>(({ initState: initAction = CharacterState.IDLE, targetHeight = 1.6 }, ref) => {
  const { account } = useGameServer();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const currentStateRef = useRef<CharacterState>(initAction);
  const [, getKeyboardInputs] = useKeyboardControls();
  const { determinePlayerState: determinePlayerState } = usePlayerStates();
  const { rigidBody } = useControllerState();

  const playerRef = useRef<RapierRigidBody>(null);

  // CharacterRenderer ref
  const characterRendererRef = useRef<CharacterRendererRef>(null);

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
    playerRef.current = rigidBody;
  }, [rigidBody]);

  // IMPORTANT: Register player reference
  useEffect(() => {
    if (!account) return;

    registerPlayerRef(account, playerRef);

    return () => {
      unregisterPlayerRef(account);
    };
  }, [account, registerPlayerRef, unregisterPlayerRef]);

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
        loop: true,
      },
      [CharacterState.PUNCH]: {
        url: Assets.animations.punch.url,
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
        duration: 10,
        clampWhenFinished: true,
      },
    }),
    [],
  );

  // Callback triggered when a non-looping animation finishes.
  const handleAnimationComplete = useCallback(
    (type: AnimationType) => {
      switch (type) {
        case CharacterState.PUNCH:
          currentStateRef.current = CharacterState.IDLE;
          break;
        case CharacterState.HIT:
          currentStateRef.current = CharacterState.IDLE;
          break;
        default:
          break;
      }
    },
    [currentStateRef],
  );

  // Update player action state based on inputs and physics
  useFrame(() => {
    if (!rigidBody) return;

    const {
      forward,
      backward,
      leftward,
      rightward,
      run: isRunning,
      jump: isJumping,
      action1: isPunching,
      action2: isHit,
      action3: isDying,
      action4: isRevive,
    } = getKeyboardInputs();

    const currentVel = rigidBody.linvel?.() || { y: 0 };

    // Check if player is moving
    const isMoving = forward || backward || leftward || rightward;

    // Call action determination logic
    currentStateRef.current = determinePlayerState(currentStateRef.current, {
      isRevive,
      isDying,
      isPunching,
      isHit,
      isJumping,
      isMoving,
      isRunning,
      currentVelY: currentVel.y,
    });
  });

  return (
    <CharacterRenderer
      ref={characterRendererRef}
      url={Assets.characters['base-model'].url}
      animationConfigMap={animationConfigMap}
      currentAnimationRef={currentStateRef}
      targetHeight={targetHeight}
      onAnimationComplete={handleAnimationComplete}
    />
  );
});

export default Player;
