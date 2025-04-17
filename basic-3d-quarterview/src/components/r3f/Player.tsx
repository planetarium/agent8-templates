import React, { useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame, Vector3 } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import { AnimationConfig, AnimationConfigMap, CharacterRenderer, CharacterResource, ControllerHandle } from 'vibe-starter-3d';
import { CharacterRendererRef } from 'vibe-starter-3d/dist/src/components/renderers/CharacterRenderer';
import { useGame } from 'vibe-starter-3d-ctrl';
import Assets from '../../assets.json';

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
  position?: Vector3;
  /** Initial action for the character */
  initState?: CharacterState;
  /** Reference to player controller for physics calculations */
  controllerRef?: React.RefObject<ControllerHandle>;
  /** Target height for the character model */
  targetHeight?: number;
  /** Whether the player is currently attacking */
  isAttacking?: boolean;
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
      switch (state) {
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
        loop: true,
        clampWhenFinished: false,
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
export const Player = forwardRef<PlayerRef, PlayerProps>(({ initState = CharacterState.IDLE, controllerRef, targetHeight = 1.6, isAttacking = false }, ref) => {
  const currentStateRef = useRef<CharacterState>(initState);
  const [, getKeyboardInputs] = useKeyboardControls();
  const { determinePlayerState } = usePlayerStates();
  const { animationConfigMap } = usePlayerAnimations(currentStateRef);
  const characterRendererRef = useRef<CharacterRendererRef>(null);
  const isPointMoving = useGame((state) => state.isPointMoving);

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
    const rigidBody = controllerRef?.current?.rigidBodyRef?.current;
    if (!rigidBody) return;

    const inputs = getKeyboardInputs();
    const { up, down, left, right, run, jump, action1, action2, action3, action4, magic } = inputs;

    // 3. Calculate movement state
    const isMoving = up || down || left || right || isPointMoving;
    const isRunning = run || isPointMoving;
    const currentVel = rigidBody.linvel() || { y: 0 };

    // 타겟 공격 체크 (action1 버튼이나 isAttacking이 true일 때)
    const isPunching = action1 || isAttacking;

    // 4. Determine player state
    const playerInputs: PlayerInputs = {
      isRevive: action4,
      isDying: action3,
      isPunching: isPunching,
      isHit: action2,
      isJumping: jump,
      isMoving,
      isRunning,
      currentVelY: currentVel.y,
    };
    const newState = determinePlayerState(currentStateRef.current, playerInputs);
    currentStateRef.current = newState;
  });

  // Define the character resource with all animations
  const characterResource: CharacterResource = useMemo(
    () => ({
      name: 'Default Character',
      url: Assets.characters['y-bot.glb'].url,
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
