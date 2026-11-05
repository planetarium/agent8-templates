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
  /** Override the sheet's loop (-1) / one-shot (0) / play n+1 times (n); finite plays destroy themselves at the end. */
  repeat?: number;
  /** Pause the effect on its impact frames (sheets with hits only). A function is also called with the freeze in ms. */
  hitStop?: boolean | ((freezeMs: number) => void);
}

const keyOf = (name: VfxName) => `vfx:${name}`;
const MEMORY_WARN_BYTES = 64 * 1024 * 1024;
const LOAD_TIMEOUT_MS = 30000;
const RETRY_AFTER_MS = 30000;
// Only timeout is set; the loader keeps each file's own responseType.
const XHR = { timeout: LOAD_TIMEOUT_MS } as Phaser.Types.Loader.XHRSettingsObject;

// Which scenes asked for which sheet; a sheet is freed when the last scene holding it shuts down or is destroyed.
const holders = new Map<VfxName, Set<Phaser.Scene>>();
const kept = new Set<VfxName>();
const hooked = new WeakSet<Phaser.Scene>();
// When a sheet last failed to load; play() does not ask again for RETRY_AFTER_MS.
const failedAt = new Map<VfxName, number>();
const noHitsWarned = new Set<VfxName>();
let warned = false;

function free(scene: Phaser.Scene, name: VfxName) {
  if (scene.anims.exists(keyOf(name))) scene.anims.remove(keyOf(name));
  if (scene.textures.exists(keyOf(name))) scene.textures.remove(keyOf(name));
}

function hold(scene: Phaser.Scene, name: VfxName, keep?: boolean) {
  if (keep) kept.add(name);
  let set = holders.get(name);
  if (!set) holders.set(name, (set = new Set()));
  set.add(scene);
  if (hooked.has(scene)) return;
  hooked.add(scene);
  const release = () => {
    if (!hooked.has(scene)) return;
    hooked.delete(scene);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, release);
    scene.events.off(Phaser.Scenes.Events.DESTROY, release);
    for (const [n, s] of holders) {
      if (!s.delete(scene) || s.size) continue;
      holders.delete(n);
      if (!kept.has(n)) free(scene, n);
    }
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, release);
  scene.events.once(Phaser.Scenes.Events.DESTROY, release);
}

function checkMemory(scene: Phaser.Scene) {
  if (!import.meta.env.DEV || warned) return;
  const loaded = (Object.keys(SHEETS) as VfxName[]).filter((n) => scene.textures.exists(keyOf(n)));
  const bytes = loaded.reduce((sum, n) => sum + SHEETS[n].gpuBytes, 0);
  if (bytes <= MEMORY_WARN_BYTES) return;
  warned = true;
  console.warn(`PixelVfx: ${loaded.length} VFX sheets use ${(bytes / 1048576).toFixed(0)} MB of GPU memory (over 64 MB, heavy on mobile). Preload only what the scene plays.`);
}

const warnLoad = (name: VfxName, base = PixelVfx.baseUrl) => console.warn(`PixelVfx: could not load '${name}' from ${base}.`);

// A sheet nobody holds any more (its scene ended while it was loading) is freed as soon as it lands.
function dropIfUnheld(scene: Phaser.Scene, name: VfxName) {
  if (!holders.get(name)?.size && !kept.has(name)) free(scene, name);
}

