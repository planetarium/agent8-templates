import React, { RefObject, createRef } from "react";
import { AnimationConfigMap } from "../../types/animation";
import { CharacterRenderer } from "./CharacterRenderer";
import { CharacterResource } from "../../types/characterResource";
import { CharacterAction } from "../../constants/character.constant.ts";

/**
 * Props for the PreviewCharacter component
 */
interface CharacterProps {
  /** Character Resource */
  characterResource: CharacterResource;
  /** Reference to the current character action */
  currentActionRef: RefObject<CharacterAction | undefined>;
  /** Optional callback for when an animation completes */
  onAnimationComplete?: (action: CharacterAction) => void;
}

/**
 * 3D Character component for animation preview
 *
 * This component handles the character animation state management and rendering.
 * It configures different animations based on the current action and passes them
 * to the CharacterRenderer component.
 *
 * Features:
 * - Animation configuration for different character actions
 * - Animation completion callbacks
 * - Support for looping and non-looping animations
 *
 * @component
 */
export const Character = ({
  characterResource,
  currentActionRef = createRef<CharacterAction>(),
  onAnimationComplete,
}: CharacterProps) => {
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
          onAnimationComplete
        ) {
          onAnimationComplete(CharacterAction.JUMP_UP);
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
    },
    [CharacterAction.PUNCH]: {
      animationType: "PUNCH",
      loop: false,
      clampWhenFinished: true,
      onComplete: () => onAnimationComplete?.(CharacterAction.PUNCH),
    },
    [CharacterAction.HIT]: {
      animationType: "HIT",
      loop: false,
      clampWhenFinished: true,
      onComplete: () => onAnimationComplete?.(CharacterAction.HIT),
    },
    [CharacterAction.DIE]: {
      animationType: "DIE",
      loop: false,
      duration: 10,
      clampWhenFinished: true,
    },
  };

  return (
    <CharacterRenderer
      characterResource={characterResource}
      animationConfigMap={animationConfigMap}
      currentActionRef={currentActionRef}
    />
  );
};
