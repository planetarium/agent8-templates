import React, { useRef, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import Assets from '../../assets.json';
import { GameServer } from '@agent8/gameserver';
import { Vector3, Quaternion } from 'three';
import throttle from 'lodash/throttle';
import { PlayerInputs, PlayerRef } from '../../types/player';
import { EffectType } from '../../types';
import { createFireBallEffectConfig } from './effects/FireBallEffectController';
import { AnimationConfig, AnimationConfigMap, CharacterRenderer, CharacterRendererRef, CharacterResource, ControllerHandle } from 'vibe-starter-3d';

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
  /** Initial animation state for the character. */
  initialState?: CharacterState;
  /** Reference to the PlayerController handle for accessing physics state. */
  controllerRef?: React.RefObject<ControllerHandle>;
  /** Target height for the character model */
  targetHeight?: number;
  /** Callback to request spawn effect */
  spawnEffect?: (type: string, config?: { [key: string]: any }) => void;
  /** Key identifying the character model/resources to use. */
  characterKey?: string;
  /** GameServer instance for network communication. */
  server?: GameServer;
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
      [CharacterState.IDLE]: { animationType: 'IDLE', loop: true } as AnimationConfig,
      [CharacterState.WALK]: { animationType: 'WALK', loop: true } as AnimationConfig,
      [CharacterState.RUN]: { animationType: 'RUN', loop: true } as AnimationConfig,
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
      [CharacterState.DIE]: { animationType: 'DIE', loop: false, duration: 10, clampWhenFinished: true } as AnimationConfig,
    }),
    [handleAnimationComplete],
  );

  return { animationConfigMap };
}

/**
 * Player component - Represents the local player character.
 * Manages inputs, state transitions, animations, and network synchronization.
 */
export const Player = forwardRef<PlayerRef, PlayerProps>(
  (
    { initialState = CharacterState.IDLE, controllerRef, targetHeight = 1.6, spawnEffect: onCastMagic, characterKey = 'avatarsample_d_darkness.vrm', server },
    ref,
  ) => {
    const currentStateRef = useRef<CharacterState>(initialState);
    const [, getKeyboardInputs] = useKeyboardControls();
    const { determinePlayerState } = usePlayerStates();
    const { animationConfigMap } = usePlayerAnimations(currentStateRef);
    const characterRendererRef = useRef<CharacterRendererRef>(null);
    const magicTriggeredRef = useRef(false);
    // Ref to store the previously *sent* state for dirty checking
    const prevSentStateRef = useRef({
      position: new Vector3(),
      rotation: new Quaternion(),
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

    // Optimized network synchronization function
    const throttledSyncToNetwork = useMemo(
      () =>
        throttle(
          async (position: Vector3, rotation: Quaternion, state: CharacterState) => {
            if (!server) return;

            try {
              //console.log('syncToNetwork', position, rotation, state);
              server.remoteFunction(
                'updatePlayerTransform',
                [{ position: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z, rotation.w] }, state],
                { needResponse: false, throttle: 50 },
              );
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
      async (currentPosition: Vector3, currentRotation: Quaternion, currentState: CharacterState) => {
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

    // Magic casting logic extracted as a separate function
    const handleMagicCast = useCallback(() => {
      if (!controllerRef?.current?.rigidBodyRef?.current) return;

      console.log('Magic key pressed - Requesting cast!');

      // Call callback provided by parent component
      if (onCastMagic) {
        // Calculate magic direction (direction character is facing)
        const rigidBody = controllerRef.current.rigidBodyRef.current;
        const position = rigidBody.translation();
        const startPosition = new THREE.Vector3(position.x, position.y, position.z);
        const rotation = rigidBody.rotation();
        const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize();
        onCastMagic(EffectType.FIREBALL, createFireBallEffectConfig(startPosition, direction));
      } else {
        console.warn('Player tried to cast magic, but onCastMagic prop is missing!');
      }
    }, [controllerRef, onCastMagic]);

    // Main update loop
    useFrame(() => {
      const rigidBody = controllerRef?.current?.rigidBodyRef?.current;
      if (!rigidBody) return;

      // 1. Process inputs
      const inputs = getKeyboardInputs();
      const { forward, backward, leftward, rightward, run, jump, action1, action2, action3, action4, magic } = inputs;

      // 2. Handle magic trigger
      const triggerMagic = magic && !magicTriggeredRef.current;
      if (triggerMagic) {
        handleMagicCast();
      }
      magicTriggeredRef.current = magic;

      // 3. Calculate movement state
      const isMoving = forward || backward || leftward || rightward;
      const currentVel = rigidBody.linvel() || { y: 0 };

      // 4. Determine player state
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

      // 5. Get current transform information
      const translation = rigidBody.translation();
      const quatRotation = rigidBody.rotation();

      const offsetY = controllerRef.current.offsetY;
      // Reuse cached Vector3 and Quaternion objects to reduce garbage collection overhead
      const currentPosition = new Vector3(translation.x, translation.y - offsetY, translation.z);
      const currentRotation = new Quaternion(quatRotation.x, quatRotation.y, quatRotation.z, quatRotation.w);

      // 6. Network synchronization
      syncToNetwork(currentPosition, currentRotation, newState);
    });

    // Memoized character resource loading.
    const characterResource: CharacterResource = useMemo(() => {
      const characterData = (Assets.characters as Record<string, { url: string }>)[characterKey];
      const characterUrl = characterData?.url || Assets.characters['avatarsample_d_darkness.vrm'].url;
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

    // Render the character model and animations
    return (
      <CharacterRenderer
        ref={characterRendererRef}
        characterResource={characterResource}
        animationConfigMap={animationConfigMap}
        currentActionRef={currentStateRef}
        targetHeight={targetHeight}
      />
    );
  },
);
