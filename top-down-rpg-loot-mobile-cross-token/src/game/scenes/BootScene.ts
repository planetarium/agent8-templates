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
    this.load.image('gem', Assets.items.gem.url);
    this.load.image('rareGem', Assets.items.rareGem.url);
    this.load.image('epicGem', Assets.items.epicGem.url);
    this.load.image('playerBullet', Assets.items.playerBullet.url);
    this.load.image('bg', Assets.backgrounds.dungeon.url);
  }

  create() {
    EventBus.emit(EVENTS.BOOT_PROGRESS, { value: 1 });
    this.time.delayedCall(200, () => {
      this.scene.start('TitleScene');
    });
  }
}
