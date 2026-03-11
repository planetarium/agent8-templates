import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

export class GameOverScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { score: number; wave: number; soulgems: number; soulgemsPending: number }) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Background only — UI is handled by React
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0510, 0.7);

    // Save best score
    const best = parseInt(localStorage.getItem('shadowdungeon_best') || '0', 10);
    if (data.score > best && data.score > 0) {
      localStorage.setItem('shadowdungeon_best', String(data.score));
    }

    // Emit to React UI
    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'GameOverScene' });
    EventBus.emit(EVENTS.GAME_OVER, {
      score: data.score,
      wave: data.wave,
      soulgems: data.soulgems,
      soulgemsPending: data.soulgemsPending,
    });

    this.cameras.main.fadeIn(400, 10, 5, 16);
  }

  /** Called by React overlay to navigate to another scene properly */
  goToScene(key: string, payload?: object) {
    this.cameras.main.fadeOut(300, 10, 5, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(key, payload);
    });
  }

  update() {
    if (this.bg) this.bg.tilePositionY -= 0.5;
  }
}
