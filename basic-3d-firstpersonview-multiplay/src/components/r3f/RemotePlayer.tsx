import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { CapsuleCollider } from '@react-three/rapier';
import { Vector3, Quaternion } from '@react-three/fiber';
import { ActiveCollisionTypes } from '@dimforge/rapier3d-compat';
import {
  AnimationConfigMap,
  CharacterRenderer,
  CharacterRendererRef,
  ControllerUtils,
  NetworkObjectHandle,
  NetworkObject,
  AnimationType,
} from 'vibe-starter-3d';
import Assets from '../../assets.json';
import { usePlayerStore } from '../../stores/playerStore';

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

// Remote player with interpolation/extrapolation movement
const RemotePlayer = forwardRef<RemotePlayerHandle, RemotePlayerProps>(
  ({ account, characterUrl: characterKey, position = [0, 0, 0], rotation = [0, 0, 0, 1], targetHeight = 1.6, nickname }, ref) => {
    const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();

    const networkObjectRef = useRef<NetworkObjectHandle>(null);
    const currentStateRef = useRef<CharacterState>(CharacterState.IDLE);

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
      if (!account || !networkObjectRef.current) return;

      registerPlayerRef(account, networkObjectRef.current.rigidBodyRef);

      return () => {
        unregisterPlayerRef(account);
      };
    }, [account, networkObjectRef, registerPlayerRef, unregisterPlayerRef]);

    // Memoized map of animation configurations.
    const animationConfigMap: AnimationConfigMap = useMemo(
      () => ({
        [CharacterState.IDLE]: {
          url: Assets.animations.idle.url,
          loop: true,
        },
        [CharacterState.WALK]: {
          url: Assets.animations.walk.url,
          loop: true,
        },
        [CharacterState.RUN]: {
          url: Assets.animations.run.url,
          loop: true,
        },
        [CharacterState.JUMP]: {
          url: Assets.animations.jump.url,
          loop: false,
          clampWhenFinished: true,
        },
        [CharacterState.PUNCH]: {
          url: Assets.animations.punch.url,
          loop: false,
          clampWhenFinished: true,
        },
        [CharacterState.HIT]: {
          url: Assets.animations.hit.url,
          loop: false,
          clampWhenFinished: true,
        },
        [CharacterState.DIE]: {
          url: Assets.animations.die.url,
          loop: false,
          duration: 10,
          clampWhenFinished: true,
        },
      }),
      [],
    );

    // Callback triggered when a non-looping animation finishes.
    const handleAnimationComplete = React.useCallback(
      (type: AnimationType) => {
        switch (type) {
          case CharacterState.JUMP:
          case CharacterState.PUNCH:
          case CharacterState.HIT:
            if (currentStateRef.current === type) {
              currentStateRef.current = CharacterState.IDLE;
            }
            break;
          default:
            break;
        }
      },
      [currentStateRef],
    );

    useEffect(() => {
      if (!networkObjectRef.current || !networkObjectRef.current.rigidBodyRef.current) return;

      networkObjectRef.current.rigidBodyRef.current.userData = { account };
    }, [account, networkObjectRef]);

    // Renderer setup
    const characterRendererRef = useRef<CharacterRendererRef>(null);
    const nicknameOffsetY = targetHeight + 0.5;

    const capsuleRadius = ControllerUtils.capsuleRadius(targetHeight); // capsule collider radius
    const capsuleHalfHeight = ControllerUtils.capsuleHalfHeight(targetHeight); // half height of capsule collider

    const characterUrl = useMemo(() => {
      const characterData = (Assets.characters as Record<string, { url: string }>)[characterKey];
      return characterData?.url || Assets.characters['base-model'].url;
    }, [characterKey]);

    return (
      <NetworkObject ref={networkObjectRef} position={position} rotation={rotation}>
        <group position={[0, ControllerUtils.targetHeight(targetHeight) / 2, 0]}>
          <CapsuleCollider
            name="character-capsule-collider"
            args={[capsuleHalfHeight, capsuleRadius]}
            activeCollisionTypes={ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_KINEMATIC}
          />
        </group>
        <CharacterRenderer
          ref={characterRendererRef}
          url={characterUrl}
          animationConfigMap={animationConfigMap}
          currentAnimationRef={currentStateRef}
          targetHeight={targetHeight}
          onAnimationComplete={handleAnimationComplete}
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

export default RemotePlayer;