/** Queues a sheet; onSettled(true) once its texture exists, onSettled(false) if it failed. Returns false if already loaded. */
function queue(scene: Phaser.Scene, name: VfxName, onSettled?: (ok: boolean) => void) {
  const s = SHEETS[name];
  if (!s) throw new Error(`PixelVfx: unknown effect '${name}'. The names are listed in docs/vfx-sheets.md.`);
  const key = keyOf(name);
  if (scene.textures.exists(key)) return false;
  const base = PixelVfx.baseUrl;
  const url = `${base}/${s.path}`;
  scene.load.atlas(key, `${url}.png`, `${url}.json`, XHR, XHR);

  const fileDone = `${Phaser.Loader.Events.FILE_KEY_COMPLETE}atlasjson-${key}`;
  const added = `${Phaser.Textures.Events.ADD_KEY}${key}`;
  let settled = false;
  const settle = (ok: boolean) => {
    if (settled) return;
    settled = true;
    scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
    scene.load.off(fileDone, onDone);
    scene.load.off(Phaser.Loader.Events.COMPLETE, onDone);
    scene.textures.off(added, onAdded);
    if (ok) {
      failedAt.delete(name);
      dropIfUnheld(scene, name);
    } else {
      // Remember the failure so play() does not keep asking a host that just failed.
      failedAt.set(name, Date.now());
      warnLoad(name, base);
    }
    onSettled?.(ok);
  };
  const onError = (file: Phaser.Loader.File) => {
    if (file.key === key || file.multiFile?.key === key) settle(false);
  };
  // A 200 response that does not decode (a broken PNG or JSON) can finish without a texture: that is a failure too.
  const onDone = () => settle(scene.textures.exists(key));
  // A stopped scene's loader drops its listeners but can still finish the download; the game-wide texture manager still
  // reports it.
  const onAdded = () => dropIfUnheld(scene, name);
  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
  scene.load.once(fileDone, onDone);
  scene.load.once(Phaser.Loader.Events.COMPLETE, onDone);
  scene.textures.once(added, onAdded);
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
    if (options.hitStop && !s.hits.length && import.meta.env.DEV && !noHitsWarned.has(name)) {
      noHitsWarned.add(name);
      console.warn(`PixelVfx: '${name}' has no impact frames; do hit stop in game code.`);
    }
    hold(scene, name, options.keep);

    const sprite = scene.add.sprite(x, y, '__DEFAULT').setDepth(options.depth ?? 1000).setFlipX(!!options.flip);
    // After the physics step has moved bodies and their game objects.
    const onPostUpdate = (fn: () => void) => {
      scene.events.on(Phaser.Scenes.Events.POST_UPDATE, fn);
      sprite.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, fn));
      fn();
    };

    if (s.screenSpace) {
      // Full-screen overlay. A scrollFactor(0) sprite is still zoomed around the camera origin, so cover the camera's
      // size divided by zoom with the smallest whole-number scale, and re-fit when the canvas or zoom changes.
      sprite.setOrigin(0.5).setScrollFactor(0);
      const cam = scene.cameras.main;
      let scale = 0;
      onPostUpdate(() => {
        const ox = cam.width * cam.originX, oy = cam.height * cam.originY;
        sprite.setPosition(ox + (cam.width / 2 - ox) / cam.zoomX, oy + (cam.height / 2 - oy) / cam.zoomY);
        const k = Math.ceil(Math.max(cam.width / (s.frameWidth * cam.zoomX), cam.height / (s.frameHeight * cam.zoomY)));
        if (k !== scale) sprite.setScale((scale = k));
      });
    } else if (options.follow) {
      const target = options.follow;
      onPostUpdate(() => {
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
      if (repeat >= 0) sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());
      if (options.hitStop) {
        // Each freeze delays the frames after it, so a later hit lands later by the freezes before it.
        // Only the latest pause may resume: an earlier hit's resume landing on the same tick as the next pause is ignored.
        let frozen = 0, latest = 0;
        for (const hit of s.hits) {
          scene.time.delayedCall((hit.t + frozen) * 1000, () => {
            if (!sprite.active) return;
            const mine = ++latest;
            sprite.anims.pause();
            if (typeof options.hitStop === 'function') options.hitStop(hit.freeze * 1000);
            scene.time.delayedCall(hit.freeze * 1000, () => {
              if (sprite.active && mine === latest) sprite.anims.resume();
            });
          });
          frozen += hit.freeze;
        }
      }
    };

    if (scene.textures.exists(key)) {
      start();
    } else if (Date.now() - (failedAt.get(name) ?? -Infinity) < RETRY_AFTER_MS) {
      // Failed a moment ago: do not ask the host again yet.
      warnLoad(name);
      sprite.destroy();
    } else {
      // Not preloaded: load it now (hidden until it arrives).
      sprite.setVisible(false);
      queue(scene, name, (ok) => {
        // Failed (queue already warned), or the scene ended while the sheet was on its way.
        if (!ok || !holders.get(name)?.has(scene)) return sprite.destroy();
        sprite.setVisible(true);
        start();
        checkMemory(scene);
      });
      if (!scene.load.isLoading()) scene.load.start();
    }
    return sprite;
  },
};
