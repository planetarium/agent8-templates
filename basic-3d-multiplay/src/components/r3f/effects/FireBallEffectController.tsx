import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { FireBall } from './FireBall';
import { IntersectionEnterPayload } from '@react-three/rapier';

type Primitive = string | number | boolean | null | undefined | symbol | bigint;
type PrimitiveOrArray = Primitive | Primitive[];

const DEFAULT_SPEED = 10;
const DEFAULT_DURATION = 2000;

interface FireBallEffectControllerProps {
  config: { [key: string]: PrimitiveOrArray };
  onHit: (other: IntersectionEnterPayload, pos?: THREE.Vector3) => boolean;
  onComplete: () => void;
}

// Utility to convert THREE.Vector3 to array (needed for store/server)
const vecToArray = (vec: THREE.Vector3): [number, number, number] => {
  return [vec.x, vec.y, vec.z];
};

// Utility to convert Vector3 array to THREE.Vector3 (needed for rendering)
const arrayToVec = (arr?: [number, number, number]): THREE.Vector3 => {
  if (!arr) {
    console.error('Missing required config properties');
    return new THREE.Vector3();
  }
  return new THREE.Vector3(arr[0], arr[1], arr[2]);
};

export const createFireBallEffectConfig = (
  startPosition: THREE.Vector3,
  direction: THREE.Vector3,
  speed?: number,
  duration?: number,
): { [key: string]: PrimitiveOrArray } => {
  return {
    startPosition: vecToArray(startPosition),
    direction: vecToArray(direction),
    speed: speed || DEFAULT_SPEED,
    duration: duration || DEFAULT_DURATION,
  };
};

const parseConfig = (config: { [key: string]: any }) => {
  return {
    startPosition: arrayToVec(config.startPosition),
    direction: arrayToVec(config.direction),
    speed: config.speed || DEFAULT_SPEED,
    duration: config.duration || DEFAULT_DURATION,
  };
};

export const FireBallEffectController: React.FC<FireBallEffectControllerProps> = ({ config, onHit, onComplete }) => {
  const [spawned, setSpawned] = useState(false);

  const { startPosition, direction, speed, duration } = parseConfig(config);
  if (!startPosition || !direction || !speed || !duration) {
    console.error('[FireBallEffectController] Missing required config properties');
    onComplete?.();
    return null;
  }

  const caclcStartPosition = startPosition.clone().add(direction.clone().multiplyScalar(1));

  useEffect(() => {
    setSpawned(true);
  }, []);

  if (!spawned) return null;

  return (
    <>
      <FireBall startPosition={caclcStartPosition} direction={direction} speed={speed} duration={duration} onHit={onHit} onComplete={onComplete} />
    </>
  );
};
