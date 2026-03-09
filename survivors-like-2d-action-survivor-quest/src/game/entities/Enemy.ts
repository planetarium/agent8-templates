import Phaser from 'phaser';
import type { EnemyType } from '../../config/enemyTypes';

/**
 * Creates an enemy sprite with the given type config.
 */
export function createEnemy(
  scene: Phaser.Scene,
  x: number,
  y: number,
  enemyType: EnemyType,
  playerLevel: number
): Phaser.Physics.Arcade.Sprite {
  const hp = enemyType.hp + Math.floor(playerLevel / 2);
  const enemy = scene.physics.add.sprite(x, y, enemyType.spriteKey);
  enemy.setDisplaySize(enemyType.size, enemyType.size);
  enemy.play(enemyType.animKey);
  enemy.setData('hp', hp);
  enemy.setData('enemyType', enemyType);
  if (enemyType.tint !== undefined) {
    enemy.setTint(enemyType.tint);
  }
  return enemy;
}

/**
 * Updates enemy movement based on behavior type.
 */
export function updateEnemyBehavior(
  scene: Phaser.Scene,
  enemy: Phaser.Physics.Arcade.Sprite,
  player: Phaser.Physics.Arcade.Sprite
): void {
  if (!enemy.active || !enemy.body) return;

  const enemyType = enemy.getData('enemyType') as EnemyType | undefined;
  if (!enemyType) return;

  let moveSpeed = enemyType.speed;

  switch (enemyType.behavior) {
    case 'chase':
      scene.physics.moveToObject(enemy, player, moveSpeed);
      break;
    case 'swarm':
      scene.physics.moveToObject(enemy, player, moveSpeed);
      break;
    case 'tank':
      scene.physics.moveToObject(enemy, player, moveSpeed);
      break;
    case 'charge':
      scene.physics.moveToObject(enemy, player, moveSpeed);
      break;
    case 'ranged':
      scene.physics.moveToObject(enemy, player, moveSpeed * 0.5);
      break;
    default:
      scene.physics.moveToObject(enemy, player, moveSpeed);
  }

  if (enemy.body.velocity.x > 0) enemy.setFlipX(false);
  else if (enemy.body.velocity.x < 0) enemy.setFlipX(true);
}
