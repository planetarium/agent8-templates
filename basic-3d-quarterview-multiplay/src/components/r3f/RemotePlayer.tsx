import { useRef, useMemo, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { CapsuleCollider } from '@react-three/rapier';
import { Vector3, Quaternion } from '@react-three/fiber';
import { ActiveCollisionTypes } from '@dimforge/rapier3d-compat';
import { AnimationConfigMap, CharacterRenderer, CharacterUtils, NetworkObjectHandle, NetworkObject, AnimationType } from 'vibe-starter-3d';
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

    useEffect(() => {
      if (!networkObjectRef.current || !networkObjectRef.current.rigidBodyRef.current) return;

      networkObjectRef.current.rigidBodyRef.current.userData = { account };
    }, [account, networkObjectRef]);

    const nicknameOffsetY = targetHeight + 0.5;

    const capsuleRadius = CharacterUtils.capsuleRadius(targetHeight); // capsule collider radius
    const capsuleHalfHeight = CharacterUtils.capsuleHalfHeight(targetHeight); // half height of capsule collider

    const characterUrl = useMemo(() => {
      const characterData = (Assets.characters as Record<string, { url: string }>)[characterKey];
      return characterData?.url || Assets.characters['base-model'].url;
    }, [characterKey]);

    return (
      <NetworkObject ref={networkObjectRef} position={position} rotation={rotation}>
        <group position={[0, CharacterUtils.targetHeight(targetHeight) / 2, 0]}>
          <CapsuleCollider
            name="character-capsule-collider"
            args={[capsuleHalfHeight, capsuleRadius]}
            activeCollisionTypes={ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_KINEMATIC}
          />
        </group>
        <CharacterRenderer
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
