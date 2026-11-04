/// <reference types="vite/client" />
import Phaser from 'phaser';
import { SHEETS, VFX_BASE_URL, type VfxName, type VfxSheet } from './sheets';

// Pixel art VFX sprite sheets (pixelfx, MIT) from the Agent8 asset library. See docs/vfx-sheets.md.
// Sizes, pivots, loop/fps, impact timing and GPU memory are in ./sheets.ts, generated from the library metadata.

export type { VfxName, VfxSheet };
export { SHEETS };

export interface VfxLoadOptions {
  /** Keep the sheets in memory after the scene shuts down (default false: they are freed with the scene). */
  keep?: boolean;
}

export interface VfxOptions extends VfxLoadOptions {
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
const MEMORY_WARN_BYTES = 64 * 1024 * 1024;

// Which scenes asked for which sheet; a sheet is freed when the last scene holding it shuts down.
const holders = new Map<VfxName, Set<Phaser.Scene>>();
const kept = new Set<VfxName>();
const hooked = new WeakSet<Phaser.Scene>();
let warned = false;

function hold(scene: Phaser.Scene, name: VfxName, keep?: boolean) {
  if (keep) kept.add(name);
  let set = holders.get(name);
  if (!set) holders.set(name, (set = new Set()));
  set.add(scene);
  if (hooked.has(scene)) return;
  hooked.add(scene);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    hooked.delete(scene);
    for (const [n, s] of holders) {
      if (!s.delete(scene) || s.size || kept.has(n)) continue;
      holders.delete(n);
      if (scene.anims.exists(keyOf(n))) scene.anims.remove(keyOf(n));
      if (scene.textures.exists(keyOf(n))) scene.textures.remove(keyOf(n));
    }
  });
}

function checkMemory(scene: Phaser.Scene) {
  if (!import.meta.env.DEV || warned) return;
  const loaded = (Object.keys(SHEETS) as VfxName[]).filter((n) => scene.textures.exists(keyOf(n)));
  const bytes = loaded.reduce((sum, n) => sum + SHEETS[n].gpuBytes, 0);
  if (bytes <= MEMORY_WARN_BYTES) return;
  warned = true;
  console.warn(`PixelVfx: ${loaded.length} VFX sheets use ${(bytes / 1048576).toFixed(0)} MB of GPU memory (over 64 MB, heavy on mobile). Preload only what the scene plays.`);
}

function queue(scene: Phaser.Scene, name: VfxName) {
  const s = SHEETS[name];
  if (!s) throw new Error(`PixelVfx: unknown effect '${name}'. The names are listed in docs/vfx-sheets.md.`);
  const key = keyOf(name);
  if (scene.textures.exists(key)) return false;
  const url = `${PixelVfx.baseUrl}/${s.path}`;
  scene.load.atlas(key, `${url}.png`, `${url}.json`);
  return true;
}

export const PixelVfx = {
  /** Where the sheets are served from: `${baseUrl}/<category>/<name>.png|.json`. */
  baseUrl: VFX_BASE_URL,

  /** Call in preload() with the effects this scene uses. Loading every sheet at once is too heavy. */
  preload(scene: Phaser.Scene, names: VfxName[], options: VfxLoadOptions = {}) {
    let queued = false;
    for (const name of names) {
      queued = queue(scene, name) || queued;
      hold(scene, name, options.keep);
    }
    if (queued) scene.load.once(Phaser.Loader.Events.COMPLETE, () => checkMemory(scene));
  },

  /**
   * Plays an effect standing at x, y (its pivot). Returns the sprite; one-shots destroy themselves, loops run until destroy().
   * A sheet that was not preloaded is loaded now and starts when it arrives (fine for late, big sheets like rain).
   */
  play(scene: Phaser.Scene, name: VfxName, x = 0, y = 0, options: VfxOptions = {}): Phaser.GameObjects.Sprite {
    const s = SHEETS[name];
    if (!s) throw new Error(`PixelVfx: unknown effect '${name}'. The names are listed in docs/vfx-sheets.md.`);
    const key = keyOf(name);
    hold(scene, name, options.keep);

    const sprite = scene.add.sprite(x, y, '__DEFAULT').setDepth(options.depth ?? 1000).setFlipX(!!options.flip);
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
    } else if (options.follow) {
      const target = options.follow;
      onUpdate(() => {
        if (!sprite.active) return;
        if (target.active === false) return sprite.destroy();
        sprite.setPosition(target.x + x, target.y + y);
      });
    }

    const start = () => {
      if (!sprite.active) return;
      if (!scene.anims.exists(key)) {
        scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
        scene.anims.create({ key, frames: scene.anims.generateFrameNames(key, { start: 0, end: s.frames - 1 }), frameRate: s.fps });
      }
      sprite.setTexture(key, '0');
      if (!s.screenSpace) {
        // Origin is a fraction of the untrimmed frame (sourceSize); Phaser offsets trimmed frames inside it.
        const px = options.flip ? s.frameWidth - s.pivot[0] : s.pivot[0];
        sprite.setOrigin(px / s.frameWidth, s.pivot[1] / s.frameHeight).setScale(Math.max(1, Math.round(options.scale ?? 1)));
      }
      const repeat = options.repeat ?? (s.loop ? -1 : 0);
      sprite.play({ key, repeat });
      if (repeat === 0) sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());
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
    };

    if (scene.textures.exists(key)) {
      start();
    } else {
      // Not preloaded: load it now (hidden until it arrives).
      sprite.setVisible(false);
      queue(scene, name);
      const failed = (file: Phaser.Loader.File) => {
        if (file.key !== key && file.multiFile?.key !== key) return;
        scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, failed);
        console.warn(`PixelVfx: could not load '${name}' from ${PixelVfx.baseUrl}.`);
        sprite.destroy();
      };
      scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, failed);
      scene.load.once(`${Phaser.Loader.Events.FILE_KEY_COMPLETE}atlasjson-${key}`, () => {
        scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, failed);
        sprite.setVisible(true);
        start();
        checkMemory(scene);
      });
      if (!scene.load.isLoading()) scene.load.start();
    }
    return sprite;
  },
};
