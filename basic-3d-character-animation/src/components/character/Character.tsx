import React, { RefObject, createRef, useMemo } from 'react';

import { AnimationConfigMap, CharacterRenderer, CharacterResource } from 'vibe-starter-3d';
import Assets from '../../assets.json';
import { CharacterAction } from '../../constants/character';

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
export const Character = ({ currentActionRef = createRef<CharacterAction>(), onAnimationComplete }: CharacterProps) => {
  const characterResource: CharacterResource = useMemo(
    () => ({
      name: 'Default Character',
      url: Assets.characters['space-marine'].url,
      animations: {
        // Idle animations
        IDLE: Assets.animations['idle-00'].url,
        RIFLE_IDLE: Assets.animations['rifle-idle'].url,
        PISTOL_IDLE: Assets.animations['pistol-idle'].url,

        // Movement animations
        WALK: Assets.animations['walk'].url,
        RUN: Assets.animations['run-medium'].url,
        FAST_RUN: Assets.animations['run-fast'].url,
        RIFLE_RUN: Assets.animations['rifle-run'].url,
        PISTOL_RUN: Assets.animations['pistol-run'].url,
        JUMP: Assets.animations['jump'].url,
        SWIM: Assets.animations['swim'].url,

        // Attack animations
        PUNCH: Assets.animations['punch-00'].url,
        KICK: Assets.animations['kick-00'].url,
        MELEE_ATTACK: Assets.animations['melee-attack'].url,
        CAST: Assets.animations['cast'].url,

        // Other animations
        DANCE: Assets.animations['dance'].url,
        HIT: Assets.animations['hit-to-body'].url,
        DIE: Assets.animations['death-backward'].url,
      },
    }),
    [],
  );

  const animationConfigMap: Partial<AnimationConfigMap<CharacterAction>> = {
    // Idle animations
    [CharacterAction.IDLE]: {
      animationType: 'IDLE',
      loop: true,
    },
    [CharacterAction.RIFLE_IDLE]: {
      animationType: 'RIFLE_IDLE',
      loop: true,
    },
    [CharacterAction.PISTOL_IDLE]: {
      animationType: 'PISTOL_IDLE',
      loop: true,
    },

    // Movement animations
    [CharacterAction.WALK]: {
      animationType: 'WALK',
      loop: true,
    },
    [CharacterAction.RUN]: {
      animationType: 'RUN',
      loop: true,
    },
    [CharacterAction.FAST_RUN]: {
      animationType: 'FAST_RUN',
      loop: true,
    },
    [CharacterAction.RIFLE_RUN]: {
      animationType: 'RIFLE_RUN',
      loop: true,
    },
    [CharacterAction.PISTOL_RUN]: {
      animationType: 'PISTOL_RUN',
      loop: true,
    },
    [CharacterAction.JUMP]: {
      animationType: 'JUMP',
      loop: false,
      clampWhenFinished: true,
    },
    [CharacterAction.SWIM]: {
      animationType: 'SWIM',
      loop: true,
    },

    // Attack animations
    [CharacterAction.PUNCH]: {
      animationType: 'PUNCH',
      loop: false,
      clampWhenFinished: true,
      onComplete: () => onAnimationComplete?.(CharacterAction.PUNCH),
    },
    [CharacterAction.KICK]: {
      animationType: 'KICK',
      loop: false,
      clampWhenFinished: true,
      onComplete: () => onAnimationComplete?.(CharacterAction.KICK),
    },
    [CharacterAction.MELEE_ATTACK]: {
      animationType: 'MELEE_ATTACK',
      loop: false,
      clampWhenFinished: true,
      onComplete: () => onAnimationComplete?.(CharacterAction.MELEE_ATTACK),
    },
    [CharacterAction.CAST]: {
      animationType: 'CAST',
      loop: false,
      clampWhenFinished: true,
      onComplete: () => onAnimationComplete?.(CharacterAction.CAST),
    },

    // Other animations
    [CharacterAction.DANCE]: {
      animationType: 'DANCE',
      loop: true,
    },
    [CharacterAction.HIT]: {
      animationType: 'HIT',
      loop: false,
      clampWhenFinished: true,
      onComplete: () => onAnimationComplete?.(CharacterAction.HIT),
    },
    [CharacterAction.DIE]: {
      animationType: 'DIE',
      loop: false,
      duration: 10,
      clampWhenFinished: true,
    },
  };

  return <CharacterRenderer characterResource={characterResource} animationConfigMap={animationConfigMap} currentActionRef={currentActionRef} />;
};
