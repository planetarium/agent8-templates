/// <reference types="vite/client" />
import Phaser from 'phaser';

// Plays pixel art VFX sprite sheets found with the resource search (search_resources_vectordb_items). See docs/vfx-sheets.md.
// An effect is a search result item as returned: its png `url` and its `metadata` (size, pivot, loop/fps, frameData).
// Keep the items this game plays in src/game/vfx/effects.ts; the game never searches while it runs.

export interface VfxMetadata {
  frameWidth: number;
  frameHeight: number;
  /** Ground/anchor point inside a frame, in px. */
  pivot: [number, number] | number[];
  loop: boolean;
  fps: number;
  frames: number;
  /** The sheet's frame JSON, next to the png (default: <name>.json). Impact frames (hit stop) are read from it. */
  frameData?: string;
  /** Full-screen overlay (weather): covers the camera instead of standing at x, y. */
  screenSpace?: boolean;
  category?: string;
  /** GPU memory of the loaded sheet, in bytes. */
  gpuBytes?: number;
  /** The search result carries more fields (effectId, bestOn, hasAct, ...); they are kept as they are. */
  [field: string]: unknown;
}

/** A search result item: `{ url, metadata }`. Copy both as they are. */
export interface VfxSheet {
  url: string;
  metadata: VfxMetadata;
  [field: string]: unknown;
}

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

interface Hit {
  t: number;
  freeze: number;
}

const MEMORY_WARN_BYTES = 64 * 1024 * 1024;
const LOAD_TIMEOUT_MS = 30000;
const RETRY_AFTER_MS = 30000;
// Only timeout is set; the loader keeps each file's own responseType.
const XHR = { timeout: LOAD_TIMEOUT_MS } as Phaser.Types.Loader.XHRSettingsObject;
// Fallback for metadata without screenSpace.
const SCREEN_SPACE_CATEGORIES = new Set(['weather']);

const keyOf = (sheet: VfxSheet) => `vfx:${sheet.url}`;
const nameOf = (sheet: VfxSheet) => sheet.url.slice(sheet.url.lastIndexOf('/') + 1).replace(/\.png(\?.*)?$/i, '');
const isScreenSpace = (m: VfxMetadata) => m.screenSpace ?? SCREEN_SPACE_CATEGORIES.has(String(m.category));

// Which scenes asked for which sheet; a sheet is freed when the last scene holding it shuts down or is destroyed.
const holders = new Map<string, Set<Phaser.Scene>>();
const kept = new Set<string>();
const hooked = new WeakSet<Phaser.Scene>();
// Sheets asked for so far, for the memory warning.
const known = new Map<string, VfxSheet>();
// When a sheet last failed to load; play() does not ask again for RETRY_AFTER_MS.
const failedAt = new Map<string, number>();
const noHitsWarned = new Set<string>();
let warned = false;

/** Throws if the item is not a search result item PixelVfx can play, naming what is missing. */
function check(sheet: VfxSheet): VfxSheet {
  const m = (sheet as Partial<VfxSheet> | undefined)?.metadata as Partial<VfxMetadata> | undefined;
  const missing: string[] = [];
  if (typeof sheet?.url !== 'string' || !/\.png(\?.*)?$/i.test(sheet.url)) missing.push('url (the .png address)');
  if (!m || typeof m !== 'object') {
    missing.push('metadata');
  } else {
    for (const f of ['frameWidth', 'frameHeight', 'frames', 'fps'] as const) {
      if (!(typeof m[f] === 'number' && m[f]! > 0)) missing.push(`metadata.${f}`);
    }
    if (typeof m.loop !== 'boolean') missing.push('metadata.loop');
    if (!(Array.isArray(m.pivot) && m.pivot.length === 2 && m.pivot.every((n) => typeof n === 'number'))) missing.push('metadata.pivot');
  }
  if (missing.length) {
    throw new Error(
      `PixelVfx: effect ${typeof sheet?.url === 'string' ? `'${sheet.url}'` : JSON.stringify(sheet)} is missing ${missing.join(', ')}. ` +
        'Pass the whole search result item (url + metadata, copied as returned by search_resources_vectordb_items); see docs/vfx-sheets.md.',
    );
  }
  return sheet;
}

