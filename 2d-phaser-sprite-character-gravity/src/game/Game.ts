import Phaser from "phaser";
import { MainScene } from "./scenes/MainScene";

export const createGame = (parent: string) => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: parent,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 2000 },
        debug: false,
      },
    },
    scene: [MainScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  return new Phaser.Game(config);
};
