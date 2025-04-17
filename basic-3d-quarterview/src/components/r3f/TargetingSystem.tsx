import { useRef, useState, useCallback } from 'react';
import { useGame } from 'vibe-starter-3d-ctrl';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';

interface TargetingSystemProps {
  targetObject: string | null;
  setTargetObject: (target: string | null) => void;
  targetPosition: Vector3 | null;
}

/**
 * TargetingSystem - Targeting system that works independently of terrain
 * Detects click positions in the game and sets movement points.
 */
export const TargetingSystem: React.FC<TargetingSystemProps> = ({ targetObject, setTargetObject, targetPosition }) => {
  const date = useRef(Date.now());
  const setMoveToPoint = useGame((state) => state.setMoveToPoint);

  // Click effect state variables
  const [clickEffect, setClickEffect] = useState(false);
  const [clickPosition, setClickPosition] = useState<Vector3 | null>(null);
  const [effectScale, setEffectScale] = useState(1);
  const effectRingRef = useRef<Mesh>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const attackTimeoutRef = useRef<number | null>(null);

  // Attack handling function
  const triggerAttack = useCallback(() => {
    if (isAttacking) return;

    // Start attack
    setIsAttacking(true);

    // Clear attack state and target after a certain time
    if (attackTimeoutRef.current) {
      clearTimeout(attackTimeoutRef.current);
    }

    attackTimeoutRef.current = window.setTimeout(() => {
      setIsAttacking(false);
      setTargetObject(null);
      console.log('Attack completed');
    }, 1000) as unknown as number;
  }, [isAttacking, setTargetObject]);

  // Click effect animation
  useFrame(() => {
    if (clickEffect && effectRingRef.current) {
      setEffectScale((prev) => {
        const newScale = prev - 0.04; // Slow shrinking speed
        if (newScale <= 0) {
          setClickEffect(false);
          return 1;
        }
        return newScale;
      });

      // Adjust circle size
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

  // New function to handle remotePlayer selection and fireball shooting
  const handleRemotePlayerSelection = (e: any) => {
    if (e.button === 2) {
      // Right-click
      const target = 'remotePlayer'; // Example target
      setTargetObject(target);
      console.log(`Target selected: ${target}`);

      // Fireball logic
      if (targetPosition) {
        console.log(`Firing fireball towards: ${targetPosition}`);
        // Implement fireball shooting logic here
      }
    }
  };

  return (
    <>
      {/* Minimal click effect circle */}
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
        onPointerOver={handleRemotePlayerSelection}
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
