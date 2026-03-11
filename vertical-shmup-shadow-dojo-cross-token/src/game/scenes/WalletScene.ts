import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

export class WalletScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'WalletScene' });
  }

  create(_data: { souls?: number }) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Background only — UI is handled by React
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0008, 0.85);

    // Emit scene change to React
    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'WalletScene' });

    this.cameras.main.fadeIn(300, 10, 0, 8);
  }

  /** Called by React overlay to open CROSS Mini Hub */
  openCrossRamp() {
    EventBus.emit(EVENTS.OPEN_CROSS_RAMP);
  }

  /** Called by React overlay to go back to title */
  goBackToTitle() {
    this.cameras.main.fadeOut(300, 10, 0, 8);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TitleScene');
    });
  }

  update() {
    if (this.bg) this.bg.tilePositionY -= 0.5;
  }
}
