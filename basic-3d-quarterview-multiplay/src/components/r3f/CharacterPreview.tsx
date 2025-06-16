import React, { useRef, useMemo } from 'react';
import { CharacterState } from '../../constants/character';
import Assets from '../../assets.json';
import { AnimationConfigMap } from 'vibe-starter-3d';
import { CharacterRenderer } from 'vibe-starter-3d';

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
const idleAnimationConfigMap: AnimationConfigMap = {
  [CharacterState.IDLE]: {
    url: Assets.animations.idle.url,
    loop: true,
  },
};

/**
 * CharacterPreview component for rendering a static character preview in IDLE state
 */
const CharacterPreview: React.FC<CharacterPreviewProps> = ({ characterUrl }) => {
  // State is always IDLE for preview
  const currentStateRef = useRef<CharacterState>(CharacterState.IDLE);

  return (
    <group position={[0, -0.5, 0]}>
      <CharacterRenderer
        url={characterUrl}
        animationConfigMap={idleAnimationConfigMap} // Use simplified config
        currentAnimationRef={currentStateRef} // Always IDLE
      />
    </group>
  );
};

export default CharacterPreview;
