import Phaser from "phaser";
import { SpriteCharacter } from "../characters/SpriteCharacter";
import Assets from "../../assets.json";
export class MainScene extends Phaser.Scene {
  private player: SpriteCharacter;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private ground: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    this.physics.world.createDebugGraphic();
    this.load.spritesheet(
      "2dbasic",
      Assets.sprites["2dbasic"].url,
      {
        frameWidth: Assets.sprites["2dbasic"].metadata?.frameWidth ?? 111,
        frameHeight: Assets.sprites["2dbasic"].metadata?.frameHeight ?? 83,
      }
    );
  }

  create() {
    this.physics.world.setBounds(
      0,
      0,
      this.sys.game.canvas.width,
      this.sys.game.canvas.height
    );

    this.cameras.main.setBackgroundColor("#87CEEB");

    // 지면 생성
    this.ground = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - 30,
      this.cameras.main.width,
      60,
      0x00ff00
    );
    this.physics.add.existing(this.ground, true); // true는 정적(static) 물리 객체로 설정

    this.player = new SpriteCharacter(
      this,
      this.cameras.main.width / 2,
      this.ground.y - this.ground.height,
      "2dbasic"
    );

    // 플레이어와 지면의 충돌 설정
    this.physics.add.collider(this.player, this.ground);

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    // 플레이어 업데이트
    this.player.update(this.cursors);
  }
}
