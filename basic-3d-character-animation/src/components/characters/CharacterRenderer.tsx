import React, { RefObject, Suspense } from "react";
import { AnimationConfigMap } from "../../types/animation";
import { useAnimationHandler } from "../../hooks/useAnimationHandler";
import { useCharacterResource } from "../../hooks/useCharacterResource";
import { CharacterResource } from "../../types/characterResource";
/**
 * CharacterRenderer component Props
 * Simplified interface that accepts CharacterResource
 */
export interface CharacterRendererProps<ActionType extends string> {
  /** Character resource containing model and animation information */
  characterResource: CharacterResource;
  /** Animation configuration map */
  animationConfigMap: Partial<AnimationConfigMap<ActionType>>;
  /** Reference to the current character action */
  currentActionRef: RefObject<ActionType | undefined>;
  /** Optional child components */
  children?: React.ReactNode;
}

/**
 * Character renderer component for 3D model animation support
 * Handles model loading, rendering, animation mapping and state management
 */
export const CharacterRenderer = <ActionType extends string>({
  characterResource,
  animationConfigMap,
  currentActionRef,
  children,
}: CharacterRendererProps<ActionType>) => {
  // Use the integrated character hook to load model and animations
  const { scene, actions, mixer, isLoaded } =
    useCharacterResource(characterResource);

  // Animation playback and transition management (using refs)
  useAnimationHandler(currentActionRef, animationConfigMap, { actions, mixer });

  // Don't render anything if the model isn't loaded yet
  if (!isLoaded || !scene) {
    return null;
  }

  return (
    <group>
      <Suspense fallback={null}>
        <primitive object={scene} />
        {children}
      </Suspense>
    </group>
  );
};
