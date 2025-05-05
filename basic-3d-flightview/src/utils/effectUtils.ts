import * as THREE from 'three';
import { toVector3Array } from 'vibe-starter-3d';
import { BulletEffectConfig } from '../components/r3f/effects/BulletEffectController';

export const createBulletEffectConfig = (config: BulletEffectConfig): { [key: string]: any } => {
  return {
    startPosition: config.startPosition.toArray(),
    direction: config.direction.toArray(),
    speed: config.speed || 100,
    duration: config.duration || 1000,
    scale: config.scale || 1,
    color: config.color,
    flashDuration: config.flashDuration === undefined ? 100 : config.flashDuration,
  };
};

export const createExplosionEffectConfig = (position: THREE.Vector3, scale?: number): { [key: string]: any } => {
  return {
    position: toVector3Array(position),
    scale: scale || 1,
  };
};
