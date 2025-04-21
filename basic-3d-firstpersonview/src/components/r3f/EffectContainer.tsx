import { useCallback } from 'react';
import { useGameServer } from '@agent8/gameserver';
import * as THREE from 'three';
import { ActiveEffect, EffectType } from '../../types/effect';
import { useEffectStore, useActiveEffects } from '../../store/effectStore';
import { IntersectionEnterPayload } from '@react-three/rapier';
import { BulletEffectController } from './effects/BulletEffectController';

/**
 * Effect container component using Zustand store for effect management.
 */
export function EffectContainer() {
  // Call ALL hooks unconditionally at the top
  const { connected } = useGameServer();
  const activeEffects = useActiveEffects();
  const removeEffect = useEffectStore((state) => state.removeEffect);

  // Callback to remove completed effects using the store action
  const handleEffectComplete = useCallback(
    (keyToRemove: number) => {
      console.log('[EffectContainer] Effect complete:', keyToRemove);
      removeEffect(keyToRemove);
    },
    [removeEffect],
  );

  // Handler for when an effect hits something (logic might be needed here)
  const handleBulletffectHit = useCallback((other: IntersectionEnterPayload, pos?: THREE.Vector3, sender?: string) => {
    if (sender) {
      if (other.rigidBody?.userData?.['account'] === sender) return false;
    }

    console.log('Bullet effect hit:', other, pos, sender);
    return true;
  }, []);

  // Function to render individual effects based on their type
  const renderEffect = useCallback(
    (effect: ActiveEffect) => {
      const type = effect.effectData.type;

      switch (type) {
        case EffectType.BULLET:
          return (
            <BulletEffectController
              key={effect.key}
              config={effect.effectData.config}
              onHit={(other, pos) => handleBulletffectHit(other, pos, effect.sender)}
              onComplete={() => {
                handleEffectComplete(effect.key);
              }}
            />
          );
        // Add cases for other effect types here
        default:
          console.warn(`[EffectContainer] Unknown effect type: ${type}`);
          return null;
      }
    },
    [handleBulletffectHit, handleEffectComplete],
  );

  // Now perform the conditional return/render AFTER all hooks have been called
  if (!connected) return null;

  // Render all active effects from the store
  return <>{activeEffects.map(renderEffect)}</>;
}
