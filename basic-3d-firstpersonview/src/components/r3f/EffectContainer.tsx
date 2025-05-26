import { useCallback } from 'react';
import { useGameServer } from '@agent8/gameserver';
import * as THREE from 'three';
import { ActiveEffect, EffectType } from '../../types';
import { useEffectStore, useActiveEffects } from '../../stores/effectStore';
import { usePlayerStore } from '../../stores/playerStore';
import { createExplosionEffectConfig } from '../../utils/effectUtils';
import Explosion from './effects/Explosion';
import BulletEffectController from './effects/BulletEffectController';
import { CollisionPayload } from '@react-three/rapier';

/**
 * Effect container component using Zustand store for effect management.
 */
function EffectContainer() {
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
      removeEffect(keyToRemove);
    },
    [removeEffect],
  );

  // Handler for when an effect hits something (logic might be needed here)
  const handleEffectHit = useCallback(
    (type: EffectType, payload: CollisionPayload, sender?: string): boolean => {
      const otherAccount = payload.other.rigidBody?.userData?.['account'];
      if (sender && otherAccount) {
        if (otherAccount === sender) return false;
      }

      if (type === EffectType.BULLET) {
        const hitPoint = payload.target.collider.translation();
        addEffect(EffectType.EXPLOSION, undefined, createExplosionEffectConfig(new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z), 0.1));
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
              onHit={(payload) => handleEffectHit(type, payload, effect.sender)}
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

export default EffectContainer;
