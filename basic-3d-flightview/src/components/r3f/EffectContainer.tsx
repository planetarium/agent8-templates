import { useCallback } from 'react';
import { useGameServer } from '@agent8/gameserver';
import * as THREE from 'three';
import { ActiveEffect, EffectType } from '../../types/effect';
import { useEffectStore, useActiveEffects } from '../../store/effectStore';
import { BulletEffectController } from './effects/BulletEffectController';
import { Collider, RigidBody } from '@dimforge/rapier3d-compat';
import { createExplosionEffectConfig, Explosion } from './effects/Explosion';
import { usePlayerStore } from '../../store/playerStore';

/**
 * Effect container component using Zustand store for effect management.
 */
export function EffectContainer() {
  // Call ALL hooks unconditionally at the top
  const { connected } = useGameServer();
  const { getPlayerRef } = usePlayerStore();

  // Get state and actions from the Zustand store
  const activeEffects = useActiveEffects();
  const addEffect = useEffectStore((state) => state.addEffect);
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
  const handleEffectHit = useCallback(
    (type: EffectType, pos?: THREE.Vector3, rigidBody?: RigidBody, collider?: Collider, sender?: string): boolean => {
      const targetAccount = rigidBody?.userData?.['account'];
      if (sender && targetAccount) {
        if (targetAccount === sender) return false;
      }

      if (pos && type === EffectType.BULLET) {
        addEffect(EffectType.EXPLOSION, undefined, createExplosionEffectConfig(pos, 0.5));
      }

      return true;
    },
    [addEffect],
  );

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
              owner={getPlayerRef(effect.sender)?.current}
              onHit={(pos, rigidBody, collider) => handleEffectHit(type, pos, rigidBody, collider, effect.sender)}
              onComplete={() => {
                handleEffectComplete(effect.key);
              }}
            />
          );
        case EffectType.EXPLOSION:
          return (
            <Explosion
              key={effect.key}
              config={effect.effectData.config}
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
    [handleEffectHit, handleEffectComplete, getPlayerRef],
  );

  // Now perform the conditional return/render AFTER all hooks have been called
  if (!connected) return null;

  // Render all active effects from the store
  return <>{activeEffects.map(renderEffect)}</>;
}
