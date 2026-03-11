import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

export class TitleScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'TitleScene' });

    // Scrolling dark dojo background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);

    // Dark overlay for mood
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0008, 0.45);

    // Floating ninja (purely decorative)
    const ninja = this.add.image(W / 2, H * 0.48, 'player');
    ninja.setDisplaySize(90, 90);
    ninja.setDepth(2);

    this.tweens.add({
      targets: ninja,
      y: H * 0.48 - 14,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Shadow glow underneath ninja
    const glow = this.add.ellipse(W / 2, H * 0.48 + 38, 34, 12, 0x880044, 0.45).setDepth(1);
    this.tweens.add({
      targets: glow,
      displayWidth: 44,
      displayHeight: 18,
      alpha: 0.15,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Particle embers
    try {
      this.add.particles(0, 0, undefined as any, {
        x: { min: 0, max: W },
        y: H + 10,
        lifespan: 5000,
        speedY: { min: -60, max: -140 },
        scale: { min: 0.2, max: 1.2 },
        alpha: { start: 0.8, end: 0 },
        tint: [0xff4400, 0xff6622, 0xcc0033, 0x880044],
        quantity: 1,
        frequency: 120,
      });
    } catch (_e) { /* particle system optional */ }

    this.cameras.main.fadeIn(500, 10, 0, 8);
  }

  update() {
    if (this.bg) this.bg.tilePositionY -= 0.6;
  }
}
