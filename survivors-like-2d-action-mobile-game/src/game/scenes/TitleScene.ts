import Phaser from 'phaser';
import Assets from '../../assets.json';
import { gameEvents } from '../../App';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  preload() {
    this.load.image('bg', Assets.images.background.url);
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
