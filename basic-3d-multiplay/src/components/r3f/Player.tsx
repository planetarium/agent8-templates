import React, { useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CharacterState } from "../../constants/character";
import {
  AnimationConfig,
  AnimationConfigMap,
  CharacterRenderer,
  CharacterResource,
  ControllerHandle,
} from "vibe-starter-3d";
import Assets from "../../assets.json";
import { GameServer } from "@agent8/gameserver";
import { Vector3, Quaternion } from "three";
import throttle from "lodash/throttle";
import { PlayerInputs } from "../../types";

/**
 * Network sync constants
 */
const NETWORK_CONSTANTS = {
  SYNC: {
    /** Transmission interval (milliseconds) */
    INTERVAL_MS: 100,
    /** Position change threshold (meters) */
    POSITION_CHANGE_THRESHOLD: 0.05,
    /** Rotation change threshold (radians) */
    ROTATION_CHANGE_THRESHOLD: 0.05,
  },
};

/**
 * Player component props
 */
interface PlayerProps {
  /** Initial position of the player */
  position?: THREE.Vector3 | [number, number, number];
  /** Initial action for the character */
  initState?: CharacterState;
  /** Reference to player controller for physics calculations */
  controllerRef?: React.RefObject<ControllerHandle>;
  /** Character key to use */
  characterKey?: string;
  /** Game server instance */
  server?: GameServer;
}

/**
 * Hook for player state determination logic
 */
function usePlayerStates() {
  // Function to determine player state based on inputs and current state
  const determinePlayerState = React.useCallback(
    (
      currentState: CharacterState,
      {
        isRevive,
        isDying,
        isPunching,
        isHit,
        isJumping,
        isMoving,
        isRunning,
      }: PlayerInputs
    ): CharacterState => {
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
    []
  );

  return { determinePlayerState };
}

/**
 * Hook for handling player animations
 */
function usePlayerAnimations(
  currentStateRef: React.MutableRefObject<CharacterState>
) {
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
    [currentStateRef]
  );

  // Animation configuration
  const animationConfigMap: Partial<AnimationConfigMap<CharacterState>> =
    useMemo(
      () => ({
        [CharacterState.IDLE]: {
          animationType: "IDLE",
          loop: true,
        } as AnimationConfig,
        [CharacterState.WALK]: {
          animationType: "WALK",
          loop: true,
        } as AnimationConfig,
        [CharacterState.RUN]: {
          animationType: "RUN",
          loop: true,
        } as AnimationConfig,
        [CharacterState.JUMP]: {
          animationType: "JUMP",
          loop: false,
          clampWhenFinished: true,
          onComplete: () => handleAnimationComplete(CharacterState.JUMP),
        } as AnimationConfig,
        [CharacterState.PUNCH]: {
          animationType: "PUNCH",
          loop: false,
          clampWhenFinished: true,
          onComplete: () => handleAnimationComplete(CharacterState.PUNCH),
        } as AnimationConfig,
        [CharacterState.HIT]: {
          animationType: "HIT",
          loop: false,
          clampWhenFinished: true,
          onComplete: () => handleAnimationComplete(CharacterState.HIT),
        } as AnimationConfig,
        [CharacterState.DIE]: {
          animationType: "DIE",
          loop: false,
          duration: 10,
          clampWhenFinished: true,
        } as AnimationConfig,
      }),
      [handleAnimationComplete]
    );

  return { animationConfigMap };
}

/**
 * Player component that manages character model and animations
 *
 * Handles player state management and delegates rendering to CharacterRenderer.
 * This component is specifically for the local player.
 */
export const Player: React.FC<PlayerProps> = ({
  initState: initAction = CharacterState.IDLE,
  controllerRef,
  characterKey = "avatarsample_d_darkness.vrm",
  server,
}) => {
  const currentStateRef = useRef<CharacterState>(initAction);
  const [, get] = useKeyboardControls();
  const { determinePlayerState } = usePlayerStates();
  const { animationConfigMap } = usePlayerAnimations(currentStateRef);

  // Store previous state to check change amount for dirty checking
  const prevState = useRef({
    position: new Vector3(),
    rotation: new Quaternion(),
    state: initAction,
  });

  /**
   * IMPORTANT:Should be memoized
   */
  const throttledSyncToNetwork = useMemo(
    () =>
      throttle(
        async (
          position: Vector3,
          rotation: Quaternion,
          state: CharacterState
        ) => {
          if (!server) return;
          try {
            await server.remoteFunction(
              "updatePlayerTransform",
              [
                {
                  position: [position.x, position.y, position.z],
                  rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
                },
                state,
              ],
              {
                needResponse: false,
                throttle: 50,
              }
            );
          } catch (error) {
            console.error(`[Player] Network sync failed:`, error);
          }
        },
        NETWORK_CONSTANTS.SYNC.INTERVAL_MS,
        { trailing: true }
      ),
    [server]
  );

  /**
   * IMPORTANT: Should be useCallback
   */
  const syncToNetwork = useCallback(
    (position: Vector3, rotation: Quaternion, state: CharacterState) => {
      if (!server) return;

      // 1) Check change amount (skip if almost identical to previous)
      const positionDiff = position.distanceTo(prevState.current.position);
      const rotationDiff = rotation.angleTo(prevState.current.rotation);
      const stateDiff = state !== prevState.current.state;

      // Skip if change is too minimal and state is the same
      if (
        !stateDiff &&
        positionDiff < NETWORK_CONSTANTS.SYNC.POSITION_CHANGE_THRESHOLD &&
        rotationDiff < NETWORK_CONSTANTS.SYNC.ROTATION_CHANGE_THRESHOLD
      )
        return;

      // If there are changes, call throttledSyncToNetwork
      throttledSyncToNetwork(position, rotation, state);

      // Update previous state
      prevState.current = {
        position: position.clone(),
        rotation: rotation.clone(),
        state,
      };
    },
    [server]
  );

  // Update player action state based on inputs and physics and sync to server
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
    const newState = determinePlayerState(currentStateRef.current, {
      isRevive,
      isDying,
      isPunching,
      isHit,
      isJumping,
      isMoving,
      isRunning,
      currentVelY: currentVel.y,
    });

    // 상태 업데이트
    currentStateRef.current = newState;

    // 현재 위치와 회전 가져오기
    const position = new Vector3();
    const rotation = new Quaternion();

    if (rigidBodyRef.current) {
      const translation = rigidBodyRef.current.translation();
      position.set(translation.x, translation.y, translation.z);

      const quatRotation = rigidBodyRef.current.rotation();
      rotation.set(
        quatRotation.x,
        quatRotation.y,
        quatRotation.z,
        quatRotation.w
      );
    }

    // 변화량 체크 및 네트워크 동기화
    syncToNetwork(position, rotation, newState);
  });

  // Define the character resource with all animations based on characterKey prop
  // !!IMPORTANT: This is a rerender operation, so it should be memoized
  const characterResource: CharacterResource = useMemo(() => {
    // Characters are directly keyed by filename in assets.json
    const characterData = (
      Assets.characters as Record<string, { url: string }>
    )[characterKey];
    const characterUrl =
      characterData?.url ||
      Assets.characters["avatarsample_d_darkness.vrm"].url;

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

  return (
    <CharacterRenderer
      characterResource={characterResource}
      animationConfigMap={animationConfigMap}
      currentActionRef={currentStateRef}
    />
  );
};
