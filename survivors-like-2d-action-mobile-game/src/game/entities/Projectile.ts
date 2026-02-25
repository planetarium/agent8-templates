import Phaser from 'phaser';
import { GAME_CONFIG } from '../../config/gameConfig';

export interface ProjectileConfig {
  damage: number;
  speed: number;
  size: number;
  textureKey: string;
  tint?: number;
  lifetime?: number;
}

const DEFAULT_LIFETIME = 1500;

/**
 * Creates and fires a projectile toward the target.
 */
export function createProjectile(
  scene: Phaser.Scene,
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  config?: Partial<ProjectileConfig>,
  group?: Phaser.Physics.Arcade.Group
): Phaser.Physics.Arcade.Sprite {
  const { projectileDamage, projectileSpeed, projectileSize } = GAME_CONFIG.player;
  const cfg: ProjectileConfig = {
    damage: config?.damage ?? projectileDamage,
    speed: config?.speed ?? projectileSpeed,
    size: config?.size ?? projectileSize,
    textureKey: config?.textureKey ?? GAME_CONFIG.currency.spriteKey,
    tint: config?.tint,
    lifetime: config?.lifetime ?? DEFAULT_LIFETIME,
  };

  const proj = scene.physics.add.sprite(fromX, fromY, cfg.textureKey);
  proj.setDisplaySize(cfg.size, cfg.size);
  proj.setData('damage', cfg.damage);
  if (cfg.tint !== undefined) {
    proj.setTint(cfg.tint);
  } else {
    proj.setTint(0x00ffff);
  }

  // group이 있으면 먼저 추가 (velocity 리셋 방지)
  if (group) group.add(proj);

  const angle = Phaser.Math.Angle.Between(fromX, fromY, targetX, targetY);
  (proj.body as Phaser.Physics.Arcade.Body).setVelocity(
    Math.cos(angle) * cfg.speed,
    Math.sin(angle) * cfg.speed
  );

  scene.time.delayedCall(cfg.lifetime ?? DEFAULT_LIFETIME, () => {
    if (proj.active) proj.destroy();
  });

  return proj;
}
