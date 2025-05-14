import { useRef, useMemo, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame, Vector3 } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import { AnimationConfigMap, CharacterRenderer, CharacterRendererRef, useMouseControls, useControllerState, AnimationType } from 'vibe-starter-3d';

import Assets from '../../assets.json';
import { RapierRigidBody } from '@react-three/rapier';
import { useGameServer } from '@agent8/gameserver';
import usePlayerStore from '../../stores/playerStore';

/**
 * Player input parameters for action determination
 */
interface PlayerInputs {
  isRevive: boolean;
  isDying: boolean;
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
 * Player component that manages character model and animations
 *
 * Handles player state management and delegates rendering to CharacterRenderer.
 */
const Player = forwardRef<PlayerRef, PlayerProps>(({ initState = CharacterState.IDLE, targetHeight = 1.6 }, ref) => {
  const { account } = useGameServer();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const currentStateRef = useRef<CharacterState>(initState);
  const [, getKeyboardInputs] = useKeyboardControls();
  const getMouseInputs = useMouseControls();
  const { setEnableInput } = useControllerState();

  const { rigidBody } = useControllerState();
  const playerRef = useRef<RapierRigidBody>(null);
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

  const animationConfigMap: AnimationConfigMap = useMemo(
    () => ({
      [CharacterState.IDLE]: {
        url: Assets.animations['idle-00'].url,
        loop: true,
      },
      [CharacterState.IDLE_01]: {
        url: Assets.animations['idle-01'].url,
        loop: true,
      },
      [CharacterState.WALK]: {
        url: Assets.animations['walk'].url,
        loop: true,
      },
      [CharacterState.RUN]: {
        url: Assets.animations['run-medium'].url,
        loop: true,
      },
      [CharacterState.FAST_RUN]: {
        url: Assets.animations['run-fast'].url,
        loop: true,
      },
      [CharacterState.JUMP]: {
        url: Assets.animations['jump'].url,
        loop: true,
        clampWhenFinished: true,
      },
      [CharacterState.PUNCH]: {
        url: Assets.animations['punch-00'].url,
        loop: false,
        duration: 0.5,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.PUNCH),
      },
      [CharacterState.PUNCH_01]: {
        url: Assets.animations['punch-01'].url,
        loop: false,
        duration: 0.5,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.PUNCH_01),
      },
      [CharacterState.KICK]: {
        url: Assets.animations['kick-00'].url,
        loop: false,
        duration: 0.75,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.KICK),
      },
      [CharacterState.KICK_01]: {
        url: Assets.animations['kick-01'].url,
        loop: false,
        duration: 1,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.KICK_01),
      },
      [CharacterState.KICK_02]: {
        url: Assets.animations['kick-02'].url,
        loop: false,
        duration: 1,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.KICK_02),
      },
      [CharacterState.MELEE_ATTACK]: {
        url: Assets.animations['melee-attack'].url,
        loop: false,
        duration: 1,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.MELEE_ATTACK),
      },
      [CharacterState.CAST]: {
        url: Assets.animations['cast'].url,
        loop: false,
        duration: 1,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.CAST),
      },
      [CharacterState.HIT]: {
        url: Assets.animations['hit-to-body'].url,
        loop: false,
        clampWhenFinished: false,
        onComplete: () => handleAnimationComplete(CharacterState.HIT),
      },
      [CharacterState.DANCE]: {
        url: Assets.animations['dance'].url,
        loop: false,
        clampWhenFinished: false,
        onComplete: () => handleAnimationComplete(CharacterState.DANCE),
      },
      [CharacterState.SWIM]: {
        url: Assets.animations['swim'].url,
        loop: true,
      },
      [CharacterState.DIE]: {
        url: Assets.animations['death-backward'].url,
        loop: false,
        clampWhenFinished: true,
      },
    }),
    [],
  );

  const handleAnimationComplete = useCallback(
    (type: AnimationType) => {
      setEnableInput(true);
      switch (type) {
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

  const determinePlayerState = useCallback(
    (
      currentState: CharacterState,
      { isRevive, isDying, isPunching, isKicking, isMeleeAttack, isCasting, isJumping, isMoving, isSprinting }: PlayerInputs,
    ): CharacterState => {
      if (isRevive && currentState === CharacterState.DIE) {
        return CharacterState.IDLE;
      }
      // Maintain death state
      if (isDying || currentState === CharacterState.DIE) {
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
      isRevive: false,
      isDying: false,
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
