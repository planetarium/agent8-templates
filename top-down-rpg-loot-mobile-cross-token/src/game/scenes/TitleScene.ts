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

    // Dungeon floor background (slowly panning)
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);

    // Dark vignette overlay to create dungeon atmosphere
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55);
    overlay.setDepth(1);

    // Floating hero (purely decorative)
    const hero = this.add.image(W / 2, H * 0.42, 'player');
    hero.setDisplaySize(100, 100);
    hero.setDepth(3);

    this.tweens.add({
      targets: hero,
      y: H * 0.42 - 12,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Glow ring under hero
    const glow = this.add.ellipse(W / 2, H * 0.42 + 45, 70, 20, 0xaa55ff, 0.3).setDepth(2);
    this.tweens.add({
      targets: glow,
      displayWidth: 90,
      displayHeight: 26,
      alpha: 0.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Floating gem particles
    try {
      this.add.particles(0, 0, undefined as any, {
        x: { min: 0, max: W },
        y: H + 10,
        lifespan: 3000,
        speedY: { min: -120, max: -60 },
        scale: { min: 0.3, max: 1.2 },
        alpha: { start: 0.8, end: 0 },
        tint: [0x44ff88, 0xaa44ff, 0xffcc00],
        quantity: 1,
        frequency: 120,
      });
    } catch (_e) { /* particle system optional */ }

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update() {
    if (this.bg) this.bg.tilePositionX += 0.3;
  }
}
