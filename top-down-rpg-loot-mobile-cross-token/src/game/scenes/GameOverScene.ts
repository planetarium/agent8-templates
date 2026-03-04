import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

export class GameOverScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { score: number; floor: number; gems: number; gemsPending: number }) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);
    this.bg.setAlpha(0.4);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72);

    const best = parseInt(localStorage.getItem('crystaldungeon_best') || '0', 10);
    if (data.score > best && data.score > 0) {
      localStorage.setItem('crystaldungeon_best', String(data.score));
    }

    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'GameOverScene' });
    EventBus.emit(EVENTS.GAME_OVER, {
      score: data.score,
      floor: data.floor,
      gems: data.gems,
      gemsPending: data.gemsPending,
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  goToScene(key: string, payload?: object) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(key, payload);
    });
  }

  update() {
    if (this.bg) this.bg.tilePositionX += 0.3;
  }
}
