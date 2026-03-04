import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

export class WalletScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'WalletScene' });
  }

  create(_data: { gems?: number }) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);
    this.bg.setAlpha(0.35);
    this.add.rectangle(W / 2, H / 2, W, H, 0x050508, 0.85);

    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'WalletScene' });
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  openCrossRamp() {
    EventBus.emit(EVENTS.OPEN_CROSS_RAMP);
  }

  goBackToTitle() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TitleScene');
    });
  }

  update() {
    if (this.bg) this.bg.tilePositionX += 0.3;
  }
}
