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

    // Load all characters dynamically (key = assets.json key)
    Object.entries(Assets.characters).forEach(([key, asset]) => {
      this.load.image(key, (asset as { url: string }).url);
    });

    // Load all items dynamically (key = assets.json key)
    Object.entries(Assets.items).forEach(([key, asset]) => {
      this.load.image(key, (asset as { url: string }).url);
    });

    // Load background with fixed 'bg' key (GameScene references this key)
    const bgAsset = Object.values(Assets.backgrounds)[0] as { url: string } | undefined;
    if (bgAsset) this.load.image('bg', bgAsset.url);
  }

  create() {
    EventBus.emit(EVENTS.BOOT_PROGRESS, { value: 1 });
    this.time.delayedCall(200, () => {
      this.scene.start('TitleScene');
    });
  }
}
