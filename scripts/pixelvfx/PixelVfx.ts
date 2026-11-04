import Phaser from 'phaser';
import { SHEETS, VFX_BASE_URL, type VfxName, type VfxSheet } from './sheets';

// Pixel art VFX sprite sheets (pixelfx, MIT) from the Agent8 asset library. See docs/vfx-sheets.md.
// Sizes, pivots, loop/fps and impact timing are in ./sheets.ts, generated from the library metadata.

export type { VfxName, VfxSheet };
export { SHEETS };

export interface VfxOptions {
  /** Whole-number pixel scale (default 1). The only way to size an effect: never setDisplaySize a PixelVfx sprite. */
  scale?: number;
  /** Default 1000, above most game objects. */
  depth?: number;
  /** Mirror horizontally. Directional effects (fireball, hits) face right by default. */
  flip?: boolean;
  /** Stick to this object every frame; x, y become offsets from it. The effect is removed when the object is destroyed. */
  follow?: { x: number; y: number; active?: boolean };
  /** Override the sheet's loop (-1) / one-shot (0). */
  repeat?: number;
  /** Pause the effect on its impact frames (sheets with hits). A function is also called with the freeze in ms. */
  hitStop?: boolean | ((freezeMs: number) => void);
}

const keyOf = (name: VfxName) => `vfx:${name}`;

export const PixelVfx = {
  /** Where the sheets are served from: `${baseUrl}/<category>/<name>.png|.json`. */
  baseUrl: VFX_BASE_URL,

  /** Call in preload() with the effects this scene uses. Loading every sheet at once is too heavy. */
  preload(scene: Phaser.Scene, names: VfxName[]) {
    for (const name of names) {
      const s = SHEETS[name];
      if (!s) throw new Error(`PixelVfx: unknown effect '${name}'. The names are listed in docs/vfx-sheets.md.`);
      const key = keyOf(name);
      if (scene.textures.exists(key)) continue;
      const url = `${PixelVfx.baseUrl}/${s.path}`;
      scene.load.atlas(key, `${url}.png`, `${url}.json`);
    }
  },

  /** Plays an effect standing at x, y (its pivot). Returns the sprite; one-shots destroy themselves, loops run until destroy(). */
  play(scene: Phaser.Scene, name: VfxName, x = 0, y = 0, options: VfxOptions = {}): Phaser.GameObjects.Sprite {
    const s = SHEETS[name];
    const key = keyOf(name);
    if (!scene.textures.exists(key)) throw new Error(`PixelVfx: '${name}' is not loaded. Call PixelVfx.preload(this, ['${name}']) in preload().`);
    if (!scene.anims.exists(key)) {
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      scene.anims.create({ key, frames: scene.anims.generateFrameNames(key, { start: 0, end: s.frames - 1 }), frameRate: s.fps });
    }

    const sprite = scene.add.sprite(x, y, key).setDepth(options.depth ?? 1000).setFlipX(!!options.flip);
    const onUpdate = (fn: () => void) => {
      scene.events.on(Phaser.Scenes.Events.UPDATE, fn);
      sprite.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, fn));
      fn();
    };

    if (s.screenSpace) {
      // Full-screen overlay. A scrollFactor(0) sprite is still zoomed around the camera origin, so cover the camera's
      // size divided by zoom with the smallest whole-number scale, and re-fit when the canvas or zoom changes.
      sprite.setOrigin(0.5).setScrollFactor(0);
      const cam = scene.cameras.main;
      let scale = 0;
      onUpdate(() => {
        const ox = cam.width * cam.originX, oy = cam.height * cam.originY;
        sprite.setPosition(ox + (cam.width / 2 - ox) / cam.zoomX, oy + (cam.height / 2 - oy) / cam.zoomY);
        const k = Math.ceil(Math.max(cam.width / (s.frameWidth * cam.zoomX), cam.height / (s.frameHeight * cam.zoomY)));
        if (k !== scale) sprite.setScale((scale = k));
      });
    } else {
      const k = Math.max(1, Math.round(options.scale ?? 1));
      const px = options.flip ? s.frameWidth - s.pivot[0] : s.pivot[0];
      sprite.setOrigin(px / s.frameWidth, s.pivot[1] / s.frameHeight).setScale(k);
    }

    const repeat = options.repeat ?? (s.loop ? -1 : 0);
    sprite.play({ key, repeat });
    if (repeat === 0) sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());

    if (options.follow && !s.screenSpace) {
      const target = options.follow;
      onUpdate(() => {
        if (!sprite.active) return;
        if (target.active === false) return sprite.destroy();
        sprite.setPosition(target.x + x, target.y + y);
      });
    }

    if (options.hitStop) {
      for (const hit of s.hits) {
        scene.time.delayedCall(hit.t * 1000, () => {
          if (!sprite.active) return;
          sprite.anims.pause();
          if (typeof options.hitStop === 'function') options.hitStop(hit.freeze * 1000);
          scene.time.delayedCall(hit.freeze * 1000, () => sprite.active && sprite.anims.resume());
        });
      }
    }
    return sprite;
  },
};
