import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import {
  AnimationConfig,
  AnimationConfigMap,
  CharacterRenderer,
  CharacterRendererRef,
  CharacterResource,
  CharacterUtils,
  NetworkObject,
  NetworkObjectHandle,
} from 'vibe-starter-3d';
import Assets from '../../assets.json';
import { CapsuleCollider } from '@react-three/rapier';
import { Vector3, Quaternion } from '@react-three/fiber';
import { ActiveCollisionTypes } from '@dimforge/rapier3d-compat';

interface RemotePlayerProps {
  account: string;
  characterUrl: string;
  nickname?: string;
  position?: Vector3;
  rotation?: Quaternion;
  targetHeight?: number;
}

export interface RemotePlayerHandle {
  syncState: (state: string, position: Vector3, quaternionRotation?: Quaternion) => void;
}

// Hook for managing character animations based on state
const usePlayerAnimations = (currentStateRef: React.MutableRefObject<CharacterState>) => {
  const handleAnimationComplete = React.useCallback(
    (state: CharacterState) => {
      switch (state) {
        case CharacterState.JUMP:
        case CharacterState.PUNCH:
        case CharacterState.HIT:
          if (currentStateRef.current === state) {
            currentStateRef.current = CharacterState.IDLE;
          }
          break;
        default:
          break;
      }
    },
    [currentStateRef],
  );

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
};

// Remote player with interpolation/extrapolation movement
export const RemotePlayer = forwardRef<RemotePlayerHandle, RemotePlayerProps>(
  ({ account, characterUrl: characterKey, position = [0, 0, 0], rotation = [0, 0, 0, 1], targetHeight = 1.6, nickname }, ref) => {
    const networkObjectRef = useRef<NetworkObjectHandle>(null);
    const currentStateRef = useRef<CharacterState>(CharacterState.IDLE);
    const { animationConfigMap } = usePlayerAnimations(currentStateRef);

    useImperativeHandle(
      ref,
      () => ({
        syncState: (state: string, position: Vector3 = [0, 0, 0], quaternionRotation: Quaternion = [0, 0, 0, 1]) => {
          currentStateRef.current = (state as CharacterState) || CharacterState.IDLE;

          if (!networkObjectRef.current) return;

          networkObjectRef.current.syncTransform(position, quaternionRotation);
        },
      }),
      [],
    );

    useEffect(() => {
      if (!networkObjectRef.current || !networkObjectRef.current.rigidBodyRef.current) return;

      networkObjectRef.current.rigidBodyRef.current.userData = { account };
    }, [networkObjectRef.current]);

    // Character resource setup
    const characterResource: CharacterResource = useMemo(() => {
      const characterData = (Assets.characters as Record<string, { url: string }>)[characterKey];
      const characterUrl = characterData?.url;
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

    // Renderer setup
    const characterRendererRef = useRef<CharacterRendererRef>(null);
    const nicknameOffsetY = targetHeight + 0.5;

    const capsuleRadius = CharacterUtils.capsuleRadius(targetHeight); // capsule collider radius
    const capsuleHalfHeight = CharacterUtils.capsuleHalfHeight(targetHeight); // half height of capsule collider

    return (
      <NetworkObject ref={networkObjectRef} position={position} rotation={rotation}>
        <group position={[0, CharacterUtils.targetHeight(targetHeight) / 2, 0]}>
          <CapsuleCollider
            name="character-capsule-collider"
            args={[capsuleHalfHeight, capsuleRadius]}
            activeCollisionTypes={ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_KINEMATIC}
            collisionGroups={(0x00000002 << 16) | 0x00000004}
          />
        </group>
        <CharacterRenderer
          characterResource={characterResource}
          animationConfigMap={animationConfigMap}
          currentActionRef={currentStateRef}
          targetHeight={targetHeight}
          ref={characterRendererRef}
        />

        {/* Render custom UI (e.g., nickname) */}
        {nickname && (
          <Billboard position={[0, nicknameOffsetY, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
            <Text fontSize={0.5} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000000">
              {nickname}
            </Text>
          </Billboard>
        )}
      </NetworkObject>
    );
  },
);
