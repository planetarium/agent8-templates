import React, { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import { AnimationConfig, AnimationConfigMap, CharacterRenderer, CharacterResource, ControllerHandle } from 'vibe-starter-3d';
import Assets from '../../assets.json';
import { CharacterRendererRef } from 'vibe-starter-3d/dist/src/components/renderers/CharacterRenderer';

/**
 * Player input parameters for action determination
 */
interface PlayerInputs {
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
export interface PlayerRef {
  /** Bounding box of the character model */
  boundingBox: THREE.Box3 | null;
}

/**
 * Player props
 */
interface PlayerProps {
  /** Initial position of the player */
  position?: THREE.Vector3 | [number, number, number];
  /** Initial action for the character */
  initState?: CharacterState;
  /** Reference to player controller for physics calculations */
  controllerRef?: React.RefObject<ControllerHandle>;
  /** Target height for the character model */
  targetHeight?: number;
}

/**
 * Hook for player state determination logic
 */
function usePlayerStates() {
  // Function to determine player state based on inputs and current state
  const determinePlayerState = React.useCallback(
    (currentState: CharacterState, { isRevive, isDying, isPunching, isHit, isJumping, isMoving, isRunning }: PlayerInputs): CharacterState => {
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
 * Hook for handling player animations
 */
function usePlayerAnimations(currentStateRef: React.MutableRefObject<CharacterState>) {
  const handleAnimationComplete = React.useCallback(
    (state: CharacterState) => {
      console.log(`Animation ${state} completed`);

      switch (state) {
        case CharacterState.JUMP:
          currentStateRef.current = CharacterState.IDLE;
          break;
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

  // Animation configuration
  const animationConfigMap: Partial<AnimationConfigMap<CharacterState>> = useMemo(
    () => ({
      [CharacterState.IDLE]: {
        animationType: 'IDLE',
        loop: true,
      } as AnimationConfig,
      [CharacterState.WALK]: {
        animationType: 'WALK',
        loop: true,
      } as AnimationConfig,
      [CharacterState.RUN]: {
        animationType: 'RUN',
        loop: true,
      } as AnimationConfig,
      [CharacterState.JUMP]: {
        animationType: 'JUMP',
        loop: false,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.JUMP),
      } as AnimationConfig,
      [CharacterState.PUNCH]: {
        animationType: 'PUNCH',
        loop: false,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.PUNCH),
      } as AnimationConfig,
      [CharacterState.HIT]: {
        animationType: 'HIT',
        loop: false,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.HIT),
      } as AnimationConfig,
      [CharacterState.DIE]: {
        animationType: 'DIE',
        loop: false,
        duration: 10,
        clampWhenFinished: true,
      } as AnimationConfig,
    }),
    [handleAnimationComplete],
  );

  return { animationConfigMap };
}

/**
 * Player component that manages character model and animations
 *
 * Handles player state management and delegates rendering to CharacterRenderer.
 */
export const Player = forwardRef<PlayerRef, PlayerProps>(({ initState: initAction = CharacterState.IDLE, controllerRef, targetHeight = 1.6 }, ref) => {
  const currentStateRef = useRef<CharacterState>(initAction);
  const [, get] = useKeyboardControls();
  const { determinePlayerState: determinePlayerState } = usePlayerStates();
  const { animationConfigMap } = usePlayerAnimations(currentStateRef);

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

  // Update player action state based on inputs and physics
  useFrame(() => {
    if (!controllerRef?.current?.rigidBodyRef?.current) return;

    const rigidBodyRef = controllerRef.current.rigidBodyRef;

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
    } = get();

    const currentVel = rigidBodyRef.current.linvel?.() || { y: 0 };

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

  // Define the character resource with all animations
  const characterResource: CharacterResource = useMemo(
    () => ({
      name: 'Default Character',
      url: Assets.characters.player.url,
      animations: {
        IDLE: Assets.animations.idle.url,
        WALK: Assets.animations.walk.url,
        RUN: Assets.animations.run.url,
        JUMP: Assets.animations.jump.url,
        PUNCH: Assets.animations.punch.url,
        HIT: Assets.animations.hit.url,
        DIE: Assets.animations.die.url,
      },
    }),
    [],
  );

  return (
    <CharacterRenderer
      ref={characterRendererRef}
      characterResource={characterResource}
      animationConfigMap={animationConfigMap}
      currentActionRef={currentStateRef}
      targetHeight={targetHeight}
    />
  );
});
