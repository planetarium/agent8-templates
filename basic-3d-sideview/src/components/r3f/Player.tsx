import React, { useRef, useMemo, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame, Vector3 } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import {
  AnimationConfig,
  AnimationConfigMap,
  CharacterRenderer,
  CharacterRendererRef,
  CharacterResource,
  ControllerHandle,
  useMouseControls,
  useControllerState,
} from 'vibe-starter-3d';

import Assets from '../../assets.json';

/**
 * Player input parameters for action determination
 */
interface PlayerInputs {
  isPunching: boolean;
  isKicking: boolean;
  isMeleeAttack: boolean;
  isCasting: boolean;
  isJumping: boolean;
  isMoving: boolean;
  isSprinting: boolean;
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
}

/**
 * Player component that manages character model and animations
 *
 * Handles player state management and delegates rendering to CharacterRenderer.
 */
export const Player = forwardRef<PlayerRef, PlayerProps>(({ initState = CharacterState.IDLE, controllerRef, targetHeight = 1.6 }, ref) => {
  const currentStateRef = useRef<CharacterState>(initState);
  const [, getKeyboardInputs] = useKeyboardControls();
  const getMouseInputs = useMouseControls();

  const characterRendererRef = useRef<CharacterRendererRef>(null);
  const { setEnableInput } = useControllerState();

  useImperativeHandle(
    ref,
    () => ({
      get boundingBox() {
        return characterRendererRef.current?.boundingBox || null;
      },
    }),
    [],
  );

  const handleAnimationComplete = useCallback(
    (state: CharacterState) => {
      setEnableInput(true);
      switch (state) {
        case CharacterState.PUNCH:
        case CharacterState.PUNCH_01:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.KICK:
        case CharacterState.KICK_01:
        case CharacterState.KICK_02:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.CAST:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.HIT:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.MELEE_ATTACK:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.DANCE:
          currentStateRef.current = CharacterState.IDLE;
          break;
        default:
          break;
      }
    },
    [setEnableInput],
  );

  const animationConfigMap: Partial<AnimationConfigMap<CharacterState>> = useMemo(
    () => ({
      [CharacterState.IDLE]: {
        animationType: 'IDLE',
        loop: true,
      } as AnimationConfig,
      [CharacterState.IDLE_01]: {
        animationType: 'IDLE_01',
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
      [CharacterState.FAST_RUN]: {
        animationType: 'FAST_RUN',
        loop: true,
      } as AnimationConfig,
      [CharacterState.JUMP]: {
        animationType: 'JUMP',
        loop: true,
        clampWhenFinished: true,
      } as AnimationConfig,
      [CharacterState.PUNCH]: {
        animationType: 'PUNCH',
        loop: false,
        duration: 0.5,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.PUNCH),
      } as AnimationConfig,
      [CharacterState.PUNCH_01]: {
        animationType: 'PUNCH_01',
        loop: false,
        duration: 0.5,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.PUNCH_01),
      } as AnimationConfig,
      [CharacterState.KICK]: {
        animationType: 'KICK',
        loop: false,
        duration: 0.75,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.KICK),
      } as AnimationConfig,
      [CharacterState.KICK_01]: {
        animationType: 'KICK_01',
        loop: false,
        duration: 1,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.KICK_01),
      } as AnimationConfig,
      [CharacterState.KICK_02]: {
        animationType: 'KICK_02',
        loop: false,
        duration: 1,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.KICK_02),
      } as AnimationConfig,
      [CharacterState.MELEE_ATTACK]: {
        animationType: 'MELEE_ATTACK',
        loop: false,
        duration: 1,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.MELEE_ATTACK),
      } as AnimationConfig,
      [CharacterState.CAST]: {
        animationType: 'CAST',
        loop: false,
        duration: 1,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.CAST),
      } as AnimationConfig,
      [CharacterState.HIT]: {
        animationType: 'HIT',
        loop: false,
        clampWhenFinished: false,
        onComplete: () => handleAnimationComplete(CharacterState.HIT),
      } as AnimationConfig,
      [CharacterState.DANCE]: {
        animationType: 'DANCE',
        loop: false,
        clampWhenFinished: false,
        onComplete: () => handleAnimationComplete(CharacterState.DANCE),
      } as AnimationConfig,
      [CharacterState.SWIM]: {
        animationType: 'SWIM',
        loop: true,
      } as AnimationConfig,
      [CharacterState.DIE]: {
        animationType: 'DIE',
        loop: false,
        clampWhenFinished: true,
      } as AnimationConfig,
    }),
    [handleAnimationComplete],
  );

  const determinePlayerState = useCallback(
    (currentState: CharacterState, { isPunching, isKicking, isMeleeAttack, isCasting, isJumping, isMoving, isSprinting }: PlayerInputs): CharacterState => {
      // Maintain death state
      if (currentState === CharacterState.DIE) {
        return CharacterState.DIE;
      }

      // Punch animation - start only if not already punching
      if (
        isPunching &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        setEnableInput(false);
        return CharacterState.PUNCH;
      }

      // Kick animation - start only if not already punching
      if (
        isKicking &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        setEnableInput(false);
        return CharacterState.KICK;
      }

      // Melee attack animation - start only if not already punching or kicking
      if (
        isMeleeAttack &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        setEnableInput(false);
        return CharacterState.MELEE_ATTACK;
      }

      // Cast animation - start only if not already punching or kicking
      if (
        isCasting &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        setEnableInput(false);
        return CharacterState.CAST;
      }

      // Jump animation (can't jump while punching)
      if (
        isJumping &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        return CharacterState.JUMP;
      }

      // Moving state
      if (
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        if (isMoving) {
          if (isSprinting) {
            return CharacterState.FAST_RUN;
          } else {
            return CharacterState.RUN;
          }
        } else {
          if (currentState != CharacterState.IDLE_01) {
            return CharacterState.IDLE;
          }
        }
      }
      console.log('currentState', currentState);
      // Default - maintain current action
      return currentState;
    },
    [setEnableInput],
  );

  // Update player action state based on inputs and physics
  useFrame(() => {
    const rigidBody = controllerRef?.current?.rigidBodyRef?.current;
    if (!rigidBody) return;

    // 1. Calculate mouse state
    const { left: mouseLeft, right: mouseRight } = getMouseInputs();

    // 2. Calculate keyboard state
    const { up, down, left, right, jump, sprint, q, e, r, f } = getKeyboardInputs();

    // 3. Calculate attack state
    const isPunching = !!mouseLeft || !!q;
    const isKicking = !!mouseRight || !!e;
    const isMeleeAttack = !!r;
    const isCasting = !!f;

    // 4. Calculate movement state
    const isMoving = up || down || left || right;
    const isJumping = jump;
    const isSprinting = sprint;

    const currentVel = rigidBody.linvel() || { y: 0 };

    // 5. Determine player state
    currentStateRef.current = determinePlayerState(currentStateRef.current, {
      isPunching,
      isKicking,
      isMeleeAttack,
      isCasting,
      isJumping,
      isMoving,
      isSprinting,
      currentVelY: currentVel.y,
    });
  });

  // Define the character resource with all animations
  const characterResource: CharacterResource = useMemo(
    () => ({
      name: 'Default Character',
      url: Assets.characters['knight'].url,
      animations: {
        // Idle animations
        IDLE: Assets.animations['idle-00'].url,
        IDLE_01: Assets.animations['idle-01'].url,
        RIFLE_IDLE: Assets.animations['rifle-idle'].url,
        PISTOL_IDLE: Assets.animations['pistol-idle'].url,

        // Movement animations
        WALK: Assets.animations['walk'].url,
        RUN: Assets.animations['run-medium'].url,
        FAST_RUN: Assets.animations['run-fast'].url,
        RIFLE_RUN: Assets.animations['rifle-run'].url,
        PISTOL_RUN: Assets.animations['pistol-run'].url,
        JUMP: Assets.animations['jump'].url,
        SWIM: Assets.animations['swim'].url,

        // Attack animations
        PUNCH: Assets.animations['punch-00'].url,
        PUNCH_01: Assets.animations['punch-01'].url,
        KICK: Assets.animations['kick-00'].url,
        KICK_01: Assets.animations['kick-01'].url,
        KICK_02: Assets.animations['kick-02'].url,
        MELEE_ATTACK: Assets.animations['melee-attack'].url,
        CAST: Assets.animations['cast'].url,

        // Other animations
        DANCE: Assets.animations['dance'].url,
        HIT: Assets.animations['hit-to-body'].url,
        DIE: Assets.animations['death-backward'].url,
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
