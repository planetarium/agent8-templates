import { useState, useEffect, useMemo } from "react";
import { AnimationClip, Group, Mesh, Object3D } from "three";
import { useGLTF, useAnimations } from "@react-three/drei";
import { GLTFLoader } from "three-stdlib";
import { SkeletonUtils } from "three-stdlib";
import { CharacterResource } from "../types/characterResource";
import { AnimationType } from "../types/animation";
import { ANIMATION_KEYWORDS } from "../constants/animation.constant";
import { GLTF } from "three-stdlib";

export const useCharacterResource = (characterResource: CharacterResource) => {
  const modelUrl = characterResource.url;
  const animationEntries = useMemo(
    () => Object.entries(characterResource.animations || {}),
    [characterResource.animations]
  );
  const animationTypes = useMemo(
    () => animationEntries.map(([type]) => type),
    [animationEntries]
  );
  const animationUrls = useMemo(
    () => animationEntries.map(([, url]) => url),
    [animationEntries]
  );

  // 1) Loading main character model (handled by Suspense or error boundary)
  const { scene: originalScene, animations: originalAnimations } = useGLTF(
    modelUrl || ""
  ) as GLTF;

  // 2) Clone character model and set up shadows
  const modelData = useMemo(() => {
    if (!modelUrl || !originalScene) return null;
    try {
      const clonedScene = SkeletonUtils.clone(originalScene) as Group;
      clonedScene.traverse((child: Object3D) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return {
        scene: clonedScene,
        builtInAnimations: originalAnimations ?? [],
      };
    } catch (error) {
      console.error("Failed to load character model:", error);
      console.error("Model path:", modelUrl);
      return null;
    }
  }, [modelUrl, originalScene, originalAnimations]);

  // 3) Load external animations once and handle failures
  const [sharedGLTFs, setSharedGLTFs] = useState<(GLTF | null)[]>([]);

  useEffect(() => {
    if (!animationUrls.length) {
      setSharedGLTFs([]);
      return;
    }

    let isMounted = true;

    (async () => {
      const results = await Promise.allSettled(
        animationUrls.map((url) => new GLTFLoader().loadAsync(url))
      );
      if (!isMounted) return;

      const loaded = results.map((result, i) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          console.error(
            `Failed to load animation [${animationTypes[i]}]:`,
            animationUrls[i],
            result.reason
          );
          return null;
        }
      });
      setSharedGLTFs(loaded);
    })();

    return () => {
      isMounted = false;
    };
  }, [animationUrls, animationTypes]);

  // 4) Create AnimationClip from successfully loaded external GLTFs
  const sharedAnimations: AnimationClip[] = useMemo(() => {
    if (!sharedGLTFs.length) return [];
    return sharedGLTFs.reduce<AnimationClip[]>((acc, gltf, i) => {
      if (gltf?.animations?.length) {
        const clip = gltf.animations[0].clone();
        clip.name = animationTypes[i];
        clip.userData = { ...clip.userData, isExternal: true };
        acc.push(clip);
      }
      return acc;
    }, []);
  }, [sharedGLTFs, animationTypes]);

  // 5) Merge and map built-in and external animations
  const { mappedAnimations, animationClips } = useMemo(() => {
    if (!modelData) return { mappedAnimations: {}, animationClips: [] };

    const builtIn = modelData.builtInAnimations;
    const animations: Partial<Record<AnimationType, AnimationClip>> = {};
    const mappedTypes = new Set<AnimationType>();

    // A) Match keywords from built-in animations
    builtIn.forEach((anim) => {
      const tags = anim.name
        .toLowerCase()
        .split("|")
        .map((tag) => tag.trim());
      Object.entries(ANIMATION_KEYWORDS).forEach(([type, keywords]) => {
        const animationType = type as AnimationType;
        if (mappedTypes.has(animationType)) return;
        if (tags.some((tag) => keywords.includes(tag))) {
          const clone = anim.clone();
          clone.name = animationType;
          clone.userData = { ...clone.userData, isBuiltIn: true };
          animations[animationType] = clone;
          mappedTypes.add(animationType);
        }
      });
    });

    // B) Use external animations for types not matched in built-in animations
    sharedAnimations.forEach((clip) => {
      const animationType = clip.name as AnimationType;
      if (!mappedTypes.has(animationType)) {
        animations[animationType] = clip;
        mappedTypes.add(animationType);
      }
    });

    return {
      mappedAnimations: animations,
      animationClips: Object.values(animations),
    };
  }, [modelData, sharedAnimations]);

  // 6) Create animation controls using drei's useAnimations
  const animationControls = useAnimations(
    animationClips,
    modelData?.scene || undefined
  );

  // 7) Debug logging (if needed)
  useEffect(() => {
    if (modelData?.scene) {
      console.log("Character loaded successfully:", {
        characterName: characterResource.name || "Unknown",
        builtInAnimations: modelData.builtInAnimations.length,
        externalAnimationUrls: animationUrls.length,
        externalAnimationsLoaded: sharedAnimations.length,
        mappedAnimations: Object.keys(mappedAnimations).length,
        animationTypes: Object.keys(mappedAnimations),
      });
    }
  }, [
    modelData,
    characterResource.name,
    animationUrls.length,
    sharedAnimations.length,
    mappedAnimations,
  ]);

  // 8) Final return
  return {
    ...animationControls,
    mappedAnimations,
    scene: modelData?.scene || null,
    isLoaded: !!modelData?.scene,
  };
};
