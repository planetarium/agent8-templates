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

    // Scrolling dungeon background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);

    // Dark overlay for atmosphere
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0510, 0.4);

    // Floating necromancer (decorative)
    const mage = this.add.image(W / 2, H * 0.48, 'player');
    mage.setDisplaySize(100, 100);
    mage.setDepth(2);

    this.tweens.add({
      targets: mage,
      y: H * 0.48 - 16,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Purple aura under character
    const aura = this.add.ellipse(W / 2, H * 0.48 + 42, 50, 18, 0x8800ff, 0.4).setDepth(1);
    this.tweens.add({
      targets: aura,
      displayWidth: 65,
      displayHeight: 24,
      alpha: 0.15,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Floating dust particles
    try {
      this.particles = this.add.particles(0, 0, undefined as any, {
        x: { min: 0, max: W },
        y: -10,
        lifespan: 5000,
        speedY: { min: 40, max: 120 },
        scale: { min: 0.2, max: 1.2 },
        alpha: { start: 0.8, end: 0 },
        tint: [0x8844ff, 0xaa66ff, 0x553399, 0xff6644],
        quantity: 1,
        frequency: 120,
      });
    } catch (_e) { /* particle system optional */ }

    this.cameras.main.fadeIn(500, 10, 5, 16);
  }

  update() {
    if (this.bg) this.bg.tilePositionY -= 0.5;
  }
}
