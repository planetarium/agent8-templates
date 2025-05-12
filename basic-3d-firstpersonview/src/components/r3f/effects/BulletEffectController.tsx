import * as THREE from 'three';
import Bullet from './Bullet';
import MuzzleFlash from './MuzzleFlash';
import { Collider, InteractionGroups, RigidBody } from '@dimforge/rapier3d-compat';

const DEFAULT_SPEED = 100;
const DEFAULT_DURATION = 1000;
const DEFAULT_SCALE = 1;
const DEFAULT_FLASH_DURATION = 100;

interface BulletEffectControllerProps {
  config: { [key: string]: any };
  collisionGroups?: InteractionGroups;
  owner?: RigidBody;
  onHit?: (pos?: THREE.Vector3, rigidBody?: RigidBody, collider?: Collider) => void;
  onComplete?: () => void;
}

const parseConfig = (config: { [key: string]: any }) => {
  return {
    startPosition: new THREE.Vector3(...config.startPosition),
    direction: new THREE.Vector3(...config.direction),
    speed: (config.speed as number) || DEFAULT_SPEED,
    duration: (config.duration as number) || DEFAULT_DURATION,
    scale: (config.scale as number) || DEFAULT_SCALE,
    color: config.color,
    flashDuration: config.flashDuration === undefined ? DEFAULT_FLASH_DURATION : config.flashDuration,
  };
};

const BulletEffectController: React.FC<BulletEffectControllerProps> = ({ config, collisionGroups, owner, onHit, onComplete }) => {
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
        color={color}
        scale={scale}
        speed={speed}
        duration={duration}
        collisionGroups={collisionGroups}
        owner={owner}
        onHit={onHit}
        onComplete={onComplete}
      />
      {flashDuration > 0 && (
        <MuzzleFlash
          config={{
            position: calcStartPosition.toArray(),
            direction: direction.toArray(),
            duration: flashDuration,
          }}
        />
      )}
    </>
  );
};

export default BulletEffectController;
