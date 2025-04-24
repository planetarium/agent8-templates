import * as THREE from 'three';
import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { Collider, RigidBody } from '@dimforge/rapier3d-compat';
import { CollisionGroup, collisionGroups } from 'vibe-starter-3d';

const DEFAULT_SIZE = new THREE.Vector3(0.5, 0.5, 1);
const DEFAULT_MEMBERSHIP_COLLISION_GROUP = CollisionGroup.Projectile;
const DEFAULT_EXCLUDE_COLLISION_GROUP = [CollisionGroup.LocalPlayer];

export interface BulletProps {
  startPosition: THREE.Vector3;
  direction: THREE.Vector3;
  color?: THREE.ColorRepresentation | undefined;
  scale?: number;
  speed: number;
  duration: number;
  onHit?: (pos?: THREE.Vector3, rigidBody?: RigidBody, collider?: Collider) => boolean; // Callback on collision
  onComplete?: () => void;
}

export const Bullet: React.FC<BulletProps> = ({ startPosition, direction, color = 'orange', scale = 1, speed, duration, onHit, onComplete }) => {
  const [active, setActive] = useState(true);
  const groupRef = useRef<THREE.Group>(null);
  const rigidRef = useRef(null);
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
  });

  useFrame((_, delta) => {
    //if (!active || !rigidRef.current) return;
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

    const hit = world.castRay(ray, frameTravelDistance, true, undefined, createCollisionGroups);

    if (hit) {
      // Calculate hit point
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      const hitPointVec3 = new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z);
      const hitCollider = hit.collider;
      const hitRigidBody = hitCollider.parent();

      // Log hit
      if (hitRigidBody?.userData?.['account']) {
        console.log('jin Raycast Hit Account:', hitRigidBody.userData);
      } else {
        console.log('jin Raycast Hit Other:', hitRigidBody?.userData);
      }

      // Move group to exact hit point
      group.position.copy(hitPointVec3);

      // Call onHit callback
      let shouldRemove = true; // Default to remove on hit
      if (onHit) {
        shouldRemove = onHit(hitPointVec3, hitRigidBody, hitCollider); // Check if the hit handler wants the bullet to persist
      }

      // If the bullet should be removed (hit occurred and onHit returned true/undefined)
      if (shouldRemove) {
        onComplete?.(); // Call completion callback
        return; // Exit useFrame early
      }
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
    // <RigidBody
    //   ref={rigidRef}
    //   type="dynamic"
    //   position={[startPosition.x, startPosition.y, startPosition.z]}
    //   linearVelocity={normalizedDirection.clone().multiplyScalar(speed).toArray()}
    //   colliders={false}
    //   sensor={true}
    //   rotation={bulletRotation}
    //   activeCollisionTypes={ActiveCollisionTypes.ALL}
    //   onIntersectionEnter={(payload) => {
    //     const translation = rigidRef.current?.translation();
    //     const hitPosition = translation ? new THREE.Vector3(translation.x, translation.y, translation.z) : undefined;
    //     if (onHit) {
    //       if (onHit(payload, hitPosition)) {
    //         removeBullet();
    //       }
    //     } else {
    //       removeBullet();
    //     }
    //   }}
    //   gravityScale={0}
    //   collisionGroups={createCollisionGroups}
    // >
    //   <group scale={scale}>
    //     {/* CuboidCollider for bullet collision - considers both base geometry size and scale */}
    //     <CuboidCollider args={[actualBulletSize.x / 2, actualBulletSize.y / 2, actualBulletSize.z / 2]} />

    //     <mesh geometry={bulletGeometry} material={bulletMaterial} scale={DEFAULT_SIZE} />
    //   </group>
    // </RigidBody>
    <group ref={groupRef} scale={scale} position={[startPosition.x, startPosition.y, startPosition.z]} rotation={bulletRotation}>
      <mesh geometry={bulletGeometry} material={bulletMaterial} scale={DEFAULT_SIZE} />
    </group>
  );
};
