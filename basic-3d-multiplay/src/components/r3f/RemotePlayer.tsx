import React, { useRef, useMemo, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";
import { CharacterState } from "../../constants/character";
import {
  AnimationConfig,
  AnimationConfigMap,
  CharacterRenderer,
  CharacterResource,
  DEFAULT_CONTROLLER_CONFIG,
} from "vibe-starter-3d";
import Assets from "../../assets.json";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Vector3, Quaternion } from "three";
import { remotePlayersStateRef } from "./Experience";
import { Transform, UserState } from "../../types";

/**
 * Remote player component props
 */
interface RemotePlayerProps {
  /** Player account ID */
  account: string;
  /** Character key to use */
  characterKey: string;
  /** Player nickname */
  nickname?: string;
  /** Player transform data */
  transform?: Transform;
  /** Player character state */
  state?: string;
}

/**
 * Hook for handling player animations
 */
function usePlayerAnimations(
  currentStateRef: React.MutableRefObject<CharacterState>
) {
  const handleAnimationComplete = React.useCallback(
    (state: CharacterState) => {
      switch (state) {
        case CharacterState.JUMP:
        case CharacterState.PUNCH:
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
 * RemotePlayer component for rendering other players in the game
 */
export const RemotePlayer: React.FC<RemotePlayerProps> = ({
  account,
  characterKey,
  nickname,
  transform: initialTransform,
  state: initialState,
}) => {
  // Reference to remote player state
  const getUserState = () => remotePlayersStateRef.current[account]?.state;

  // Default transform setting
  const defaultTransform = {
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0, 1] as [number, number, number, number],
  };

  // Track current state
  const currentStateRef = useRef<CharacterState>(
    (getUserState()?.state as CharacterState) || CharacterState.IDLE
  );
  const { animationConfigMap } = usePlayerAnimations(currentStateRef);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);

  // Store target state for interpolation
  const targetState = useRef({
    position: new Vector3(),
    rotation: new Quaternion(),
  });

  // Interpolation settings
  const INTERPOLATION_FACTOR = 0.2; // Interpolation speed (0~1)

  // Perform smooth interpolation and state updates each frame
  useFrame(() => {
    if (!rigidBodyRef.current) return;

    // Get latest user state
    const userState = getUserState();
    if (!userState) return;

    // Update transform if needed
    if (userState.transform) {
      const transform = userState.transform;

      // Update position
      const [x, y, z] = transform.position;
      targetState.current.position.set(x, y, z);

      // Update rotation
      const [rx, ry, rz, rw] = transform.rotation;
      targetState.current.rotation.set(rx, ry, rz, rw);
    }

    // Update state if needed
    if (userState.state) {
      currentStateRef.current = userState.state as CharacterState;
    }

    const currentPosition = rigidBodyRef.current.translation();
    const currentRotation = rigidBodyRef.current.rotation();

    // Position interpolation using Vector3.lerp
    const newPosition = new Vector3(
      currentPosition.x,
      currentPosition.y,
      currentPosition.z
    ).lerp(targetState.current.position, INTERPOLATION_FACTOR);

    // Rotation interpolation using Quaternion.slerp
    const newRotation = new Quaternion(
      currentRotation.x,
      currentRotation.y,
      currentRotation.z,
      currentRotation.w
    ).slerp(targetState.current.rotation, INTERPOLATION_FACTOR);

    // Apply interpolated values to rigid body
    rigidBodyRef.current.setTranslation(newPosition, true);
    rigidBodyRef.current.setRotation(newRotation, true);
  });

  // Define the character resource with all animations
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

  // Initial position and rotation setup
  useEffect(() => {
    if (!rigidBodyRef.current) return;

    // Get initial state
    const userState = getUserState();
    const transform = userState?.transform || defaultTransform;

    const [x, y, z] = transform.position;
    rigidBodyRef.current.setTranslation({ x, y, z }, true);

    const [rx, ry, rz, rw] = transform.rotation;
    rigidBodyRef.current.setRotation({ x: rx, y: ry, z: rz, w: rw }, true);

    // Also set initial target state
    targetState.current.position.set(x, y, z);
    targetState.current.rotation.set(rx, ry, rz, rw);
  }, []);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders="cuboid"
      userData={{ isRemotePlayer: true, account }}
    >
      <group ref={modelRef}>
        <group
          position={[
            0,
            -(
              DEFAULT_CONTROLLER_CONFIG.TARGET_HEIGHT / 2 +
              DEFAULT_CONTROLLER_CONFIG.TARGET_HEIGHT / 5
            ),
            0,
          ]}
        >
          <CharacterRenderer
            characterResource={characterResource}
            animationConfigMap={animationConfigMap}
            currentActionRef={currentStateRef}
          />
        </group>
      </group>

      {/* Player nickname display */}
      {nickname && (
        <Billboard
          position={[0, 2, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Text
            fontSize={0.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {nickname}
          </Text>
        </Billboard>
      )}
    </RigidBody>
  );
};
