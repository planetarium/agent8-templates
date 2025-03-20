import React, { useRef, useCallback } from "react";
import { AnimationConfigMap } from "../../types/animation";
import { CharacterRenderer } from "./CharacterRenderer";
import { CharacterResource } from "../../types/characterResource";
import {
  CharacterAction,
  CHARACTER_CONSTANTS,
} from "../../constants/character.constant.ts";
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import { Group, Quaternion, Euler, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";

/**
 * Props for the Character component
 */
interface CharacterProps {
  /** Character Resource */
  characterResource: CharacterResource;
  /** RigidBody reference from parent */
  rigidBodyRef?: React.RefObject<RapierRigidBody>;
}

/**
 * 3D Character component with physics and controls
 *
 * Handles animation, physics and movement controls for a 3D character.
 */
export const Character: React.FC<CharacterProps> = ({
  characterResource,
  rigidBodyRef: externalRigidBodyRef,
}) => {
  // Use provided refs or create internal ones
  const internalRigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<Group>(null);

  // Use external refs if provided, otherwise use internal ones
  const rigidBodyRef = externalRigidBodyRef || internalRigidBodyRef;

  const [, get] = useKeyboardControls();
  const currentActionRef = useRef<CharacterAction>(CharacterAction.IDLE);

  const handleAnimationComplete = useCallback((action: CharacterAction) => {
    console.log(`Animation ${action} completed`);

    switch (action) {
      case CharacterAction.JUMP_UP:
        currentActionRef.current = CharacterAction.FALL_IDLE;
        break;
      case CharacterAction.FALL_DOWN:
        currentActionRef.current = CharacterAction.IDLE;
        break;
      case CharacterAction.PUNCH:
      case CharacterAction.HIT:
        currentActionRef.current = CharacterAction.IDLE;
        break;
      default:
        break;
    }
  }, []);

  // Movement vectors and state
  const prevState = useRef({
    action: CharacterAction.IDLE,
    isGrounded: true,
    isInAir: false,
    justLanded: false,
  });

  // Animation configuration
  const animationConfigMap: Partial<AnimationConfigMap<CharacterAction>> = {
    [CharacterAction.IDLE]: {
      animationType: "IDLE",
      loop: true,
    },
    [CharacterAction.WALK]: {
      animationType: "WALK",
      loop: true,
    },
    [CharacterAction.RUN]: {
      animationType: "RUN",
      loop: true,
    },
    [CharacterAction.JUMP_UP]: {
      animationType: "JUMP_UP",
      loop: false,
      clampWhenFinished: true,
      onComplete: () => {
        if (
          currentActionRef.current === CharacterAction.JUMP_UP &&
          handleAnimationComplete
        ) {
          handleAnimationComplete(CharacterAction.JUMP_UP);
        }
      },
    },
    [CharacterAction.FALL_IDLE]: {
      animationType: "FALL_IDLE",
      loop: true,
    },
    [CharacterAction.FALL_DOWN]: {
      animationType: "FALL_DOWN",
      loop: false,
      clampWhenFinished: true,
      onComplete: () => handleAnimationComplete(CharacterAction.FALL_DOWN),
    },
    [CharacterAction.PUNCH]: {
      animationType: "PUNCH",
      loop: false,
      clampWhenFinished: true,
      onComplete: () => handleAnimationComplete(CharacterAction.PUNCH),
    },
    [CharacterAction.HIT]: {
      animationType: "HIT",
      loop: false,
      clampWhenFinished: true,
      onComplete: () => handleAnimationComplete(CharacterAction.HIT),
    },
    [CharacterAction.DIE]: {
      animationType: "DIE",
      loop: false,
      duration: 10,
      clampWhenFinished: true,
    },
  };

  // Update character physics and animation per frame
  useFrame((_, delta) => {
    if (!rigidBodyRef.current || !modelRef.current) return;

    const {
      up,
      down,
      left,
      right,
      run: isRunning,
      jump: isJumping,
      action1: isPunching,
      action2: isHit,
      action3: isDying,
    } = get();

    // Check if character has just landed
    if (prevState.current.isInAir && prevState.current.isGrounded) {
      prevState.current.justLanded = true;
      prevState.current.isInAir = false;
      currentActionRef.current = CharacterAction.FALL_DOWN;
    } else {
      prevState.current.justLanded = false;
    }

    // Check if character is in the air (not grounded and not in jump up animation)
    if (
      !prevState.current.isGrounded &&
      currentActionRef.current !== CharacterAction.JUMP_UP &&
      currentActionRef.current !== CharacterAction.FALL_DOWN
    ) {
      // Maintain the FALL_IDLE state while in air
      currentActionRef.current = CharacterAction.FALL_IDLE;
    }

    const direction = new Vector3(0, 0, 0);

    if (up) direction.z -= 1;
    if (down) direction.z += 1;
    if (right) direction.x += 1;
    if (left) direction.x -= 1;

    if (direction.length() > 0) {
      direction.normalize();
    }

    const isMoving = direction.lengthSq() > 0;

    // Only determine next action if not in a transition state
    if (
      !prevState.current.justLanded &&
      currentActionRef.current !== CharacterAction.FALL_DOWN &&
      currentActionRef.current !== CharacterAction.JUMP_UP
    ) {
      // Determine next action based on input
      const nextAction = determineNextAction(
        isMoving,
        isRunning,
        isJumping,
        isPunching,
        isHit,
        isDying
      );

      // Update action state if changed
      if (nextAction !== currentActionRef.current) {
        currentActionRef.current = nextAction;
        prevState.current.action = nextAction;
      }
    }

    // Update physics
    updatePhysics(isMoving, direction, isRunning, delta);
  });

  // Determine next character action based on inputs
  const determineNextAction = useCallback(
    (
      isMoving: boolean,
      isRunning: boolean,
      isJumping: boolean,
      isPunching: boolean,
      isHit: boolean,
      isDying: boolean
    ): CharacterAction => {
      if (isPunching) {
        return CharacterAction.PUNCH;
      }

      if (isHit) {
        return CharacterAction.HIT;
      }

      if (isDying) {
        return CharacterAction.DIE;
      }

      if (isJumping && prevState.current.isGrounded) {
        // Apply jump force
        rigidBodyRef.current.applyImpulse(
          { x: 0, y: CHARACTER_CONSTANTS.PHYSICS.JUMP_FORCE, z: 0 },
          true
        );
        prevState.current.isGrounded = false;
        prevState.current.isInAir = true;
        return CharacterAction.JUMP_UP;
      }

      // We're in air, maintain falling state
      if (!prevState.current.isGrounded) {
        return CharacterAction.FALL_IDLE;
      }

      if (isMoving) {
        return isRunning ? CharacterAction.RUN : CharacterAction.WALK;
      }

      if (prevState.current.action === CharacterAction.DIE) {
        // Maintain death state
        return CharacterAction.DIE;
      }

      if (
        prevState.current.action === CharacterAction.PUNCH ||
        prevState.current.action === CharacterAction.HIT
      ) {
        // Maintain punch/hit until animation completes
        return prevState.current.action;
      }

      return CharacterAction.IDLE;
    },
    [rigidBodyRef]
  );

  // Update physics properties based on movement
  const updatePhysics = useCallback(
    (
      isMoving: boolean,
      direction: Vector3,
      isRunning: boolean,
      delta: number
    ) => {
      if (isMoving) {
        // Set velocity based on direction and speed
        const speed = isRunning
          ? CHARACTER_CONSTANTS.PHYSICS.RUN_SPEED
          : CHARACTER_CONSTANTS.PHYSICS.MOVE_SPEED;

        rigidBodyRef.current.setLinvel(
          {
            x: direction.x * speed,
            y: rigidBodyRef.current.linvel().y,
            z: direction.z * speed,
          },
          true
        );

        // Calculate rotation based on movement direction
        const targetRotation = new Quaternion().setFromEuler(
          new Euler(0, Math.atan2(direction.x, direction.z), 0)
        );

        // Smoothly interpolate rotation
        modelRef.current.quaternion.slerp(
          targetRotation,
          CHARACTER_CONSTANTS.PHYSICS.ROTATION.LERP_FACTOR * delta
        );
      } else {
        // Stop horizontal movement when not moving
        rigidBodyRef.current.setLinvel(
          {
            x: 0,
            y: rigidBodyRef.current.linvel().y,
            z: 0,
          },
          true
        );
      }
    },
    [rigidBodyRef]
  );

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 1, 0]}
      mass={1}
      enabledRotations={[false, false, false]}
      colliders={false}
      lockRotations
      type="dynamic"
      onCollisionEnter={() => {
        prevState.current.isGrounded = true;
      }}
      onCollisionExit={() => {
        prevState.current.isGrounded = false;
        prevState.current.isInAir = true;
      }}
    >
      <CapsuleCollider
        args={[
          CHARACTER_CONSTANTS.PHYSICS.COLLIDER.CAPSULE.HEIGHT / 2,
          CHARACTER_CONSTANTS.PHYSICS.COLLIDER.CAPSULE.RADIUS,
        ]}
        position={[0, CHARACTER_CONSTANTS.PHYSICS.COLLIDER.CAPSULE.OFFSET_Y, 0]}
      />
      <group ref={modelRef}>
        <CharacterRenderer
          characterResource={characterResource}
          animationConfigMap={animationConfigMap}
          currentActionRef={currentActionRef}
        />
      </group>
    </RigidBody>
  );
};
