import { Scene } from 'phaser';
import { CharacterKeys, SceneKeys } from '../constants';
import { CharacterConfig } from '../../types';

const knightKey = 'knight';
export class GameScene extends Scene {
  private cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private player: Phaser.Physics.Arcade.Sprite;
  private direction: { x: number; y: number } = { x: 0, y: 0 };
  private unitState = 'idle';
  private readonly speed = 100;
  private characterConfig: CharacterConfig;

  constructor() {
    super(SceneKeys.Game);
  }

  preload() {
    this.characterConfig = this.cache.json.get(CharacterKeys.knight);
    this.load.spritesheet(CharacterKeys.knight, this.characterConfig.imageUrl, {
      frameWidth: this.characterConfig.frame.width,
      frameHeight: this.characterConfig.frame.height,
    });
  }

  create() {
    this.cursorKeys = this.input.keyboard?.createCursorKeys();
    this.createPlayer();
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(100, 200, CharacterKeys.knight);
    this.characterConfig = this.cache.json.get(CharacterKeys.knight);
    this.player.setOrigin(this.characterConfig.origin.x, this.characterConfig.origin.y);
    this.player.setBodySize(this.characterConfig.body.size.width, this.characterConfig.body.size.height);
    this.player.setOffset(this.characterConfig.body.offset.x, this.characterConfig.body.offset.y);

    for (const animKey in this.characterConfig.animations) {
      const animData = this.characterConfig.animations[animKey as keyof typeof this.characterConfig.animations];
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

    if (isMoving && this.characterConfig.direction) {
      this.player.setFlipX(this.direction.x < 0);
    }

    this.player.setVelocity(this.direction.x * this.speed, this.direction.y * this.speed);
  }
}
