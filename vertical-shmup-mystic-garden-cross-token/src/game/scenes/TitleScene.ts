import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

export class TitleScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'TitleScene' });

    // Scrolling forest background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);

    // Floating guardian flower (purely decorative)
    const flower = this.add.image(W / 2, H * 0.48, 'player');
    flower.setDisplaySize(90, 90);
    flower.setDepth(2);

    this.tweens.add({
      targets: flower,
      y: H * 0.48 - 14,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Magic aura underneath flower
    const glow = this.add.ellipse(W / 2, H * 0.48 + 38, 35, 16, 0x44aa22, 0.4).setDepth(1);
    this.tweens.add({
      targets: glow,
      displayWidth: 50,
      displayHeight: 22,
      alpha: 0.15,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Firefly particles
    try {
      this.particles = this.add.particles(0, 0, undefined as any, {
        x: { min: 0, max: W },
        y: -10,
        lifespan: 5000,
        speedY: { min: 40, max: 120 },
        speedX: { min: -20, max: 20 },
        scale: { min: 0.3, max: 1.2 },
        alpha: { start: 1, end: 0 },
        tint: [0xaaff44, 0xffdd66, 0x88ff88],
        quantity: 1,
        frequency: 120,
      });
    } catch (_e) { /* particle system optional */ }

    this.cameras.main.fadeIn(500, 5, 15, 5);
  }

  update() {
    if (this.bg) this.bg.tilePositionY -= 0.5;
  }
}
