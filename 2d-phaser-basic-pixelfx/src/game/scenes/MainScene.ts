import Phaser from 'phaser';
import Assets from '../../assets.json';
export class MainScene extends Phaser.Scene {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private ground: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {}

  create() {
    this.physics.world.setBounds(0, 0, this.sys.game.canvas.width, this.sys.game.canvas.height);

    this.cameras.main.setBackgroundColor('#87CEEB');

    this.ground = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height - 30, this.cameras.main.width, 60, 0x00ff00);
    this.physics.add.existing(this.ground, true); // true는 정적(static) 물리 객체로 설정
  }

  update() {}
}
