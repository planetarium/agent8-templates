import React, { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { AnimationConfigMap } from "../types/animation";
import { useFrame } from "@react-three/fiber";

/**
 * Animation constants used throughout the animation system
 */
export const ANIMATION_CONSTANT = {
  /** Duration for fade in/out transitions (seconds) */
  FADE_DURATION: 0.3,
  /** Default animation duration (seconds) */
  DEFAULT_DURATION: 0.5,
} as const;

/**
 * Hook for handling character animations
 *
 * This hook manages animation playback, transitions, and sequencing.
 * It handles fading between animations, setting up animation chains,
 * and managing animation states.
 *
 * @param actionRef - Reference to the current animation action
 * @param animationConfigMap - Configuration map for all possible animations
 * @param api - Object containing animation actions and mixer
 * @returns void
 */
export const useAnimationHandler = <ActionType extends string>(
  actionRef: React.RefObject<ActionType | undefined>,
  animationConfigMap: Partial<AnimationConfigMap<ActionType>>,
  api: {
    actions: Record<string, THREE.AnimationAction | null>;
    mixer: THREE.AnimationMixer;
  }
) => {
  // Reference to store cleanup function for current animation
  const cleanupRef = useRef<(() => void) | null>(null);

  // Track the last played animation action
  const lastPlayedActionRef = useRef<ActionType | undefined>(undefined);

  // Track the last checked action for comparison
  const lastCheckedActionRef = useRef<ActionType | undefined>(undefined);

  /**
   * Plays an animation with proper configuration and transitions
   *
   * This function handles:
   * - Cleaning up previous animations
   * - Configuring loop and clamp settings
   * - Setting animation speed based on duration
   * - Fading between animations for smooth transitions
   * - Setting up animation completion callbacks
   *
   * @param actionName - Name of the animation to play
   * @param action - The THREE.AnimationAction object
   * @returns Cleanup function
   */
  const playAnimation = useCallback(
    (action: ActionType, animationAction: THREE.AnimationAction) => {
      console.log("[PLAY]:", action);

      // Execute previous cleanup function if exists
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      const config = animationConfigMap[action];
      if (!config) {
        return;
      }
      const {
        loop = true,
        clampWhenFinished = false,
        duration,
        onComplete,
      } = config;

      // Find the currently active animation (if any)
      let currentActiveAction: THREE.AnimationAction | null = null;

      if (lastPlayedActionRef.current) {
        const lastAnimType =
          animationConfigMap[lastPlayedActionRef.current]?.animationType;
        if (lastAnimType && api.actions[lastAnimType]) {
          currentActiveAction = api.actions[lastAnimType];
        }
      }

      // Configure the new animation before playing
      animationAction.reset();
      animationAction.setLoop(
        loop ? THREE.LoopRepeat : THREE.LoopOnce,
        Infinity
      );
      animationAction.clampWhenFinished = clampWhenFinished;

      // Set animation speed based on duration if provided
      if (duration && animationAction.getClip()) {
        const originalDuration = animationAction.getClip().duration;
        const timeScale = originalDuration / duration;
        animationAction.timeScale = timeScale;
      } else {
        // Reset to default speed
        animationAction.timeScale = 1;
      }

      // Handle the transition between animations
      if (currentActiveAction && currentActiveAction !== animationAction) {
        // Special case for clampWhenFinished animations (like DIE)
        const lastConfig = lastPlayedActionRef.current
          ? animationConfigMap[lastPlayedActionRef.current]
          : null;

        if (lastConfig?.clampWhenFinished) {
          // For clampWhenFinished animations, we need a special transition
          // to avoid the T-pose issue

          // First, make sure the new animation is ready to play
          animationAction.setEffectiveTimeScale(1);
          animationAction.setEffectiveWeight(1);

          // Then crossfade from the current animation
          currentActiveAction.crossFadeTo(
            animationAction,
            ANIMATION_CONSTANT.FADE_DURATION,
            true
          );

          // Start the new animation
          animationAction.play();
        } else {
          // For normal animations, use standard crossfade
          animationAction.setEffectiveWeight(1);
          currentActiveAction.crossFadeTo(
            animationAction,
            ANIMATION_CONSTANT.FADE_DURATION,
            true
          );
          animationAction.play();
        }

        // Stop all other animations (except the two involved in the transition)
        Object.values(api.actions).forEach((a) => {
          if (
            a &&
            a !== animationAction &&
            a !== currentActiveAction &&
            a.isRunning()
          ) {
            a.stop();
          }
        });
      } else {
        // No active animation, just play the new one with a fade-in
        animationAction.fadeIn(ANIMATION_CONSTANT.FADE_DURATION);
        animationAction.play();
      }

      // Update last played action reference
      lastPlayedActionRef.current = action;

      // Set up onComplete callback for non-looping animations
      if (!loop && onComplete) {
        const onFinished = () => {
          api.mixer.removeEventListener("finished", onFinished);
          if (onComplete) {
            onComplete();
          }
        };

        api.mixer.addEventListener("finished", onFinished);

        return () => {
          api.mixer.removeEventListener("finished", onFinished);
        };
      }

      return () => {};
    },
    [animationConfigMap, api.actions, api.mixer]
  );

  /**
   * Updates the current animation based on actionRef changes
   *
   * This function checks if the animation needs to be changed
   * and handles the transition to the new animation.
   */
  const updateAnimation = useCallback(() => {
    if (!actionRef.current) {
      return;
    }
    const animationConfig = animationConfigMap[actionRef.current];
    if (!animationConfig) {
      return;
    }
    const currentAnimation = animationConfig.animationType;

    // Store current action for comparison
    lastCheckedActionRef.current = actionRef.current;

    // Skip if the same animation is already playing
    if (actionRef.current === lastPlayedActionRef.current) {
      const action = api.actions[currentAnimation];
      if (action && action.isRunning()) {
        return;
      }
    }

    // Find the action for the current animation
    const action = api.actions[currentAnimation];
    if (action) {
      // Play the animation and store cleanup function
      const cleanup = playAnimation(actionRef.current, action);
      if (cleanup) {
        cleanupRef.current = cleanup;
      }
    } else {
      console.log("[ERROR] not found action: ", currentAnimation, api.actions);
    }
  }, [actionRef, animationConfigMap, api.actions, playAnimation]);

  // Check for action ref changes every frame and update animations
  useFrame(() => {
    // Check if actionRef.current value has changed
    if (actionRef.current !== lastCheckedActionRef.current) {
      updateAnimation();
    }
  });

  // Initial setup effect
  useEffect(() => {
    // Initialize animation on first mount
    updateAnimation();

    return () => {
      // Cleanup on component unmount
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [updateAnimation]);
};
