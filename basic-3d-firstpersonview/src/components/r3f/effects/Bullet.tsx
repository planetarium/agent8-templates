import * as THREE from 'three';
import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, IntersectionEnterPayload } from '@react-three/rapier';
import { CollisionGroup } from 'vibe-starter-3d';
import { collisionGroups } from 'vibe-starter-3d';
import { ActiveCollisionTypes } from '@dimforge/rapier3d-compat';

const DEFAULT_SIZE = new THREE.Vector3(0.5, 0.5, 1);
const DEFAULT_MEMBERSHIP_COLLISION_GROUP = CollisionGroup.Projectile;
const DEFAULT_EXCLUDE_COLLISION_GROUP = [];

export interface BulletProps {
  startPosition: THREE.Vector3;
  direction: THREE.Vector3;
  color?: THREE.ColorRepresentation | undefined;
  scale?: number;
  speed: number;
  duration: number;
  onHit?: (other: IntersectionEnterPayload, pos?: THREE.Vector3) => boolean; // Callback on collision
  onComplete?: () => void;
}

export const Bullet: React.FC<BulletProps> = ({ startPosition, direction, color = 'orange', scale = 1, speed, duration, onHit, onComplete }) => {
  const [active, setActive] = useState(true);
  const rigidRef = useRef(null);
  const timeRef = useRef(0);
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

  const createCollisionGroups = useMemo(() => {
    return collisionGroups(DEFAULT_MEMBERSHIP_COLLISION_GROUP, DEFAULT_EXCLUDE_COLLISION_GROUP);
  }, []);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset the timer when the component mounts
    timeRef.current = 0;
    startTime.current = Date.now();
    setActive(true);

    // Automatically remove bullet after the specified duration
    const timer = setTimeout(() => {
      removeBullet();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, removeBullet]);

  useFrame(() => {
    if (!active || !rigidRef.current) return;

    const elapsed = Date.now() - startTime.current;
    // // Destroy when lifetime ends (backup check)
    if (elapsed > duration) {
      removeBullet();
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

  // Calculate actual bullet size (base geometry × scale)
  const actualBulletSize = useMemo(() => {
    return {
      x: bulletGeometry.parameters.width * DEFAULT_SIZE.x,
      y: bulletGeometry.parameters.height * DEFAULT_SIZE.y,
      z: bulletGeometry.parameters.depth * DEFAULT_SIZE.z,
    };
  }, [bulletGeometry.parameters]);

  // Don't render if the bullet has been removed
  if (!active) return null;

  return (
    <RigidBody
      ref={rigidRef}
      type="dynamic"
      position={[startPosition.x, startPosition.y, startPosition.z]}
      linearVelocity={normalizedDirection.clone().multiplyScalar(speed).toArray()}
      colliders={false}
      sensor={true}
      rotation={bulletRotation}
      activeCollisionTypes={ActiveCollisionTypes.ALL}
      onIntersectionEnter={(payload) => {
        const translation = rigidRef.current?.translation();
        const hitPosition = translation ? new THREE.Vector3(translation.x, translation.y, translation.z) : undefined;
        if (onHit) {
          if (onHit(payload, hitPosition)) {
            removeBullet();
          }
        } else {
          removeBullet();
        }
      }}
      gravityScale={0}
      collisionGroups={createCollisionGroups}
    >
      <group scale={scale}>
        {/* CuboidCollider for bullet collision - considers both base geometry size and scale */}
        <CuboidCollider args={[actualBulletSize.x / 2, actualBulletSize.y / 2, actualBulletSize.z / 2]} />

        <mesh geometry={bulletGeometry} material={bulletMaterial} scale={DEFAULT_SIZE} />
      </group>
    </RigidBody>
  );
};
