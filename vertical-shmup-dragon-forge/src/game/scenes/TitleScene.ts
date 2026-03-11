import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

export class TitleScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private stars: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'TitleScene' });

    // Scrolling volcanic background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);

    // Floating player dragon (decorative)
    const ship = this.add.image(W / 2, H * 0.48, 'player');
    ship.setDisplaySize(96, 96);
    ship.setDepth(2);

    this.tweens.add({
      targets: ship,
      y: H * 0.48 - 16,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Engine glow underneath dragon
    const glow = this.add.ellipse(W / 2, H * 0.48 + 40, 30, 14, 0xff6600, 0.5).setDepth(1);
    this.tweens.add({
      targets: glow,
      displayWidth: 42,
      displayHeight: 22,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Ember particles floating upward
    try {
      this.stars = this.add.particles(0, 0, undefined as any, {
        x: { min: 0, max: W },
        y: H + 10,
        lifespan: 4000,
        speedY: { min: -120, max: -60 },
        speedX: { min: -15, max: 15 },
        scale: { min: 0.3, max: 1.2 },
        alpha: { start: 1, end: 0 },
        tint: [0xff6600, 0xff8800, 0xffaa00, 0xff4400],
        quantity: 1,
        frequency: 100,
      });
    } catch (_e) { /* particle system optional */ }

    this.cameras.main.fadeIn(500, 0, 0, 20);
  }

  update() {
    if (this.bg) this.bg.tilePositionY -= 0.8;
  }
}
