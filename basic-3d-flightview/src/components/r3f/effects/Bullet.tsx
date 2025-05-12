import * as THREE from 'three';
import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { Collider, InteractionGroups, RigidBody } from '@dimforge/rapier3d-compat';

const DEFAULT_SIZE = new THREE.Vector3(0.5, 0.5, 1);

interface BulletProps {
  startPosition: THREE.Vector3;
  direction: THREE.Vector3;
  color?: THREE.ColorRepresentation | undefined;
  scale?: number;
  speed: number;
  duration: number;
  collisionGroups?: InteractionGroups;
  owner?: RigidBody;
  onHit?: (pos?: THREE.Vector3, rigidBody?: RigidBody, collider?: Collider) => void;
  onComplete?: () => void;
}

const Bullet: React.FC<BulletProps> = ({
  startPosition,
  direction,
  color = 'orange',
  scale = 1,
  speed,
  duration,
  collisionGroups,
  owner,
  onHit,
  onComplete,
}) => {
  const [active, setActive] = useState(true);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const { rapier, world } = useRapier();
  const normalizedDirection = direction.clone().normalize();
  const bulletGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
  const bulletMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 });
  const onCompleteRef = useRef(onComplete);
  const startTime = useRef(Date.now());

  // Bullet removal function
  const removeBullet = useCallback(() => {
    if (active) {
      setActive(false);
      if (onCompleteRef.current) onCompleteRef.current();
    }
  }, [active]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset the timer when the component mounts
    timeRef.current = 0;
    startTime.current = Date.now();
    setActive(true);
  }, [setActive]);

  useFrame((_, delta) => {
    if (!active) return;

    const elapsed = Date.now() - startTime.current;
    // // Destroy when lifetime ends (backup check)
    if (elapsed > duration) {
      removeBullet();
      return;
    }

    const group = groupRef.current;
    if (!group) return;

    // Calculate distance to travel in this frame
    const frameTravelDistance = speed * delta;
    // Use current mesh position as the origin for the ray
    const origin = group.position;

    const ray = new rapier.Ray(origin, normalizedDirection);

    const hit = world.castRay(ray, frameTravelDistance, true, undefined, collisionGroups, undefined, owner);

    if (hit) {
      // Calculate hit point
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      const hitPointVec3 = new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z);
      const hitCollider = hit.collider;
      const hitRigidBody = hitCollider.parent();

      // Move group to exact hit point
      group.position.copy(hitPointVec3);

      onHit?.(hitPointVec3, hitRigidBody, hitCollider);
      onComplete?.();
      return;
    } else {
      // No hit, advance the bullet's position
      const nextPosition = origin.clone().addScaledVector(normalizedDirection, frameTravelDistance);
      group.position.copy(nextPosition);
    }
  });

  // Calculate rotation quaternion in the firing direction
  const bulletQuaternion = useMemo(() => {
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalizedDirection);
    return quaternion;
  }, [normalizedDirection]);

  // Calculate rotation & position for RigidBody
  const bulletRotation = useMemo(() => {
    return new THREE.Euler().setFromQuaternion(bulletQuaternion);
  }, [bulletQuaternion]);

  // Don't render if the bullet has been removed
  if (!active) return null;

  return (
    <group ref={groupRef} scale={scale} position={[startPosition.x, startPosition.y, startPosition.z]} rotation={bulletRotation}>
      <mesh geometry={bulletGeometry} material={bulletMaterial} scale={DEFAULT_SIZE} />
    </group>
  );
};

export default Bullet;
