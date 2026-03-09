import Phaser from 'phaser';
import { gameEvents } from '../../App';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    // Listen for the restart event from React UI
    const restartListener = () => {
      gameEvents.removeEventListener('restartGameFromUI', restartListener);
      this.scene.start('TitleScene');
    };

    gameEvents.addEventListener('restartGameFromUI', restartListener);
    
    // Tell React UI we are in GameOver state
    gameEvents.dispatchEvent(new Event('showGameOver'));
  }
}
