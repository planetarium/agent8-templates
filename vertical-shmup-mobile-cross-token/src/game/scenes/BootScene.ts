import Phaser from 'phaser';
import Assets from '../../assets.json';
import { EventBus, EVENTS } from '../EventBus';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'BootScene' });

    this.load.on('progress', (value: number) => {
      EventBus.emit(EVENTS.BOOT_PROGRESS, { value });
    });

    // Load game assets
    this.load.image('player', Assets.characters.player.url);
    this.load.image('enemy', Assets.characters.enemy.url);
    this.load.image('boss', Assets.characters.boss.url);
    this.load.image('stardust', Assets.items.stardust.url);
    this.load.image('crystal', Assets.items.crystal.url);
    this.load.image('playerBullet', Assets.items.playerBullet.url);
    this.load.image('enemyBullet', Assets.items.enemyBullet.url);
    this.load.image('bg', Assets.backgrounds.space.url);
  }

  create() {
    EventBus.emit(EVENTS.BOOT_PROGRESS, { value: 1 });
    this.time.delayedCall(200, () => {
      this.scene.start('TitleScene');
    });
  }
}
