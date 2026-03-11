import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

export class TitleScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private bgDark!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'TitleScene' });

    // Deep ocean dark base
    this.bgDark = this.add.rectangle(W / 2, H / 2, W, H, 0x020810).setDepth(0);

    // Scrolling ocean background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);
    this.bg.setDepth(1);
    this.bg.setAlpha(0.8);

    // Ambient bubbles in the title scene
    try {
      this.add.particles(0, 0, undefined as any, {
        x: { min: 0, max: W },
        y: H + 10,
        lifespan: 5000,
        speedY: { min: -120, max: -60 },
        speedX: { min: -20, max: 20 },
        scale: { min: 0.05, max: 0.4 },
        alpha: { start: 0.8, end: 0 },
        tint: [0x00ffee, 0x44aaff, 0x88ddff, 0xaaffee],
        quantity: 1,
        frequency: 100,
        blendMode: Phaser.BlendModes.ADD,
      });
    } catch (_e) { /* particle system optional */ }

    // Floating player submarine (decorative)
    const sub = this.add.image(W / 2, H * 0.47, 'player');
    sub.setDisplaySize(80, 80);
    sub.setDepth(3);

    this.tweens.add({
      targets: sub,
      y: H * 0.47 - 12,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Engine wake glow
    const wake = this.add.ellipse(W / 2, H * 0.47 + 42, 24, 10, 0x00aadd, 0.45).setDepth(2);
    this.tweens.add({
      targets: wake,
      displayWidth: 34,
      displayHeight: 14,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Bioluminescent accent circles (coral-like decorations)
    const accents = [
      { x: W * 0.12, y: H * 0.85, r: 18, color: 0x00ffcc },
      { x: W * 0.88, y: H * 0.82, r: 14, color: 0xaa44ff },
      { x: W * 0.06, y: H * 0.65, r: 10, color: 0x44aaff },
      { x: W * 0.94, y: H * 0.7, r: 12, color: 0x00ffaa },
    ];
    accents.forEach(a => {
      const circle = this.add.circle(a.x, a.y, a.r, a.color, 0.25).setDepth(2);
      circle.setStrokeStyle(1.5, a.color, 0.6);
      this.tweens.add({
        targets: circle,
        alpha: 0.05,
        duration: 1200 + Math.random() * 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.cameras.main.fadeIn(600, 0, 8, 20);
  }

  update() {
    if (this.bg) this.bg.tilePositionY -= 0.7;
  }
}
