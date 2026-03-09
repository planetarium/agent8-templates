import Phaser from 'phaser';
import { GAME_CONFIG } from '../../config/gameConfig';

interface SpritesheetAnim {
  start: number;
  end: number;
}

interface SpritesheetDef {
  animations?: Record<string, SpritesheetAnim>;
}

interface AssetsLike {
  spritesheets: Record<string, SpritesheetDef>;
}

/**
 * Creates the player sprite and sets up initial state.
 */
export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  assets: AssetsLike
): Phaser.Physics.Arcade.Sprite {
  const { spriteKey, playerSize } = GAME_CONFIG.player;

  const player = scene.physics.add.sprite(x, y, spriteKey);
  player.setDisplaySize(playerSize, playerSize);
  player.play(`${spriteKey}_walk`);

  return player;
}

/**
 * Registers player animations for the given sprite key.
 */
export function registerPlayerAnimations(
  scene: Phaser.Scene,
  spriteKey: string,
  assets: AssetsLike
): void {
  const spritesheet = assets.spritesheets[spriteKey];
  if (!spritesheet?.animations) return;

  const walk = spritesheet.animations.walk;
  const dead = spritesheet.animations.dead;

  if (walk) {
    scene.anims.create({
      key: `${spriteKey}_walk`,
      frames: scene.anims.generateFrameNumbers(spriteKey, {
        start: walk.start,
        end: walk.end,
      }),
      frameRate: 10,
      repeat: -1,
    });
  }

  if (dead) {
    scene.anims.create({
      key: `${spriteKey}_dead`,
      frames: scene.anims.generateFrameNumbers(spriteKey, {
        start: dead.start,
        end: dead.end,
      }),
      frameRate: 5,
      repeat: 0,
    });
  }
}
