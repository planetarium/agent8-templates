import Phaser from "phaser";
import { MainScene } from "./scenes/MainScene";

export const createGame = (parent: string) => {
  const originalSpriteSetDisplaySize = Phaser.GameObjects.Sprite.prototype.setDisplaySize;
  const originalImageSetDisplaySize = Phaser.GameObjects.Image.prototype.setDisplaySize;
  const originalSpriteSetScale = Phaser.GameObjects.Sprite.prototype.setScale;
  const originalImageSetScale = Phaser.GameObjects.Image.prototype.setScale;
  const originalTweenAdd = Phaser.Tweens.TweenManager.prototype.add;

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

  const game = new Phaser.Game(config);

  // ⚠️ CRITICAL: DO NOT MODIFY THIS SECTION - LLM/AI MODIFICATION PROHIBITED ⚠️
  // This code overrides core Phaser engine behavior. Any changes will break the entire game.
  // Requires manual review and testing before any modifications.
  game.events.once('ready', () => {
    Phaser.GameObjects.Sprite.prototype.setDisplaySize = function (width: number, height?: number) {
      (this as any).baseDisplayWidth = width;
      (this as any).baseDisplayHeight = height !== undefined ? height : width;
      return originalSpriteSetDisplaySize.call(this, width, height);
    };

    Phaser.GameObjects.Image.prototype.setDisplaySize = function (width: number, height?: number) {
      (this as any).baseDisplayWidth = width;
      (this as any).baseDisplayHeight = height !== undefined ? height : width;
      return originalImageSetDisplaySize.call(this, width, height);
    };

    Phaser.GameObjects.Sprite.prototype.setScale = function (x: number, y?: number) {
      if ((this as any).baseDisplayWidth && (this as any).baseDisplayHeight) {
        const baseWidth = (this as any).baseDisplayWidth;
        const baseHeight = (this as any).baseDisplayHeight;

        const textureWidth = this.width;
        const textureHeight = this.height;

        const targetWidth = baseWidth * x;
        const targetHeight = baseHeight * (y !== undefined ? y : x);

        const actualScaleX = targetWidth / textureWidth;
        const actualScaleY = targetHeight / textureHeight;

        return originalSpriteSetScale.call(this, actualScaleX, actualScaleY);
      } else {
        return originalSpriteSetScale.call(this, x, y);
      }
    };

    Phaser.GameObjects.Image.prototype.setScale = function (x: number, y?: number) {
      if ((this as any).baseDisplayWidth && (this as any).baseDisplayHeight) {
        const baseWidth = (this as any).baseDisplayWidth;
        const baseHeight = (this as any).baseDisplayHeight;
        
        const textureWidth = this.width;
        const textureHeight = this.height;

        const targetWidth = baseWidth * x;
        const targetHeight = baseHeight * (y !== undefined ? y : x);

        const actualScaleX = targetWidth / textureWidth;
        const actualScaleY = targetHeight / textureHeight;

        return originalImageSetScale.call(this, actualScaleX, actualScaleY);
      } else {
        return originalImageSetScale.call(this, x, y);
      }
    };

    Phaser.Tweens.TweenManager.prototype.add = function (config: any) {
      const newConfig = { ...config };

      if (config.scaleX !== undefined || config.scaleY !== undefined) {
        const targets = Array.isArray(config.targets) ? config.targets : [config.targets];
        targets.forEach((target: any) => {
          if (target instanceof Phaser.GameObjects.Sprite || target instanceof Phaser.GameObjects.Image) {
            if (config.scaleX !== undefined) {
              const baseWidth = (target as any).baseDisplayWidth || target.displayWidth;
              newConfig.displayWidth = baseWidth * config.scaleX;
              delete newConfig.scaleX;
            }
            if (config.scaleY !== undefined) {
              const baseHeight = (target as any).baseDisplayHeight || target.displayHeight;
              newConfig.displayHeight = baseHeight * config.scaleY;
              delete newConfig.scaleY;
            }
          }
        });
      }
      return originalTweenAdd.call(this, newConfig);
    };
  });
  // END CRITICAL SECTION - LLM/AI MODIFICATION PROHIBITED

  return game;
};
