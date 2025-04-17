import { useRef, useState, useCallback } from 'react';
import { useGame } from 'vibe-starter-3d-ctrl';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import { useEffectStore } from '../../store/effectStore';
import { useGameServer } from '@agent8/gameserver';

/**
 * TargetingSystem - Targeting system that works independently of terrain
 * Detects click positions in the game and sets movement points.
 */
export const TargetingSystem = () => {
  const date = useRef(Date.now());
  const setMoveToPoint = useGame((state) => state.setMoveToPoint);
  const { server, account } = useGameServer();

  // Click effect state variables
  const [clickEffect, setClickEffect] = useState(false);
  const [clickPosition, setClickPosition] = useState<Vector3 | null>(null);
  const [effectScale, setEffectScale] = useState(1);
  const effectRingRef = useRef<Mesh>(null);

  // Targeting state management
  const [targetObject, setTargetObject] = useState<string | null>(null);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const attackTimeoutRef = useRef<number | null>(null);

  // Get effect addition function from effect store
  const addEffect = useEffectStore((state) => state.addEffect);

  // Attack handling function
  const triggerAttack = useCallback(() => {
    if (isAttacking || !targetObject || !targetPosition) return;

    // Start attack
    setIsAttacking(true);

    // Add fireball effect
    if (account) {
      addEffect('FIREBALL', account, {
        position: [targetPosition.x, targetPosition.y, targetPosition.z],
        target: targetObject,
      });

      // Send effect event to server
      if (server) {
        try {
          server.remoteFunction('sendEffectEvent', [
            'FIREBALL',
            {
              position: [targetPosition.x, targetPosition.y, targetPosition.z],
              target: targetObject,
            },
          ]);
        } catch (error) {
          console.error('Failed to send effect event:', error);
        }
      }
    }

    // Reset attack state and target after a certain time
    if (attackTimeoutRef.current) {
      clearTimeout(attackTimeoutRef.current);
    }

    attackTimeoutRef.current = window.setTimeout(() => {
      setIsAttacking(false);
      setTargetObject(null);
      setTargetPosition(null);
      console.log('Attack completed');
    }, 1000) as unknown as number;
  }, [isAttacking, targetObject, targetPosition, account, addEffect, server]);

  // Click effect animation
  useFrame(() => {
    if (clickEffect && effectRingRef.current) {
      setEffectScale((prev) => {
        const newScale = prev - 0.04; // Slowly shrink
        if (newScale <= 0) {
          setClickEffect(false);
          return 1;
        }
        return newScale;
      });

      // Adjust ring size
      effectRingRef.current.scale.x = effectScale;
      effectRingRef.current.scale.y = effectScale;
    }

    // Handle target attack
    if (targetObject && targetPosition && !isAttacking) {
      // Move to target position
      setMoveToPoint(targetPosition);

      // Show attack effect
      setClickPosition(targetPosition);
      setEffectScale(1);
      setClickEffect(true);

      // Trigger attack
      triggerAttack();
    }
  });

  const handlePointerDown = (e: any) => {
    // Process right-click only (0: left-click, 2: right-click)
    if (e.button === 2) {
      date.current = Date.now();
    }
    // Prevent default event
    e.preventDefault();
  };

  const handlePointerUp = (e: any) => {
    // Process right-click only
    if (e.button === 2 && Date.now() - date.current < 200) {
      const point = e.point as Vector3;

      // Set movement point
      setMoveToPoint(point);

      // Show click effect
      setClickPosition(new Vector3(point.x, point.y, point.z));
      setEffectScale(1);
      setClickEffect(true);
    }
    // Prevent default event
    e.preventDefault();
  };

  const handleContextMenu = (e: any) => {
    // Prevent right-click context menu
    e.preventDefault();
  };

  // Remote player selection and fireball shooting handler
  const handleRemotePlayerSelection = (e: any) => {
    if (e.object && e.object.userData && e.object.userData.account) {
      // Check remote player object
      const targetId = e.object.userData.account;

      if (targetId !== account) {
        // Set target position
        setTargetPosition(new Vector3(e.point.x, e.point.y, e.point.z));
        // Set target object
        setTargetObject(targetId);
        console.log(`Target selected: ${targetId}`);
      }
    }
  };

  return (
    <>
      {/* Click effect circle */}
      {clickEffect && clickPosition && (
        <mesh ref={effectRingRef} position={[clickPosition.x, clickPosition.y + 0.01, clickPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35]} /> {/* Thin ring */}
          <meshBasicMaterial color={targetObject ? '#ff5555' : '#e0e0e0'} transparent opacity={0.4 * effectScale} />
        </mesh>
      )}

      {/* Transparent interaction layer */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onContextMenu={handleContextMenu}
        onClick={handleRemotePlayerSelection}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]} // Slightly above the floor
        visible={false} // Set to invisible
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
};
