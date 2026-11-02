// pixelfx ships plain JS without type declarations. These cover the parts the game uses.

declare module 'pixelfx' {
  export interface PixelFxMeta {
    name?: string;
    desc?: string;
    tags?: string[];
    size?: [number, number];
    origin?: [number, number];
    duration?: number;
    loop?: boolean;
    fps?: number;
    actor?: number;
    options?: Record<string, unknown>;
  }

  /** An effect module, e.g. `import * as boom from 'pixelfx/fx/explosions/big-explosion'`. */
  export interface PixelFxModule {
    meta?: PixelFxMeta;
  }

  export interface PixelFxFrame {
    w: number;
    h: number;
    ox: number;
    oy: number;
    color: Uint32Array;
    light: Uint32Array;
  }

  export interface PixelFxOptions {
    x?: number;
    y?: number;
    flip?: boolean;
    angle?: number;
    seed?: number;
    /** Dark-to-bright ramp of hex colors, e.g. ['#102', '#215', '#43a', '#8cf', '#cff', '#fff']. */
    palette?: string[];
    /** Glow strength (1 = default). */
    light?: number;
    [key: string]: unknown;
  }

  export interface PixelFxInstance {
    readonly meta: PixelFxMeta;
    readonly options: PixelFxOptions;
    readonly t: number;
    update(dt: number): void;
    draw(frame: PixelFxFrame, layer?: 'back' | 'front'): void;
    stop(): void;
    done(): boolean;
  }

  export interface PixelFxActor {
    mask: { w: number; h: number; data: Uint8Array };
    pixels: Uint32Array;
    x: number;
    y: number;
    w: number;
    h: number;
    k: number;
    head: [number, number];
    chest: [number, number];
  }

  /** pixelfx's stand-in character (k = 2: 24 x 38 px), feet at (0, 0). */
  export function stockActor(k?: number): PixelFxActor;
  export function createFrame(w: number, h: number, ox?: number, oy?: number): PixelFxFrame;
  export function clearFrame(frame: PixelFxFrame): PixelFxFrame;
  export function createFx(mod: PixelFxModule, options?: PixelFxOptions): PixelFxInstance;
  export function composite(
    frame: PixelFxFrame,
    out: Uint8ClampedArray,
    bg?: number | Uint32Array | null,
    lightK?: number
  ): Uint8ClampedArray;
}

declare module 'pixelfx/fx/*' {
  import type { PixelFxMeta } from 'pixelfx';
  export const meta: PixelFxMeta;
}
