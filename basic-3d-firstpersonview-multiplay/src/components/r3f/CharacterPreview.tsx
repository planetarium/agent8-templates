import React, { useRef, useMemo } from 'react';
import { CharacterState } from '../../constants/character';
import Assets from '../../assets.json';
import { Vector3 } from 'three';
import { AnimationConfig, AnimationConfigMap } from 'vibe-starter-3d';
import { CharacterResource, CharacterRenderer, CharacterRendererRef } from 'vibe-starter-3d';

/**
 * Character Preview component props
 */
interface CharacterPreviewProps {
  /** Character key to use */
  characterUrl: string;
}

/**
 * Simplified animation configuration for IDLE state only
 */
const idleAnimationConfigMap: Partial<AnimationConfigMap<CharacterState>> = {
  [CharacterState.IDLE]: {
    animationType: 'IDLE',
    loop: true,
  } as AnimationConfig,
};

/**
 * CharacterPreview component for rendering a static character preview in IDLE state
 */
export const CharacterPreview: React.FC<CharacterPreviewProps> = ({ characterUrl }) => {
  // State is always IDLE for preview
  const currentStateRef = useRef<CharacterState>(CharacterState.IDLE);

  // Define the character resource with IDLE animation only (or all if needed by CharacterRenderer)
  const characterResource: CharacterResource = useMemo(() => {
    // Include only necessary animations if CharacterRenderer allows, otherwise keep all
    return {
      name: characterUrl,
      url: characterUrl,
      animations: {
        IDLE: Assets.animations.idle.url, // Only IDLE animation might be strictly necessary
      },
    };
  }, [characterUrl]);

  const characterRendererRef = useRef<CharacterRendererRef>(null);
  const characterHeight = useMemo(() => {
    const vector3 = new Vector3();
    characterRendererRef.current?.boundingBox?.getSize(vector3);
    return vector3.y;
  }, [characterRendererRef.current]);

  return (
    <group position={[0, -(characterHeight || 0) / 2, 0]}>
      <CharacterRenderer
        characterResource={characterResource}
        animationConfigMap={idleAnimationConfigMap} // Use simplified config
        currentActionRef={currentStateRef} // Always IDLE
        ref={characterRendererRef}
      />
    </group>
  );
};
