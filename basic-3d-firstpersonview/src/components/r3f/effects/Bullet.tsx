import * as THREE from 'three';
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, useRapier, CollisionPayload } from '@react-three/rapier';
import { ActiveCollisionTypes, InteractionGroups } from '@dimforge/rapier3d-compat';
import { RigidBodyObject, RigidBodyObjectRef } from 'vibe-starter-3d';
import { RigidBodyObjectType } from '../../../constants/rigidBodyObjectType';

const DEFAULT_SIZE = new THREE.Vector3(0.5, 0.5, 1);

export interface BulletProps {
  startPosition: THREE.Vector3;
  direction: THREE.Vector3;
  color?: THREE.ColorRepresentation | undefined;
  scale?: number;
  speed: number;
  duration: number;
  collisionGroups?: InteractionGroups;
  owner?: RapierRigidBody;
  onHit?: (payload: CollisionPayload) => void;
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
  const active = useRef(true);
  const rigidBodyRef = useRef<RigidBodyObjectRef>(null);
  const freezed = useRef(false);
  const framesSinceFreezed = useRef(0);
  const { rapier, world } = useRapier();
  const normalizedDirection = direction.clone().normalize();
  const bulletGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
  const bulletMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 });
  const onCompleteRef = useRef(onComplete);
  const startTime = useRef(Date.now());

  // Bullet removal function
  const removeBullet = useCallback(() => {
    if (!active.current) return;

    active.current = false;
    onCompleteRef.current?.();
  }, [active]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useFrame((_, delta) => {
    if (!active.current) return;

    const elapsed = Date.now() - startTime.current;
    if (elapsed > duration) {
      removeBullet();
      return;
    }

    // skip update if bullet is freezed
    if (freezed.current) {
      framesSinceFreezed.current++;

      // If onTriggerEnter hasn't been called after 3 frames, unfreeze and continue checking
      if (framesSinceFreezed.current > 3) {
        console.warn('Bullet frozen too long, unfreezing to continue collision check');
        freezed.current = false;
        framesSinceFreezed.current = 0;
      }
      return;
    }

    const rigidBody = rigidBodyRef.current;
    if (!rigidBody || rigidBody.numColliders() === 0) return;

    const frameTravelDistance = speed * delta;
    const originVec = rigidBody.translation();
    const ray = new rapier.Ray(originVec, normalizedDirection);
    const bulletOwnCollider = rigidBody.collider(0);

    const hit = world.castRay(
      ray,
      frameTravelDistance,
      true, // solid
      undefined, // queryFlags
      collisionGroups, // groups
      bulletOwnCollider, // Exclude bullet's own collider
      owner, // Exclude the owner (firer)
    );

    if (hit) {
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      const hitPointVec3 = new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z);

      freezed.current = true;
      framesSinceFreezed.current = 0;
      rigidBody.setTranslation(hitPointVec3, true);
      return;
    } else {
      // No hit, continue with velocity based movement (handled by RigidBody component)
      const curVec3 = new THREE.Vector3(originVec.x, originVec.y, originVec.z);
      const nextPosition = curVec3.addScaledVector(normalizedDirection, frameTravelDistance);
      rigidBody.setTranslation(nextPosition, true);
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
    <RigidBodyObject
      ref={rigidBodyRef}
      userData={{
        type: RigidBodyObjectType.BULLET,
      }}
      type="kinematicVelocity"
      position={[startPosition.x, startPosition.y, startPosition.z]}
      rotation={bulletRotation}
      sensor={true}
      scale={scale}
      colliders={'cuboid'}
      collisionGroups={collisionGroups ?? 0xffffffff}
      activeCollisionTypes={ActiveCollisionTypes.ALL}
      onTriggerEnter={(payload: CollisionPayload) => {
        freezed.current = false;
        framesSinceFreezed.current = 0;
        if (owner && owner.handle === payload.other.rigidBody.handle) {
          return;
        }

        onHit?.(payload);
        removeBullet();
      }}
      name="bullet"
    >
      <mesh geometry={bulletGeometry} material={bulletMaterial} scale={DEFAULT_SIZE} />
    </RigidBodyObject>
  );
};

export default Bullet;
