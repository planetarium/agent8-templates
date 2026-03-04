import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CollisionPayload } from '@react-three/rapier';
import { useGameServer } from '@agent8/gameserver';

import { useLocalPlayerStore } from '../../stores/localPlayerStore';
import { useMultiPlayerStore } from '../../stores/multiPlayerStore';
import { useGameStore } from '../../stores/gameStore';
import { CharacterState } from '../../constants/character';
import { enemyPositionRegistry } from '../../utils/enemyPositionRegistry';
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

const targetHeight = 1.6;
const ATTACK_RANGE = 2.5;
const ATTACK_DAMAGE = 1;
const INVINCIBILITY_MS = 1500;
const ATTACK_COOLDOWN_S = 0.8;

// States that movement can interrupt
const INTERRUPTIBLE_STATES = [
  CharacterState.IDLE,
  CharacterState.IDLE_01,
  CharacterState.WALK,
  CharacterState.RUN,
  CharacterState.FAST_RUN,
] as const;

const animationConfigMap: AnimationConfigMap = {
  [CharacterState.IDLE]: { url: Assets.animations['idle-00'].url, loop: true },
  [CharacterState.IDLE_01]: { url: Assets.animations['idle-01'].url, loop: true },
  [CharacterState.WALK]: { url: Assets.animations['walk'].url, loop: true },
  [CharacterState.RUN]: { url: Assets.animations['run-medium'].url, loop: true },
  [CharacterState.FAST_RUN]: { url: Assets.animations['run-fast'].url, loop: true },
  [CharacterState.MELEE_ATTACK]: {
    url: Assets.animations['melee-attack'].url,
    loop: false,
    duration: 0.7,
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

const Player = () => {
  const { account } = useGameServer();
  const { registerConnectedPlayer, unregisterConnectedPlayer } = useMultiPlayerStore();
  const { setPosition: setLocalPlayerPosition } = useLocalPlayerStore();
  const { getPlayerAction } = usePlayerActionStore();
  const { damagePlayer, killEnemy, damageEnemy, collectGem, collectLife, gamePhase, enemies } = useGameStore();

  const { animationState, setAnimation, getAnimation } = useCharacterAnimation<CharacterState>(CharacterState.IDLE);
  const { getCharacterMovementState, isControlLocked, lockControls, unlockControls } = useControllerStore();

  const rigidBodyPlayerRef = useRef<RigidBodyPlayerRef>(null);
  const lastPositionRef = useRef({ x: 0, y: 0, z: 0 });
  const invincibleRef = useRef(false);
  const prevAttackRef = useRef(false);
  const attackCooldownRef = useRef(0);

  useEffect(() => {
    if (!account) return;
    registerConnectedPlayer(account, rigidBodyPlayerRef);
    return () => { unregisterConnectedPlayer(account); };
  }, [account, registerConnectedPlayer, unregisterConnectedPlayer]);

  // Sync player position to localPlayerStore
  useFrame(() => {
    const rb = rigidBodyPlayerRef.current;
    if (!rb) return;
    const position = rb.translation();
    const last = lastPositionRef.current;
    const dx = position.x - last.x;
    const dy = position.y - last.y;
    const dz = position.z - last.z;
    if (dx * dx + dy * dy + dz * dz > 0.0001) {
      lastPositionRef.current = { x: position.x, y: position.y, z: position.z };
      setLocalPlayerPosition(position.x, position.y, position.z);
    }
  });

  const canInterrupt = useCallback(
    (state: CharacterState): boolean => (INTERRUPTIBLE_STATES as readonly string[]).includes(state),
    [],
  );

  const toCharacterState = useCallback((mov: CharacterMovementState): CharacterState => {
    switch (mov) {
      case CharacterMovementState.IDLE: return CharacterState.IDLE;
      case CharacterMovementState.WALKING: return CharacterState.WALK;
      case CharacterMovementState.RUN: return CharacterState.RUN;
      case CharacterMovementState.FAST_RUN: return CharacterState.FAST_RUN;
      default: return CharacterState.IDLE;
    }
  }, []);

  const handleAnimationComplete = useCallback(
    (type: AnimationType) => {
      unlockControls();
      if (type === CharacterState.MELEE_ATTACK || type === CharacterState.HIT) {
        setAnimation(CharacterState.IDLE_01);
      }
    },
    [unlockControls, setAnimation],
  );

  // Main per-frame logic
  useFrame((_, delta) => {
    if (!rigidBodyPlayerRef.current) return;
    if (gamePhase !== 'playing') return;

    const currentState = getAnimation();
    const isDying = currentState === CharacterState.DIE;
    if (isDying) return;

    // Attack cooldown
    if (attackCooldownRef.current > 0) {
      attackCooldownRef.current -= delta;
    }

    // Detect leading edge of meleeAttack
    const currentAttack = getPlayerAction('meleeAttack');
    const justAttacked = currentAttack && !prevAttackRef.current;
    prevAttackRef.current = currentAttack;

    if (justAttacked && attackCooldownRef.current <= 0) {
      attackCooldownRef.current = ATTACK_COOLDOWN_S;
      setAnimation(CharacterState.MELEE_ATTACK);
      lockControls();

      // Melee hit detection using position registry
      const playerPos = rigidBodyPlayerRef.current.translation();
      const storeState = useGameStore.getState();
      storeState.enemies.forEach((enemy) => {
        const enemyPos = enemyPositionRegistry.get(enemy.id);
        if (!enemyPos) return;
        const dist = Math.sqrt(
          (playerPos.x - enemyPos.x) ** 2 + (playerPos.z - enemyPos.z) ** 2,
        );
        if (dist < ATTACK_RANGE) {
          const newHp = enemy.hp - ATTACK_DAMAGE;
          if (newHp <= 0) {
            killEnemy(enemy.id, [enemyPos.x, enemyPos.y, enemyPos.z]);
          } else {
            damageEnemy(enemy.id, ATTACK_DAMAGE);
          }
        }
      });
      return;
    }

    // Movement states
    if (!isControlLocked() && canInterrupt(currentState)) {
      const mov = getCharacterMovementState();
      setAnimation(toCharacterState(mov));
    }
  });

  const handleTriggerEnter = useCallback(
    (payload: CollisionPayload) => {
      const type = payload.other.rigidBody?.userData?.['type'];

      // Enemy damage
      if (type === 'ENEMY' && !invincibleRef.current && getAnimation() !== CharacterState.DIE) {
        damagePlayer();
        setAnimation(CharacterState.HIT);
        invincibleRef.current = true;
        setTimeout(() => { invincibleRef.current = false; }, INVINCIBILITY_MS);
      }

      // Gem collect
      if (type === 'ITEM') {
        const gemId = payload.other.rigidBody?.userData?.['gemId'];
        const isLife = payload.other.rigidBody?.userData?.['isLife'];
        if (gemId) {
          if (isLife) collectLife();
          else collectGem(gemId);
        }
      }
    },
    [damagePlayer, collectGem, collectLife, getAnimation, setAnimation],
  );

  const handleTriggerExit = useCallback((_payload: CollisionPayload) => {}, []);

  return (
    <RigidBodyPlayer
      ref={rigidBodyPlayerRef}
      userData={{ account, type: 'LOCAL_PLAYER' }}
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
