import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

export class GameOverScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { score: number; wave: number; petals: number; petalsPending: number }) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Background only — UI is handled by React
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0500, 0.65);

    // Save best score
    const best = parseInt(localStorage.getItem('mysticgarden_best') || '0', 10);
    if (data.score > best && data.score > 0) {
      localStorage.setItem('mysticgarden_best', String(data.score));
    }

    // Emit to React UI
    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'GameOverScene' });
    EventBus.emit(EVENTS.GAME_OVER, {
      score: data.score,
      wave: data.wave,
      petals: data.petals,
      petalsPending: data.petalsPending,
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  /** Called by React overlay to navigate to another scene properly */
  goToScene(key: string, payload?: object) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(key, payload);
    });
  }

  update() {
    if (this.bg) this.bg.tilePositionY -= 0.3;
  }
}