/** The frame JSON next to the png. */
function frameDataUrl(sheet: VfxSheet) {
  const dir = sheet.url.slice(0, sheet.url.lastIndexOf('/') + 1);
  return dir + (sheet.metadata.frameData ?? `${nameOf(sheet)}.json`);
}

function free(scene: Phaser.Scene, key: string) {
  if (scene.anims.exists(key)) scene.anims.remove(key);
  if (scene.textures.exists(key)) scene.textures.remove(key);
}

function hold(scene: Phaser.Scene, key: string, keep?: boolean) {
  if (keep) kept.add(key);
  let set = holders.get(key);
  if (!set) holders.set(key, (set = new Set()));
  set.add(scene);
  if (hooked.has(scene)) return;
  hooked.add(scene);
  const release = () => {
    if (!hooked.has(scene)) return;
    hooked.delete(scene);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, release);
    scene.events.off(Phaser.Scenes.Events.DESTROY, release);
    for (const [k, s] of holders) {
      if (!s.delete(scene) || s.size) continue;
      holders.delete(k);
      if (!kept.has(k)) free(scene, k);
    }
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, release);
  scene.events.once(Phaser.Scenes.Events.DESTROY, release);
}

function gpuBytes(scene: Phaser.Scene, sheet: VfxSheet) {
  if (typeof sheet.metadata.gpuBytes === 'number') return sheet.metadata.gpuBytes;
  const src = scene.textures.get(keyOf(sheet)).source[0];
  return src ? src.width * src.height * 4 : 0;
}

function checkMemory(scene: Phaser.Scene) {
  if (!import.meta.env.DEV || warned) return;
  const loaded = [...known.values()].filter((s) => scene.textures.exists(keyOf(s)));
  const bytes = loaded.reduce((sum, s) => sum + gpuBytes(scene, s), 0);
  if (bytes <= MEMORY_WARN_BYTES) return;
  warned = true;
  console.warn(`PixelVfx: ${loaded.length} VFX sheets use ${(bytes / 1048576).toFixed(0)} MB of GPU memory (over 64 MB, heavy on mobile). Preload only what the scene plays.`);
}

/** Impact frames, from the frame JSON (meta.pixelfx.act.hits) that Phaser keeps on the texture. */
function hitsOf(scene: Phaser.Scene, key: string): Hit[] {
  const meta = (scene.textures.get(key).customData as { meta?: { pixelfx?: { act?: { hits?: Partial<Hit>[] } } } }).meta;
  const hits = meta?.pixelfx?.act?.hits;
  if (!Array.isArray(hits)) return [];
  return hits
    .filter((h) => typeof h?.t === 'number' && typeof h?.freeze === 'number')
    .map((h) => ({ t: h.t!, freeze: h.freeze! }));
}

const warnLoad = (sheet: VfxSheet) => console.warn(`PixelVfx: could not load '${sheet.url}' (or its frame JSON ${frameDataUrl(sheet)}).`);

// A sheet nobody holds any more (its scene ended while it was loading) is freed as soon as it lands.
function dropIfUnheld(scene: Phaser.Scene, key: string) {
  if (!holders.get(key)?.size && !kept.has(key)) free(scene, key);
}

/** Queues a sheet; onSettled(true) once its texture exists, onSettled(false) if it failed. Returns false if already loaded. */
function queue(scene: Phaser.Scene, sheet: VfxSheet, onSettled?: (ok: boolean) => void) {
  const key = keyOf(sheet);
  known.set(key, sheet);
  if (scene.textures.exists(key)) return false;
  scene.load.atlas(key, sheet.url, frameDataUrl(sheet), XHR, XHR);

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
      failedAt.delete(key);
      dropIfUnheld(scene, key);
    } else {
      // Remember the failure so play() does not keep asking a host that just failed.
      failedAt.set(key, Date.now());
      warnLoad(sheet);
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
  const onAdded = () => dropIfUnheld(scene, key);
  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
  scene.load.once(fileDone, onDone);
  scene.load.once(Phaser.Loader.Events.COMPLETE, onDone);
  scene.textures.once(added, onAdded);
  return true;
}

