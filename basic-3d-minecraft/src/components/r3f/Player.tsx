import React, { useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame, Vector3 } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import { AnimationConfig, AnimationConfigMap, CharacterRenderer, CharacterResource, ControllerHandle } from 'vibe-starter-3d';
import { CharacterRendererRef } from 'vibe-starter-3d/dist/src/components/renderers/CharacterRenderer';
import Assets from '../../assets.json';
/**
 * Player input parameters for action determination
 */
interface PlayerInputs {
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
}

/**
 * Hook for player state determination logic
 */
function usePlayerStates() {
  // Function to determine player state based on inputs and current state
  const determinePlayerState = React.useCallback((currentState: CharacterState, { isJumping, isMoving, isRunning }: PlayerInputs): CharacterState => {
    // Jump animation
    if (isJumping) {
      return CharacterState.JUMP;
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
  }, []);

  return { determinePlayerState: determinePlayerState };
}

/**
 * Hook for handling player animations
 */
function usePlayerAnimations(currentStateRef: React.MutableRefObject<CharacterState>) {
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
    }),
    [],
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

    const { forward, backward, leftward, rightward, run: isRunning, jump: isJumping } = get();

    const currentVel = rigidBodyRef.current.linvel?.() || { y: 0 };

    // Check if player is moving
    const isMoving = forward || backward || leftward || rightward;

    // Call action determination logic
    currentStateRef.current = determinePlayerState(currentStateRef.current, {
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
      url: Assets.characters['sd-northern-soldier.glb'].url,
      animations: {
        IDLE: Assets.animations['idle'].url,
        WALK: Assets.animations['walk'].url,
        RUN: Assets.animations['run'].url,
        JUMP: Assets.animations['jump'].url,
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
