import type { VfxSheet } from './PixelVfx';

// The VFX sheets this game plays, by name. Each entry is a search result item from search_resources_vectordb_items,
// with its `url` and `metadata` copied as returned (see docs/vfx-sheets.md). Search while writing code; the game does
// not search at runtime. Then: PixelVfx.preload(this, [EFFECTS.hitSpark]); PixelVfx.play(this, EFFECTS.hitSpark, x, y).
//
//   hitSpark: {
//     url: 'https://agent8-games.verse8.io/assets/2d/vfx/pixelfx/impacts/hit-spark.png',
//     metadata: { fps: 30, loop: false, pivot: [44, 64], frames: 16, frameWidth: 136, frameHeight: 80, sheetWidth: 188,
//       sheetHeight: 239, screenSpace: false, gpuBytes: 179728, frameData: 'hit-spark.json', category: 'impacts' },
//   },
export const EFFECTS = {} satisfies Record<string, VfxSheet>;
