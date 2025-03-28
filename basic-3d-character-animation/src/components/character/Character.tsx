import React, { RefObject, createRef, useMemo } from "react";

import {
  AnimationConfigMap,
  CharacterRenderer,
  CharacterResource,
} from "vibe-starter-3d";
import Assets from "../../assets.json";
import { CharacterAction } from "../../constants/character";

/**
 * Props for the PreviewCharacter component
 */
interface CharacterProps {
  /** Reference to the current character action */
  currentActionRef: RefObject<CharacterAction | undefined>;
  onAnimationComplete: (action: CharacterAction) => void;
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
  currentActionRef = createRef<CharacterAction>(),
  onAnimationComplete,
}: CharacterProps) => {
  const characterResource: CharacterResource = useMemo(
    () => ({
      name: "Default Character",
      url: Assets.characters["space-marine"].url,
      animations: {
        IDLE: Assets.animations.idle.url,
        WALK: Assets.animations.walk.url,
        RUN: Assets.animations.run.url,
        JUMP: Assets.animations.jump.url,
        PUNCH: Assets.animations.punch.url,
        MELEE_ATTACK: Assets.animations.melee_attack.url,
        AIM: Assets.animations.aim.url,
        SHOOT: Assets.animations.shoot.url,
        AIM_RUN: Assets.animations.aim_run.url,
        HIT: Assets.animations.hit.url,
        DIE: Assets.animations.die.url,
      },
    }),
    []
  );

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
    [CharacterAction.JUMP]: {
      animationType: "JUMP",
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
