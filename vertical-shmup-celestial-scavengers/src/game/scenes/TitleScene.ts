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

    // Scrolling starfield background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);

    // Floating player ship (purely decorative)
    const ship = this.add.image(W / 2, H * 0.48, 'player');
    ship.setDisplaySize(90, 90);
    ship.setDepth(2);

    this.tweens.add({
      targets: ship,
      y: H * 0.48 - 14,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Engine glow underneath ship
    const glow = this.add.ellipse(W / 2, H * 0.48 + 38, 30, 14, 0x0088ff, 0.5).setDepth(1);
    this.tweens.add({
      targets: glow,
      displayWidth: 40,
      displayHeight: 20,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Particle stars
    try {
      this.stars = this.add.particles(0, 0, undefined as any, {
        x: { min: 0, max: W },
        y: -10,
        lifespan: 4000,
        speedY: { min: 80, max: 200 },
        scale: { min: 0.3, max: 1.5 },
        alpha: { start: 1, end: 0 },
        tint: [0xffffff, 0x88aaff, 0xffeeaa],
        quantity: 1,
        frequency: 80,
      });
    } catch (_e) { /* particle system optional */ }

    this.cameras.main.fadeIn(500, 0, 0, 20);
  }

  update() {
    if (this.bg) this.bg.tilePositionY -= 0.8;
  }
}
