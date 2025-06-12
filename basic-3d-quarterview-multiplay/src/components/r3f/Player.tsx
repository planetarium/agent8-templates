import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import Assets from '../../assets.json';
import { useGameServer, useRoomState } from '@agent8/gameserver';
import throttle from 'lodash/throttle';
import {
  AnimationConfigMap,
  AnimationType,
  CharacterRenderer,
  RigidBodyPlayer,
  RigidBodyPlayerRef,
  toQuaternionArray,
  toVector3Array,
  useControllerState,
  useMouseControls,
} from 'vibe-starter-3d';
import { usePlayerStore } from '../../stores/playerStore';
import { RapierRigidBody } from '@react-three/rapier';
import { RigidBodyObjectType } from '../../constants/rigidBodyObjectType';

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
 * Player component - Represents the local player character.
 * Manages inputs, state transitions, animations, and network synchronization.
 */
const Player = ({ initialState = CharacterState.IDLE, targetHeight = 1.6, characterKey = 'y-bot.glb' }: PlayerProps) => {
  const { server, connected, account } = useGameServer();
  const { roomId } = useRoomState();
  const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();
  const getMouseInputs = useMouseControls();
  const [, getKeyboardInputs] = useKeyboardControls();

  const { setPosition, setRotation, setVelocity } = useControllerState();

  // IMPORTANT: rigidBodyPlayerRef.current type is RigidBody
  const rigidBodyPlayerRef = useRef<RigidBodyPlayerRef>(null);

  const playerRef = useRef<RapierRigidBody>(null);
  const [die, setDie] = useState(false);
  const latestState = useRef(CharacterState.IDLE);
  const shootTimestamp = useRef(0);
  const leftPressedLastFrame = useRef(false);

  const currentStateRef = useRef<CharacterState>(initialState);

  // Ref to store the previously *sent* state for dirty checking
  const prevSentStateRef = useRef({
    position: new THREE.Vector3(0, Number.MAX_VALUE, 0),
    rotation: new THREE.Quaternion(),
    state: initialState,
  });

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
      },
      [CharacterState.PUNCH_01]: {
        url: Assets.animations['punch-01'].url,
        loop: false,
        duration: 0.5,
        clampWhenFinished: true,
      },
      [CharacterState.KICK]: {
        url: Assets.animations['kick-00'].url,
        loop: false,
        duration: 0.75,
        clampWhenFinished: true,
      },
      [CharacterState.KICK_01]: {
        url: Assets.animations['kick-01'].url,
        loop: false,
        duration: 1,
        clampWhenFinished: true,
      },
      [CharacterState.KICK_02]: {
        url: Assets.animations['kick-02'].url,
        loop: false,
        duration: 1,
        clampWhenFinished: true,
      },
      [CharacterState.MELEE_ATTACK]: {
        url: Assets.animations['melee-attack'].url,
        loop: false,
        duration: 1,
        clampWhenFinished: true,
      },
      [CharacterState.CAST]: {
        url: Assets.animations['cast'].url,
        loop: false,
        duration: 1,
        clampWhenFinished: true,
      },
      [CharacterState.HIT]: {
        url: Assets.animations['hit-to-body'].url,
        loop: false,
        clampWhenFinished: false,
      },
      [CharacterState.DANCE]: {
        url: Assets.animations['dance'].url,
        loop: false,
        clampWhenFinished: false,
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

  const handleAnimationComplete = useCallback((type: AnimationType) => {
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
  }, []);

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
        return CharacterState.PUNCH;
      }

      // Kick animation - start only if not already punching
      if (
        isKicking &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        return CharacterState.KICK;
      }

      // Melee attack animation - start only if not already punching or kicking
      if (
        isMeleeAttack &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        return CharacterState.MELEE_ATTACK;
      }

      // Cast animation - start only if not already punching or kicking
      if (
        isCasting &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
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
      // Default - maintain current action
      return currentState;
    },
    [],
  );

  const reset = useCallback(() => {
    setPosition(new THREE.Vector3(0, 0, 0));
    setRotation(new THREE.Quaternion());
    setVelocity(new THREE.Vector3(0, 0, 0));
  }, [setPosition, setRotation, setVelocity]);

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

  const currentPosition = new THREE.Vector3();
  const currentRotation = new THREE.Quaternion();

  // Main update loop
  useFrame(() => {
    if (latestState.current === CharacterState.DIE) return;
    if (!rigidBodyPlayerRef.current) return;

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

    const currentVel = rigidBodyPlayerRef.current.linvel?.() || { y: 0 };

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

    if (!rigidBodyPlayerRef.current) return;

    // 4. Get current transform information
    currentPosition.copy(rigidBodyPlayerRef.current.translation());
    currentPosition.y -= targetHeight / 2;
    currentRotation.copy(rigidBodyPlayerRef.current.rotation());

    // 5. Network synchronization
    syncToNetwork(currentPosition, currentRotation, currentStateRef.current);
  });

  if (!server || !account) return null;

  const characterUrl = useMemo(() => {
    const characterData = (Assets.characters as Record<string, { url: string }>)[characterKey];
    return characterData?.url || Assets.characters['base-model'].url;
  }, [characterKey]);

  return (
    <RigidBodyPlayer ref={rigidBodyPlayerRef} userData={{ account, type: RigidBodyObjectType.LOCAL_PLAYER }} targetHeight={targetHeight}>
      <CharacterRenderer
        url={characterUrl}
        animationConfigMap={animationConfigMap}
        currentAnimationRef={currentStateRef}
        targetHeight={targetHeight}
        onAnimationComplete={handleAnimationComplete}
      />
    </RigidBodyPlayer>
  );
};

export default Player;
