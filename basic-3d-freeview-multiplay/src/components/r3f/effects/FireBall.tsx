import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, IntersectionEnterPayload } from '@react-three/rapier';

interface FireBallProps {
  startPosition: THREE.Vector3;
  direction: THREE.Vector3; // Normalized direction vector
  speed: number; // Distance traveled per second
  duration: number; // Lifespan (milliseconds)
  onHit?: (other: IntersectionEnterPayload, pos?: THREE.Vector3) => boolean; // Callback on collision
  onComplete?: () => void;
}

export const FireBall: React.FC<FireBallProps> = ({ startPosition, direction, speed, duration, onHit, onComplete }) => {
  const [destroyed, setDestroyed] = useState(false);
  const [trailReady, setTrailReady] = useState(false);

  const [trailKey, setTrailKey] = useState(0);
  // FireBall's "creation time"
  const startTime = useRef(Date.now());

  // RigidBody reference (Rapier object)
  const rigidRef = useRef(null);

  // Refs pointing to the inner Mesh & Light
  const outerRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  // Show Trail after skipping the first few frames
  const frameCountRef = useRef(0);

  // Update kinematic RigidBody position and effect every frame
  useFrame(() => {
    if (destroyed) return;

    frameCountRef.current++;
    // Example: Show Trail after 2-3 frames (or n frames)
    if (!trailReady && frameCountRef.current > 5) {
      setTrailReady(true);
      setTrailKey(trailKey + 1);
    }

    const elapsed = Date.now() - startTime.current;
    const seconds = elapsed / 1000;

    // // New position = initial position + direction * speed * elapsed time
    const currentPos = startPosition.clone().add(direction.clone().multiplyScalar(speed * seconds));

    // // Update Rapier Kinematic Body movement
    // Pass in the form of setNextKinematicTranslation({ x, y, z })
    rigidRef.current?.setNextKinematicTranslation({
      x: currentPos.x,
      y: currentPos.y,
      z: currentPos.z,
    });

    // Calculate fade out
    const fadeStart = duration - 400;
    const fadeElapsed = Math.max(elapsed - fadeStart, 0);
    const fadeProgress = THREE.MathUtils.clamp(fadeElapsed / 400, 0, 1);
    const opacityFactor = 1 - fadeProgress;

    // Flicker + Scale
    const flickerScale = 0.9 + Math.sin(elapsed * 0.02) * 0.1 + Math.random() * 0.05;
    if (outerRef.current) {
      outerRef.current.scale.setScalar(flickerScale);
    }
    if (coreRef.current) {
      coreRef.current.scale.setScalar(0.6 + Math.sin(elapsed * 0.04) * 0.1);
    }

    // Adjust Material opacity
    const outerMat = outerRef.current?.material as THREE.MeshBasicMaterial;
    const coreMat = coreRef.current?.material as THREE.MeshBasicMaterial;
    if (outerMat && coreMat) {
      outerMat.opacity = 0.8 * opacityFactor;
      coreMat.opacity = 1.0 * opacityFactor;
      outerMat.needsUpdate = true;
      coreMat.needsUpdate = true;
    }

    // Light intensity
    if (lightRef.current) {
      lightRef.current.intensity = (5 + Math.sin(elapsed * 0.03) * 2 + Math.random()) * opacityFactor;
    }

    // Destroy at the end of lifespan
    if (elapsed > duration) {
      setDestroyed(true);
      onComplete?.();
    }
  });

  // Don't render if destroyed
  if (destroyed) return null;

  return (
    <RigidBody
      ref={rigidRef}
      // Set Sensor collision mode
      type="kinematicPosition"
      colliders={false} // Shape defined by BallCollider below
      sensor={true} // Collision events only, no physical reaction
      // Collision (intersection) event
      onIntersectionEnter={(payload) => {
        // Called when FireBall intersects another RigidBody
        const translation = rigidRef.current?.translation();
        const hitPosition = translation ? new THREE.Vector3(translation.x, translation.y, translation.z) : undefined;
        if (onHit?.(payload, hitPosition)) {
          onComplete?.();
          setDestroyed(true);
        }
      }}
      // Set initial position
      position={[startPosition.x, startPosition.y, startPosition.z]}
      // Not affected by gravity, etc.
      gravityScale={0}
    >
      {/* FireBall collider (radius=0.4) */}
      <BallCollider args={[0.4]} />

      {/* Flame outer shell */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#ff3300" transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Center core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ffffcc" transparent opacity={1} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Point light */}
      <pointLight ref={lightRef} color="#ff6600" intensity={5} distance={8} decay={2} />
    </RigidBody>
  );
};
