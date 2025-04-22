import * as THREE from 'three';
import { Bullet } from './Bullet';
import { MuzzleFlash } from './MuzzleFlash';
import { IntersectionEnterPayload } from '@react-three/rapier';
import { toVector3, toVector3Array } from 'vibe-starter-3d';
type Primitive = string | number | boolean | null | undefined | symbol | bigint;
type PrimitiveOrArray = Primitive | Primitive[];

const DEFAULT_SPEED = 100;
const DEFAULT_DURATION = 2000;
const DEFAULT_MUZZLE_FLASH_DURATION = 100;
const DEFAULT_SCALE = 1;
const DEFAULT_FLASH_DURATION = 100;

export interface BulletEffectControllerProps {
  config: { [key: string]: PrimitiveOrArray };
  onHit?: (other: IntersectionEnterPayload, pos?: THREE.Vector3) => boolean;
  onComplete?: () => void;
}

export interface BulletEffectConfig {
  startPosition: THREE.Vector3;
  direction: THREE.Vector3;
  speed?: number;
  duration?: number;
  scale?: number;
  color?: string;
  flashDuration?: number;
}

export const createBulletEffectConfig = (config: BulletEffectConfig): { [key: string]: PrimitiveOrArray } => {
  return {
    startPosition: toVector3Array(config.startPosition),
    direction: toVector3Array(config.direction),
    speed: config.speed || DEFAULT_SPEED,
    duration: config.duration || DEFAULT_DURATION,
    scale: config.scale || DEFAULT_SCALE,
    color: config.color,
    flashDuration: config.flashDuration || DEFAULT_MUZZLE_FLASH_DURATION,
  };
};

const parseConfig = (config: { [key: string]: any }) => {
  return {
    startPosition: toVector3(config.startPosition),
    direction: toVector3(config.direction),
    speed: (config.speed as number) || DEFAULT_SPEED,
    duration: (config.duration as number) || DEFAULT_DURATION,
    scale: (config.scale as number) || DEFAULT_SCALE,
    color: config.color,
    flashDuration: (config.flashDuration as number) || DEFAULT_FLASH_DURATION,
  };
};

export const BulletEffectController: React.FC<BulletEffectControllerProps> = ({ config, onHit, onComplete }) => {
  const { startPosition, direction, speed, duration, scale, flashDuration, color } = parseConfig(config);
  if (!startPosition || !direction || !speed || !duration) {
    console.error('[BulletEffectController] Missing required config properties');
    onComplete?.();
    return null;
  }

  const calcStartPosition = startPosition.clone().add(direction.clone().multiplyScalar(1));

  return (
    <>
      <Bullet
        startPosition={calcStartPosition}
        direction={direction}
        scale={scale}
        speed={speed}
        duration={duration}
        color={color}
        onHit={onHit}
        onComplete={onComplete}
      />
      {
        <MuzzleFlash
          config={{
            position: toVector3Array(calcStartPosition),
            direction: toVector3Array(direction),
            duration: flashDuration,
          }}
        />
      }
    </>
  );
};
