import { GameScene } from './scenes/GameScene';
import { AUTO, Game, Types } from 'phaser';
import { PreloaderScene } from './scenes/PreloaderScene';
import { GameConstants } from './constants';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
  type: AUTO,
  width: GameConstants.width,
  height: GameConstants.height,
  parent: GameConstants.gameContainerId,
  backgroundColor: GameConstants.backgroundColor,
  scene: [PreloaderScene, GameScene],
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
    },
  },
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