export const PixelVfx = {
  /** Call in preload() with the effects this scene uses (items from src/game/vfx/effects.ts). Loading every sheet at once is too heavy. */
  preload(scene: Phaser.Scene, sheets: VfxSheet[], options: VfxLoadOptions = {}) {
    let queued = false;
    for (const sheet of sheets) {
      check(sheet);
      queued = queue(scene, sheet) || queued;
      hold(scene, keyOf(sheet), options.keep);
    }
    if (queued) scene.load.once(Phaser.Loader.Events.COMPLETE, () => checkMemory(scene));
  },

  /**
   * Plays an effect standing at x, y (its pivot). Returns the sprite; one-shots destroy themselves, loops run until destroy().
   * A sheet that was not preloaded is loaded now and starts when it arrives (fine for late, big sheets like rain).
   */
  play(scene: Phaser.Scene, sheet: VfxSheet, x = 0, y = 0, options: VfxOptions = {}): Phaser.GameObjects.Sprite {
    const s = check(sheet).metadata;
    const key = keyOf(sheet);
    const screenSpace = isScreenSpace(s);
    hold(scene, key, options.keep);

    const sprite = scene.add.sprite(x, y, '__DEFAULT').setDepth(options.depth ?? 1000).setFlipX(!!options.flip);
    // After the physics step has moved bodies and their game objects.
    const onPostUpdate = (fn: () => void) => {
      scene.events.on(Phaser.Scenes.Events.POST_UPDATE, fn);
      sprite.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, fn));
      fn();
    };

    if (screenSpace) {
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
      if (!screenSpace) {
        // Origin is a fraction of the untrimmed frame (sourceSize); Phaser offsets trimmed frames inside it.
        const px = options.flip ? s.frameWidth - s.pivot[0] : s.pivot[0];
        sprite.setOrigin(px / s.frameWidth, s.pivot[1] / s.frameHeight).setScale(Math.max(1, Math.round(options.scale ?? 1)));
      }
      const repeat = options.repeat ?? (s.loop ? -1 : 0);
      sprite.play({ key, repeat });
      if (repeat >= 0) sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());
      if (options.hitStop) {
        const hits = hitsOf(scene, key);
        if (!hits.length && import.meta.env.DEV && !noHitsWarned.has(key)) {
          noHitsWarned.add(key);
          console.warn(`PixelVfx: '${nameOf(sheet)}' has no impact frames; do hit stop in game code.`);
        }
        // Each freeze delays the frames after it, so a later hit lands later by the freezes before it.
        // Only the latest pause may resume: an earlier hit's resume landing on the same tick as the next pause is ignored.
        let frozen = 0, latest = 0;
        for (const hit of hits) {
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
    } else if (Date.now() - (failedAt.get(key) ?? -Infinity) < RETRY_AFTER_MS) {
      // Failed a moment ago: do not ask the host again yet.
      warnLoad(sheet);
      sprite.destroy();
    } else {
      // Not preloaded: load it now (hidden until it arrives).
      sprite.setVisible(false);
      queue(scene, sheet, (ok) => {
        // Failed (queue already warned), or the scene ended while the sheet was on its way.
        if (!ok || !holders.get(key)?.has(scene)) return sprite.destroy();
        sprite.setVisible(true);
        start();
        checkMemory(scene);
      });
      if (!scene.load.isLoading()) scene.load.start();
    }
    return sprite;
  },

  /** Impact frames of a loaded sheet (t, freeze in seconds), read from its frame JSON. Empty before it has loaded. */
  hits(scene: Phaser.Scene, sheet: VfxSheet): Hit[] {
    const key = keyOf(check(sheet));
    return scene.textures.exists(key) ? hitsOf(scene, key) : [];
  },
};
