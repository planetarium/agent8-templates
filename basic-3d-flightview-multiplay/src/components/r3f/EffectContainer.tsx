import { useCallback, useEffect } from 'react';
import { useGameServer, useRoomState } from '@agent8/gameserver';
import * as THREE from 'three';
import { ActiveEffect, EffectType } from '../../types/effect';
import { useEffectStore, useActiveEffects } from '../../store/effectStore';
import { IntersectionEnterPayload } from '@react-three/rapier';
import { BulletEffectController } from './effects/BulletEffectController';
import { createExplosionEffectConfig, Explosion } from './effects/Explosion';

/**
 * Effect container component using Zustand store for effect management.
 */
export function EffectContainer() {
  // Call ALL hooks unconditionally at the top
  const { connected, server, account } = useGameServer();
  const { roomId } = useRoomState();

  // Get state and actions from the Zustand store
  const activeEffects = useActiveEffects();
  const addEffect = useEffectStore((state) => state.addEffect);
  const removeEffect = useEffectStore((state) => state.removeEffect);

  // Function to send damage to the server
  const sendDamageToServer = useCallback(
    async (targetAccount: string, damageAmount: number) => {
      if (!server) return;
      try {
        await server.remoteFunction('applyDamage', [targetAccount, damageAmount]);
      } catch (error) {
        console.error(`Failed to send damage:`, error);
      }
    },
    [server], // Dependency on server object
  );

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
    let targetAccount = other.rigidBody?.userData?.['account'];
    if (sender && targetAccount) {
      if (targetAccount === sender) return false;
      
      if (sender === account) {
        sendDamageToServer(targetAccount, 30);
      }
    }

    if (pos) {
      addEffect(EffectType.EXPLOSION, undefined, createExplosionEffectConfig(pos, 0.5));
    }

    return true;
  }, []);

  // Subscribe to effect events from other players
  useEffect(() => {
    if (!roomId || !server || !connected) return;

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
  }, [connected,server, account, roomId, addEffect]);

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
    [handleBulletffectHit, handleEffectComplete],
  );

  // Render all active effects from the store
  return <>{activeEffects.map(renderEffect)}</>;
}
