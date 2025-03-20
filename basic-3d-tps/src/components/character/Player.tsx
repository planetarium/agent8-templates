import React, {
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { AnimationConfigMap } from "../../types/animation.ts";
import { CharacterRenderer } from "./CharacterRenderer.tsx";
import { CharacterResource } from "../../types/characterResource.ts";
import { CharacterAction } from "../../constants/character.constant.ts";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import Ecctrl, { CustomEcctrlRigidBody } from "ecctrl";

/**
 * Props for the Character component
 */
interface CharacterProps {
  /** Character Resource */
  characterResource: CharacterResource;
}

/**
 * Character input parameters for action determination
 */
interface CharacterInputs {
  isRevive: boolean;
  isDying: boolean;
  isPunching: boolean;
  isHit: boolean;
  isJumping: boolean;
  isMoving: boolean;
  isRunning: boolean;
  currentVelY: number;
}

/**
 * Physics constants for character
 */
const CHARACTER_PHYSICS = {
  JUMP_FORCE: 2,
  CAPSULE_RADIUS: 0.3,
  CAPSULE_HEIGHT: 1.1,
};

/**
 * Custom Ecctrl wrapper component with proper typing
 */
const CustomEcctrl = forwardRef<
  CustomEcctrlRigidBody,
  React.ComponentProps<typeof Ecctrl>
>((props, ref) => {
  useImperativeHandle(ref, () => ({} as CustomEcctrlRigidBody));
  return <Ecctrl ref={ref} {...props} />;
});

CustomEcctrl.displayName = "CustomEcctrl";

/**
 * Hook for handling character animations
 */
function useCharacterAnimations(
  currentActionRef: React.MutableRefObject<CharacterAction>
) {
  const handleAnimationComplete = useCallback(
    (action: CharacterAction) => {
      console.log(`Animation ${action} completed`);

      switch (action) {
        case CharacterAction.JUMP_UP:
          currentActionRef.current = CharacterAction.FALL_IDLE;
          break;
        case CharacterAction.FALL_DOWN:
          currentActionRef.current = CharacterAction.IDLE;
          break;
        case CharacterAction.PUNCH:
          currentActionRef.current = CharacterAction.IDLE;
          break;
        case CharacterAction.HIT:
          currentActionRef.current = CharacterAction.IDLE;
          break;
        default:
          break;
      }
    },
    [currentActionRef]
  );

  // Animation configuration
  const animationConfigMap: Partial<AnimationConfigMap<CharacterAction>> =
    useMemo(
      () => ({
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
              handleAnimationComplete(CharacterAction.FALL_IDLE);
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
      }),
      [handleAnimationComplete, currentActionRef]
    );

  return { animationConfigMap };
}

/**
 * Hook for character action determination logic
 */
function useCharacterActions() {
  // Function to determine character action based on inputs and current state
  const determineCharacterAction = useCallback(
    (
      currentAction: CharacterAction,
      {
        isRevive,
        isDying,
        isPunching,
        isHit,
        isJumping,
        isMoving,
        isRunning,
        currentVelY,
      }: CharacterInputs
    ): CharacterAction => {
      // Revival processing - transition from DIE to IDLE
      if (isRevive && currentAction === CharacterAction.DIE) {
        return CharacterAction.IDLE;
      }

      // Maintain death state
      if (isDying || currentAction === CharacterAction.DIE) {
        return CharacterAction.DIE;
      }

      // Punch animation - start only if not already punching
      if (isPunching && currentAction !== CharacterAction.PUNCH) {
        return CharacterAction.PUNCH;
      }

      // Hit animation - immediately transition to HIT
      if (isHit) {
        return CharacterAction.HIT;
      }

      // Jump animation (can't jump while punching)
      if (
        isJumping &&
        currentAction !== CharacterAction.FALL_IDLE &&
        currentAction !== CharacterAction.PUNCH
      ) {
        return CharacterAction.JUMP_UP;
      }

      // Maintain punch animation until completion
      if (currentAction === CharacterAction.PUNCH) {
        return CharacterAction.PUNCH;
      }

      // Idle state
      if (!isMoving) {
        return CharacterAction.IDLE;
      }

      // Walk/Run animation
      if (isMoving) {
        return isRunning ? CharacterAction.RUN : CharacterAction.WALK;
      }

      // Falling animation
      if (currentVelY < 0) {
        return CharacterAction.FALL_IDLE;
      }

      // Default - maintain current action
      return currentAction;
    },
    []
  );

  return { determineCharacterAction };
}

/**
 * 3D Character component with physics and controls
 *
 * Handles animation, physics and movement controls for a 3D character.
 */
export const Character: React.FC<CharacterProps> = ({ characterResource }) => {
  const rigidBodyRef = useRef<CustomEcctrlRigidBody>(null);
  const currentActionRef = useRef<CharacterAction>(CharacterAction.IDLE);
  const [, get] = useKeyboardControls();

  // Development-only logging for component lifecycle
  useEffect(() => {
    console.log("Character component mounted");
    console.log("Initial rigidBodyRef:", rigidBodyRef.current);

    return () => {
      console.log("Character component unmounted");
    };
  }, []);

  // Development-only logging for reference changes
  useEffect(() => {
    console.log("rigidBodyRef updated:", rigidBodyRef.current);
  }, []);

  // Custom hooks for character logic
  const { animationConfigMap } = useCharacterAnimations(currentActionRef);
  const { determineCharacterAction } = useCharacterActions();

  // Update character physics and animation per frame
  useFrame(() => {
    if (!rigidBodyRef.current) return;

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

    // Check if character is moving
    const isMoving = forward || backward || leftward || rightward;

    // Call action determination logic
    currentActionRef.current = determineCharacterAction(
      currentActionRef.current,
      {
        isRevive,
        isDying,
        isPunching,
        isHit,
        isJumping,
        isMoving,
        isRunning,
        currentVelY: currentVel.y,
      }
    );
  });

  return (
    <CustomEcctrl
      ref={rigidBodyRef}
      camCollision={true} // disable camera collision detect (useless in FP mode)
      camInitDis={-4} // camera intial position
      camMinDis={-4} // camera zoom in closest position
      camMaxDis={-4} // camera zoom in farthest position
      camFollowMult={1000} // give a big number here, so the camera follows the target (character) instantly
      camLerpMult={1000} // give a big number here, so the camera lerp to the followCam position instantly
      turnVelMultiplier={1} // Turning speed same as moving speed
      turnSpeed={100} // give it big turning speed to prevent turning wait time
      mode="CameraBasedMovement" // character's rotation will follow camera's rotation in this mode
      capsuleRadius={CHARACTER_PHYSICS.CAPSULE_RADIUS} // capsule collider radius
      capsuleHalfHeight={CHARACTER_PHYSICS.CAPSULE_HEIGHT / 2} // half height of capsule collider
      floatHeight={0} // height adjustment between character and ground
    >
      <group
        position={[
          0,
          -(
            CHARACTER_PHYSICS.CAPSULE_HEIGHT / 2 +
            CHARACTER_PHYSICS.CAPSULE_RADIUS
          ),
          0,
        ]}
      >
        <CharacterRenderer
          characterResource={characterResource}
          animationConfigMap={animationConfigMap}
          currentActionRef={currentActionRef}
        />
      </group>
    </CustomEcctrl>
  );
};
