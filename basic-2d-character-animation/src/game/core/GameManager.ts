export class GameManager {
  private static _instance: GameManager;

  private constructor() {}

  static get instance(): GameManager {
    if (!this._instance) {
      this._instance = new GameManager();
    }
    return this._instance;
  }
}
