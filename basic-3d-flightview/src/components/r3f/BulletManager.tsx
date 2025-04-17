import * as THREE from 'three';
import { FlightViewControllerHandle } from 'vibe-starter-3d';
import { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bullet } from './Bullet';

interface BulletData {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  startPosition: THREE.Vector3;
}

interface BulletManagerProps {
  controllerRef: React.RefObject<FlightViewControllerHandle>;
}

let key = 0;

export function BulletManager({ controllerRef }: BulletManagerProps) {
  const [bullets, setBullets] = useState<BulletData[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentState = controllerRef.current;
      if (event.code === 'Space' && currentState) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(currentState.orientation);
        forward.normalize();

        const bulletSpeed = 200;
        const bulletVelocity = forward.clone().multiplyScalar(bulletSpeed);

        const startOffset = forward
          .clone()
          .multiplyScalar(1.5)
          .add(new THREE.Vector3(0, 0.5, 0));
        const bulletStartPosition = currentState.position.clone().add(startOffset);

        setBullets((prevBullets) => [
          ...prevBullets,
          {
            id: String(++key),
            position: bulletStartPosition.clone(),
            velocity: bulletVelocity,
            startPosition: bulletStartPosition.clone(),
          },
        ]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [controllerRef]);

  useFrame((_, delta) => {
    const travelDistanceThreshold = 200;
    setBullets((prevBullets) =>
      prevBullets
        .map((bullet) => ({
          ...bullet,
          position: bullet.position.clone().add(bullet.velocity.clone().multiplyScalar(delta)),
        }))
        .filter((bullet) => bullet.position.distanceTo(bullet.startPosition) < travelDistanceThreshold),
    );
  });

  return (
    <>
      {bullets.map((bullet) => (
        <Bullet key={bullet.id} position={bullet.position} />
      ))}
    </>
  );
}
