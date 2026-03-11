import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, Vector3 } from '@react-three/fiber';
import { CollisionPayload } from '@react-three/rapier';
import { useGameServer } from '@agent8/gameserver';

import { useLocalPlayerStore } from '../../stores/localPlayerStore';
import { useMultiPlayerStore } from '../../stores/multiPlayerStore';

import { CharacterState } from '../../constants/character';
import { RigidBodyObjectType } from '../../constants/rigidBodyObjectType';

import Assets from '../../assets.json';
import {
  AnimationConfigMap,
  AnimationType,
  CharacterMovementState,
  CharacterRenderer,
  RigidBodyPlayer,
  RigidBodyPlayerRef,
  useCharacterAnimation,
  useControllerStore,
} from 'vibe-starter-3d';
import { usePlayerActionStore } from '../../stores/playerActionStore';
import { useMiningStore } from '../../stores/miningStore';

const targetHeight = 1.6;

// States that can be interrupted by actions
const INTERRUPTIBLE_STATES = [
  CharacterState.IDLE,
  CharacterState.IDLE_01,
  CharacterState.WALK,
  CharacterState.RUN,
  CharacterState.FAST_RUN,
  CharacterState.JUMP,
] as const;

// Optimised: Only include animations actually used – reduces preload count & memory
const animationConfigMap: AnimationConfigMap = {
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
  [CharacterState.KICK]: {
    url: Assets.animations['kick-00'].url,
    loop: false,
    duration: 0.75,
    clampWhenFinished: true,
  },
  [CharacterState.MELEE_ATTACK]: {
    url: Assets.animations['melee-attack'].url,
    loop: true,
    duration: 0.6,
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
  [CharacterState.DIE]: {
    url: Assets.animations['death-backward'].url,
    loop: false,
    clampWhenFinished: true,
  },
};

interface PlayerProps {
  position?: Vector3;
}

const Player = ({ position }: PlayerProps) => {
  const { account } = useGameServer();
  const { registerConnectedPlayer, unregisterConnectedPlayer } = useMultiPlayerStore();
  const { setPosition: setLocalPlayerPosition } = useLocalPlayerStore();
  const { getPlayerAction } = usePlayerActionStore();

  const isMining = useMiningStore((s) => s.miningTargetId !== null);

  const { animationState, setAnimation, getAnimation } = useCharacterAnimation<CharacterState>(CharacterState.IDLE);
  const { getCharacterMovementState, isControlLocked, lockControls, unlockControls } = useControllerStore();

  const rigidBodyPlayerRef = useRef<RigidBodyPlayerRef>(null);
  const lastPositionRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (!account) return;
    registerConnectedPlayer(account, rigidBodyPlayerRef);
    return () => { unregisterConnectedPlayer(account); };
  }, [account, registerConnectedPlayer, unregisterConnectedPlayer]);

  // Optimised: only update store when position moves significantly (threshold 0.01 sq)
  useFrame(() => {
    const rb = rigidBodyPlayerRef.current;
    if (!rb) return;

    const pos = rb.translation();
    const last = lastPositionRef.current;
    const dx = pos.x - last.x;
    const dy = pos.y - last.y;
    const dz = pos.z - last.z;

    if (dx * dx + dy * dy + dz * dz > 0.01) {
      lastPositionRef.current = { x: pos.x, y: pos.y, z: pos.z };
      setLocalPlayerPosition(pos.x, pos.y, pos.z);
    }
  });

  const canInterrupt = useCallback((state: CharacterState): boolean => {
    return INTERRUPTIBLE_STATES.includes(state);
  }, []);

  const toCharacterState = useCallback((ms: CharacterMovementState): CharacterState => {
    switch (ms) {
      case CharacterMovementState.IDLE: return CharacterState.IDLE;
      case CharacterMovementState.WALKING: return CharacterState.WALK;
      case CharacterMovementState.RUN: return CharacterState.RUN;
      case CharacterMovementState.FAST_RUN: return CharacterState.FAST_RUN;
      case CharacterMovementState.AIRBORNE: return CharacterState.JUMP;
      default: return CharacterState.IDLE;
    }
  }, []);

  const handleAnimationComplete = useCallback(
    (type: AnimationType) => {
      unlockControls();
      switch (type) {
        case CharacterState.PUNCH:
        case CharacterState.KICK:
        case CharacterState.CAST:
        case CharacterState.HIT:
          setAnimation(CharacterState.IDLE_01);
          break;
        default:
          break;
      }
    },
    [unlockControls, setAnimation],
  );

  const updatePlayerState = useCallback((): void => {
    const currentState = getAnimation();
    if (isControlLocked()) return;

    if (isMining) {
      if (currentState !== CharacterState.MELEE_ATTACK) {
        setAnimation(CharacterState.MELEE_ATTACK);
      }
      return;
    }

    if (getPlayerAction('punch') && canInterrupt(currentState)) {
      setAnimation(CharacterState.PUNCH);
      lockControls();
      return;
    }
    if (getPlayerAction('kick') && canInterrupt(currentState)) {
      setAnimation(CharacterState.KICK);
      lockControls();
      return;
    }
    if (getPlayerAction('meleeAttack') && canInterrupt(currentState)) {
      setAnimation(CharacterState.MELEE_ATTACK);
      lockControls();
      return;
    }
    if (getPlayerAction('cast') && canInterrupt(currentState)) {
      setAnimation(CharacterState.CAST);
      lockControls();
      return;
    }

    if (canInterrupt(currentState) || currentState === CharacterState.MELEE_ATTACK) {
      const ms = getCharacterMovementState();
      setAnimation(toCharacterState(ms));
    }
  }, [isControlLocked, canInterrupt, lockControls, getCharacterMovementState, toCharacterState, getAnimation, setAnimation, getPlayerAction, isMining]);

  useFrame(() => {
    if (!rigidBodyPlayerRef.current) return;
    updatePlayerState();
  });

  const handleTriggerEnter = useCallback((payload: CollisionPayload) => {
    if (payload.other.rigidBody?.userData?.['type']) {
      // future trigger logic
    }
  }, []);

  const handleTriggerExit = useCallback((payload: CollisionPayload) => {
    if (payload.other.rigidBody?.userData?.['type']) {
      // future trigger logic
    }
  }, []);

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
        url={Assets.characters['base-model'].url}
        animationConfigMap={animationConfigMap}
        animationState={animationState}
        targetHeight={targetHeight}
        onAnimationComplete={handleAnimationComplete}
      />
    </RigidBodyPlayer>
  );
};

export default Player;
