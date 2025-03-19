import { Scene } from 'phaser';
import { CharacterConfigUrls, CharacterKeys, SceneKeys } from '../constants';

export class PreloaderScene extends Scene {
  constructor() {
    super(SceneKeys.Preloader);
  }

  preload() {
    this.load.json(CharacterKeys.knight, CharacterConfigUrls.medievalKnight);
  }

  create() {
    this.scene.start(SceneKeys.Game);
  }
}
