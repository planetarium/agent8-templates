import Phaser from 'phaser';
import Assets from '../../assets.json';
import { gameEvents } from '../../App';
import { getImageUrl } from '../../utils/getAssetUrl';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  preload() {
    const assets = Assets as { images: Record<string, { url?: string }> };
    const bgUrl = getImageUrl(assets, 'background');
    if (bgUrl) this.load.image('bg', bgUrl);
  }

  create() {
    const width = this.sys.game.canvas.width;
    const height = this.sys.game.canvas.height;

    // Background only - UI is handled by React
    const bg = this.add.image(width / 2, height / 2, 'bg');
    bg.setDisplaySize(width, height);

    // Listen for the start event from React UI
    const startListener = () => {
      gameEvents.removeEventListener('startGameFromUI', startListener);
      this.scene.start('MainScene');
    };

    gameEvents.addEventListener('startGameFromUI', startListener);
    
    // Tell React UI we are in Title state
    gameEvents.dispatchEvent(new Event('showTitle'));
  }
}
