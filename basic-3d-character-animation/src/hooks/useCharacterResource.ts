import { useEffect, useMemo } from "react";
import { AnimationClip, Group, Mesh, Object3D } from "three";
import { useAnimations, useGLTF } from "@react-three/drei";
import { GLTF, SkeletonUtils } from "three-stdlib";
import { CharacterResource } from "../types/characterResource";
import { AnimationType } from "../types/animation";
import { ANIMATION_KEYWORDS } from "../constants/animation.constant";

/**
 * Integrated hook for managing character models and animations
 *
 * This hook provides the following features:
 * 1. Loading and cloning character models
 * 2. Analyzing built-in animations and mapping them to AnimationType
 * 3. Using shared animations for AnimationTypes without built-in animations
 * 4. Providing animation controls
 *
 * @param characterResource - Character resource information
 * @returns Animation controls and scene information
 */
export const useCharacterResource = (characterResource: CharacterResource) => {
  // Load the model
  const { scene: originalScene, animations: originalAnimations } = useGLTF(
    characterResource.url || ""
  ) as GLTF;

  // Create model clone
  const modelData = useMemo(() => {
    if (!characterResource.url || !originalScene) return null;

    try {
      // Clone the scene (with skeleton handling)
      const clonedScene = SkeletonUtils.clone(originalScene) as Group;

      // Set shadow properties
      clonedScene.traverse((child: Object3D) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      return {
        scene: clonedScene,
        builtInAnimations: originalAnimations?.length ? originalAnimations : [],
      };
    } catch (error) {
      console.error("Failed to load character model:", error);
      console.error("Model path:", characterResource.url);
      return null;
    }
  }, [characterResource.url, originalScene, originalAnimations]);

  // Load shared animations
  const sharedAnimations = useMemo(() => {
    const result: AnimationClip[] = [];

    if (
      !characterResource.animations ||
      !Object.keys(characterResource.animations).length
    ) {
      return result;
    }

    Object.entries(characterResource.animations).forEach(
      ([animationType, url]) => {
        try {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const gltf = useGLTF(url);
          if (gltf && gltf.animations?.length) {
            // Clone the first animation clip and rename it
            const clip = gltf.animations[0].clone();
            clip.name = animationType; // Use animation key as the name
            clip.userData = { ...clip.userData, isExternal: true };
            result.push(clip);
          }
        } catch (error) {
          console.error(
            `Failed to load animation ${animationType}, ${url}:`,
            error
          );
        }
      }
    );
    return result;
  }, [characterResource.animations]);

  // Animation mapping logic
  const { mappedAnimations, animationClips } = useMemo(() => {
    const animations: Partial<Record<AnimationType, AnimationClip>> = {};
    const mappedTypes = new Set<AnimationType>();

    if (!modelData) {
      return { mappedAnimations: {}, animationClips: [] };
    }

    // 1. Map built-in animations
    if (modelData.builtInAnimations.length > 0) {
      modelData.builtInAnimations.forEach((anim) => {
        // Split animation name into tags
        const tags = anim.name
          .toLowerCase()
          .split("|")
          .map((tag) => tag.trim());

        // Try matching for each AnimationType
        Object.entries(ANIMATION_KEYWORDS).forEach(([type, keywords]) => {
          const animationType = type as AnimationType;

          // Skip already mapped types
          if (mappedTypes.has(animationType)) return;

          // 1. Check for exact match
          const match = tags.some((tag) => keywords.includes(tag));
          if (match) {
            const clone = anim.clone();
            clone.name = animationType;
            clone.userData = { ...clone.userData, isBuiltIn: true };
            animations[animationType] = clone;
            mappedTypes.add(animationType);
            return;
          }
        });
      });
    }

    // 2. Map shared animations (for types without built-in animations)
    sharedAnimations.forEach((anim) => {
      const animationType = anim.name as AnimationType;
      if (!mappedTypes.has(animationType)) {
        animations[animationType] = anim;
        mappedTypes.add(animationType);
      }
    });

    return {
      mappedAnimations: animations,
      animationClips: Object.values(animations),
    };
  }, [modelData, sharedAnimations]);

  // Create animation actions using drei's useAnimations hook
  const animationControls = useAnimations(
    animationClips,
    modelData?.scene || undefined
  );

  // Log output
  useEffect(() => {
    if (modelData?.scene) {
      console.log("Character loaded:", {
        characterName: characterResource.name || "Unknown",
        builtInAnimations: modelData.builtInAnimations.length,
        sharedAnimations: sharedAnimations.length,
        mappedAnimations: Object.keys(mappedAnimations).length,
        animationTypes: Object.keys(mappedAnimations),
      });
    }
  }, [modelData, sharedAnimations, mappedAnimations, characterResource.name]);

  // Return animation controls with mapped animations and scene
  return {
    ...animationControls,
    mappedAnimations,
    scene: modelData?.scene || null,
    isLoaded: !!modelData?.scene,
  };
};
