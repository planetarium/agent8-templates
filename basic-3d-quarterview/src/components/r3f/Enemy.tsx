import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { CharacterState, DEFAULT_HEIGHT } from '../../constants/character';
import { AnimationConfig, AnimationConfigMap, CharacterRenderer, CharacterResource } from 'vibe-starter-3d';
import { CharacterRendererRef } from 'vibe-starter-3d/dist/src/components/renderers/CharacterRenderer';
import Assets from '../../assets.json';

/**
 * Enemy ref interface
 */
export interface EnemyRef {
  /** Bounding box of the character model */
  boundingBox: THREE.Box3 | null;
  /** Mesh for outline highlighting */
  mesh: THREE.Group | null;
  /** Whether the enemy is hovered */
  isHovered: boolean;
}

/**
 * Enemy props
 */
interface EnemyProps {
  /** Initial position of the enemy */
  position?: [number, number, number];
  /** Initial state for the enemy */
  initState?: CharacterState;
  /** Target height for the enemy model */
  targetHeight?: number;
  /** Character model to use */
  characterKey?: string;
  /** Enemy unique ID */
  id?: string;
  /** Callback when enemy is hovered */
  onHover?: (id: string, isHovered: boolean) => void;
}

/**
 * Hook for handling enemy animations
 */
function useEnemyAnimations(currentStateRef: React.MutableRefObject<CharacterState>) {
  const handleAnimationComplete = React.useCallback(
    (state: CharacterState) => {
      switch (state) {
        case CharacterState.PUNCH:
          currentStateRef.current = CharacterState.IDLE;
          break;
        case CharacterState.HIT:
          currentStateRef.current = CharacterState.IDLE;
          break;
        default:
          break;
      }
    },
    [currentStateRef],
  );

  // Animation configuration
  const animationConfigMap: Partial<AnimationConfigMap<CharacterState>> = useMemo(
    () => ({
      [CharacterState.IDLE]: {
        animationType: 'IDLE',
        loop: true,
      } as AnimationConfig,
      [CharacterState.WALK]: {
        animationType: 'WALK',
        loop: true,
      } as AnimationConfig,
      [CharacterState.RUN]: {
        animationType: 'RUN',
        loop: true,
      } as AnimationConfig,
      [CharacterState.PUNCH]: {
        animationType: 'PUNCH',
        loop: false,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.PUNCH),
      } as AnimationConfig,
      [CharacterState.HIT]: {
        animationType: 'HIT',
        loop: false,
        clampWhenFinished: true,
        onComplete: () => handleAnimationComplete(CharacterState.HIT),
      } as AnimationConfig,
      [CharacterState.DIE]: {
        animationType: 'DIE',
        loop: false,
        duration: 10,
        clampWhenFinished: true,
      } as AnimationConfig,
    }),
    [handleAnimationComplete],
  );

  return { animationConfigMap };
}

/**
 * Enemy component that renders a static enemy character
 */
export const Enemy: React.FC<EnemyProps> = ({
  position = [5, 0, 5],
  initState = CharacterState.IDLE,
  targetHeight = DEFAULT_HEIGHT,
  characterKey = 'zombie',
  id = 'enemy-1',
  onHover,
}) => {
  const currentStateRef = useRef<CharacterState>(initState);
  const { animationConfigMap } = useEnemyAnimations(currentStateRef);
  const characterRendererRef = useRef<CharacterRendererRef>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Define the character resource with all animations
  const characterResource: CharacterResource = useMemo(() => {
    const characterData = (Assets.characters as Record<string, { url: string }>)[characterKey];
    const characterUrl = characterData?.url || Assets.characters['zombie'].url;

    return {
      name: 'Enemy Character',
      url: characterUrl,
      animations: {
        IDLE: Assets.animations.idle.url,
        WALK: Assets.animations.walk.url,
        RUN: Assets.animations.run.url,
        PUNCH: Assets.animations.punch.url,
        HIT: Assets.animations.hit.url,
        DIE: Assets.animations.die.url,
      },
    };
  }, [characterKey]);

  // Handle hover events
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsHovered(true);
    if (onHover) onHover(id, true);
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsHovered(false);
    if (onHover) onHover(id, false);
  };

  return (
    <group position={position} ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} userData={{ type: 'enemy', id }}>
      <CharacterRenderer
        ref={characterRendererRef}
        characterResource={characterResource}
        animationConfigMap={animationConfigMap}
        currentActionRef={currentStateRef}
        targetHeight={targetHeight}
      />
    </group>
  );
};
