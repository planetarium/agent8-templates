import { useCallback, useEffect } from 'react';
import { useGameServer, useRoomState } from '@agent8/gameserver';
import { Vector3 } from 'three';
import { FireBallEffectController } from './effects/FireBallEffectController';
import { ActiveEffect, EffectType } from '../../types/effect';
import { useEffectStore, useActiveEffects } from '../../store/effectStore';
import { IntersectionEnterPayload } from '@react-three/rapier';
import { createExplosionEffectConfig, Explosion } from './effects/Explosion';

/**
 * Effect container component using Zustand store for effect management.
 */
export function EffectContainer() {
  const { connected, server, account } = useGameServer();
  if (!connected) return null;
  const { roomId } = useRoomState();

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
  const handleFireBallEffectHit = useCallback((other: IntersectionEnterPayload, pos?: Vector3, sender?: string) => {
    if (sender) {
      if (other.rigidBody?.userData?.['account'] === sender) return false;
    }

    if (pos) {
      addEffect(EffectType.EXPLOSION, undefined, createExplosionEffectConfig(pos, 0.5));
    }
    return true;
  }, []);

  // Subscribe to effect events from other players
  useEffect(() => {
    if (!roomId || !server) return;

    const unsubscribe = server.onRoomMessage(roomId, 'effect-event', (message) => {
      // Ignore messages sent by self
      if (message.sender === server.account) return;

      console.log('[EffectContainer] Received effect event:', message);

      // Add the received effect using the store action
      addEffect(message.type, message.sender, message.config);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, server, addEffect, account]);

  // Function to render individual effects based on their type
  const renderEffect = useCallback(
    (effect: ActiveEffect) => {
      const type = effect.effectData.type;

      switch (type) {
        case EffectType.FIREBALL:
          return (
            <FireBallEffectController
              key={effect.key}
              config={effect.effectData.config}
              onHit={(other, pos) => {
                return handleFireBallEffectHit(other, pos, effect.sender);
              }}
              onComplete={() => {
                handleEffectComplete(effect.key);
                console.log('[EffectContainer] FireBall effect complete:', effect.key);
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
                console.log('[EffectContainer] Explosion effect complete:', effect.key);
              }}
            />
          );
        // Add cases for other effect types here
        default:
          console.warn(`[EffectContainer] Unknown effect type: ${type}`);
          return null;
      }
    },
    [handleFireBallEffectHit, handleEffectComplete],
  );

  // Render all active effects from the store
  return <>{activeEffects.map(renderEffect)}</>;
}
