import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys';
import knightConfig from '../../assets/sprite_characters/knight.json';

const knightKey = 'knight';
export class ExampleGameScene extends Scene {
  private cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private cross: Phaser.GameObjects.Graphics;
  private player: Phaser.Physics.Arcade.Sprite;
  private direction: { x: number; y: number } = { x: 0, y: 0 };
  private unitState = 'idle';
  private readonly speed = 100;

  constructor() {
    super(SceneKeys.Game);
  }

  preload() {
    this.load.spritesheet(knightKey, 'src/assets/sprite_characters/knight.png', {
      frameWidth: knightConfig.frame.width,
      frameHeight: knightConfig.frame.height,
    });
  }

  create() {
    this.cursorKeys = this.input.keyboard?.createCursorKeys();
    this.cross = this.add.graphics();
    this.cross.setDepth(100);
    this.cross.lineStyle(1, 0xff0000);

    this.createPlayer();
    this.drawCross(this.player.x, this.player.y + 10);
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(100, 200, knightKey);
    this.player.setOrigin(0.5, 0.6);
    const bodySize = { width: 60, height: 60 };
    this.player.setBodySize(bodySize.width, bodySize.height);
    this.player.setOffset(66, 76);

    for (const animKey in knightConfig.animations) {
      const animData = knightConfig.animations[animKey as keyof typeof knightConfig.animations];
      this.player.anims.create({
        key: animKey,
        frames: this.player.anims.generateFrameNumbers(knightKey, {
          start: animData.start,
          end: animData.end,
        }),
        frameRate: animData.frameRate,
        repeat: animData.repeat,
      });
    }

    this.player.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      (animation: Phaser.Animations.Animation) => {
        if (animation.key === 'attack') {
          this.unitState = 'idle';
          this.player.play('idle');
        }
      },
      this,
    );

    this.player.play({ key: 'idle' });
  }

  update() {
    this.performActions();
  }

  private performActions() {
    const cursorKeys = this.cursorKeys;
    if (!cursorKeys) return;

    if (this.unitState === 'attack') return;

    if (cursorKeys.space.isDown) {
      this.unitState = 'attack';
      this.player.play('attack');
      this.player.setVelocity(0, 0);
      return;
    }

    const isDown = cursorKeys.left.isDown || cursorKeys.right.isDown || cursorKeys.up.isDown || cursorKeys.down.isDown;
    if (isDown) {
      const direction = { x: 0, y: 0 };

      if (cursorKeys.left.isDown) {
        direction.x = -1;
      } else if (cursorKeys.right.isDown) {
        direction.x = 1;
      }

      if (cursorKeys.up.isDown) {
        direction.y = -1;
      } else if (cursorKeys.down.isDown) {
        direction.y = 1;
      }

      const normalizedDirection = new Phaser.Math.Vector2(direction.x, direction.y).normalize();
      this.direction.x = normalizedDirection.x;
      this.direction.y = normalizedDirection.y;
    } else {
      this.direction.x = 0;
      this.direction.y = 0;
    }

    const isMoving = this.direction.x !== 0 || this.direction.y !== 0;
    if (isMoving && this.unitState !== 'move') {
      this.unitState = 'move';
      this.player.play('move');
    } else if (!isMoving && this.unitState !== 'idle') {
      this.unitState = 'idle';
      this.player.play('idle');
    }

    this.player.setVelocity(this.direction.x * this.speed, this.direction.y * this.speed);
  }

  private drawCross(x: number, y: number, size = 10) {
    this.cross.clear();
    this.cross.lineStyle(1, 0x00ff00);
    this.cross.beginPath();
    // 가로 선
    this.cross.moveTo(x - size, y);
    this.cross.lineTo(x + size, y);
    // 세로 선
    this.cross.moveTo(x, y - size);
    this.cross.lineTo(x, y + size);
    this.cross.strokePath();
  }
}
