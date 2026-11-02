import Phaser from 'phaser';
import { clearFrame, composite, createFrame, createFx, stockActor } from 'pixelfx';
import type { PixelFxFrame, PixelFxInstance, PixelFxModule, PixelFxOptions } from 'pixelfx';

export interface PixelFxLayerConfig {
  /** Screen pixels per effect pixel. 3 means every effect pixel is a 3x3 block on screen. */
  pixelScale?: number;
  /** Depth of the layer that draws the effects (the "front" part, or everything when backDepth is not set). */
  depth?: number;
  /** Set to draw the "back" part of the effects on its own layer at this depth (behind your characters). */
  backDepth?: number;
}

export interface PlayOptions extends Omit<PixelFxOptions, 'x' | 'y'> {
  /** World position in game pixels (same coordinates as your sprites). */
  x?: number;
  y?: number;
  /** Keep the effect on this object (a sprite, or anything with x and y). x and y are then offsets from it. */
  follow?: { x: number; y: number };
  /**
   * Effects made for a character (heal, status, melee, ...) are written around pixelfx's grey 24x38 stock
   * dummy. 'hidden' (default) keeps the dummy's shape for the aura but paints none of its body, so your own
   * sprite shows through. 'stock' paints the grey dummy too.
   */
  body?: 'hidden' | 'stock';
}

export interface PixelFxHandle {
  /** Let it end: loops fade out, one-shots are cut short. */
  stop(): void;
  /** Move the effect (world coordinates). */
  setPosition(x: number, y: number): void;
  /** True once the effect has finished and was removed. */
  readonly done: boolean;
}

interface Entry {
  fx: PixelFxInstance;
  x: number;
  y: number;
  follow?: { x: number; y: number };
  removed: boolean;
}

interface Surface {
  key: string;
  frame: PixelFxFrame;
  texture: Phaser.Textures.CanvasTexture;
  image: Phaser.GameObjects.Image;
  imageData: ImageData;
  dirty: boolean;
}

let nextId = 0;

const hiddenActors = new Map<number, ReturnType<typeof stockActor>>();
/** The stock dummy's shape with every body pixel transparent. */
function hiddenActor(k: number) {
  let actor = hiddenActors.get(k);
  if (!actor) {
    const stock = stockActor(k);
    actor = { ...stock, pixels: new Uint32Array(stock.pixels.length) };
    hiddenActors.set(k, actor);
  }
  return actor;
}

/**
 * Draws pixelfx effects over a Phaser scene.
 *
 *   this.fx = new PixelFxLayer(this, { pixelScale: 3 });
 *   this.fx.play(bigExplosion, { x: boss.x, y: boss.y });
 *
 * Effects are rendered at low resolution (screen size / pixelScale) into a canvas texture and scaled up
 * with nearest-neighbour filtering, so they stay crisp pixel art. The layer is fixed to the camera and
 * converts world coordinates using the camera scroll (camera zoom is not applied).
 */
export class PixelFxLayer {
  readonly scene: Phaser.Scene;
  readonly pixelScale: number;
  private readonly depth: number;
  private readonly backDepth?: number;
  private readonly id = nextId++;
  private entries: Entry[] = [];
  private front!: Surface;
  private back?: Surface;
  private destroyed = false;

  constructor(scene: Phaser.Scene, config: PixelFxLayerConfig = {}) {
    this.scene = scene;
    this.pixelScale = Math.max(1, Math.round(config.pixelScale ?? 3));
    this.depth = config.depth ?? 1000;
    this.backDepth = config.backDepth;
    this.build();

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.tick, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.build, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  /**
   * Plays an effect module. One-shots remove themselves when they end; loops run until you call stop().
   */
  play(mod: PixelFxModule, options: PlayOptions = {}): PixelFxHandle {
    const { x = 0, y = 0, follow, body = 'hidden', ...rest } = options;
    if (mod.meta?.actor && body === 'hidden' && rest.actor === undefined) rest.actor = hiddenActor(mod.meta.actor);
    const entry: Entry = { fx: createFx(mod, { ...rest, x: 0, y: 0 }), x, y, follow, removed: false };
    this.entries.push(entry);
    return {
      stop: () => entry.fx.stop(),
      setPosition: (nx: number, ny: number) => {
        entry.x = nx;
        entry.y = ny;
      },
      get done() {
        return entry.removed;
      },
    };
  }

  /** Width and height of the layer in effect pixels. */
  get size(): { width: number; height: number } {
    return { width: this.front.frame.w, height: this.front.frame.h };
  }

  /** Stops every effect right away. */
  clear(): void {
    for (const e of this.entries) e.removed = true;
    this.entries = [];
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clear();
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.tick, this);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.build, this);
    this.destroySurface(this.front);
    if (this.back) this.destroySurface(this.back);
  }

  private tick(_time: number, delta: number): void {
    const dt = Math.min(delta, 100) / 1000;
    const cam = this.scene.cameras.main;
    const s = this.pixelScale;

    clearFrame(this.front.frame);
    if (this.back) clearFrame(this.back.frame);

    const alive: Entry[] = [];
    for (const e of this.entries) {
      e.fx.update(dt);
      if (e.fx.done()) {
        e.removed = true;
        continue;
      }
      const wx = e.follow ? e.follow.x + e.x : e.x;
      const wy = e.follow ? e.follow.y + e.y : e.y;
      e.fx.options.x = Math.round((wx - cam.scrollX) / s);
      e.fx.options.y = Math.round((wy - cam.scrollY) / s);
      if (this.back) {
        e.fx.draw(this.back.frame, 'back');
        e.fx.draw(this.front.frame, 'front');
      } else {
        e.fx.draw(this.front.frame);
      }
      alive.push(e);
    }
    this.entries = alive;

    this.flush(this.front, alive.length > 0);
    if (this.back) this.flush(this.back, alive.length > 0);
  }

  /** Copies a frame to its texture. Skips the work when nothing is drawn and the texture is already empty. */
  private flush(surface: Surface, drawn: boolean): void {
    if (!drawn && !surface.dirty) return;
    composite(surface.frame, surface.imageData.data, null);
    surface.texture.context.putImageData(surface.imageData, 0, 0);
    surface.texture.refresh();
    surface.dirty = drawn;
  }

  /** (Re)creates the surfaces for the current screen size. */
  private build(): void {
    if (this.destroyed) return;
    const w = Math.max(1, Math.ceil(this.scene.scale.width / this.pixelScale));
    const h = Math.max(1, Math.ceil(this.scene.scale.height / this.pixelScale));
    if (this.front && this.front.frame.w === w && this.front.frame.h === h) return;

    if (this.front) this.destroySurface(this.front);
    if (this.back) this.destroySurface(this.back);
    this.front = this.createSurface(`pixelfx-${this.id}-front`, w, h, this.depth);
    if (this.backDepth !== undefined) this.back = this.createSurface(`pixelfx-${this.id}-back`, w, h, this.backDepth);
  }

  private createSurface(key: string, w: number, h: number, depth: number): Surface {
    const texture = this.scene.textures.createCanvas(key, w, h)!;
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const image = this.scene.add
      .image(0, 0, key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDisplaySize(w * this.pixelScale, h * this.pixelScale)
      .setDepth(depth);
    return { key, frame: createFrame(w, h), texture, image, imageData: texture.context.createImageData(w, h), dirty: false };
  }

  private destroySurface(surface: Surface): void {
    surface.image.destroy();
    if (this.scene.textures.exists(surface.key)) this.scene.textures.remove(surface.key);
  }
}
