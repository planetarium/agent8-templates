import { TILE_TYPES } from './tiles';

/**
 * Tile theme definitions
 */
export enum THEMES {
  ALL = 'all', // All tiles
  BLUE = 'blue', // Blue colors (water, sky, glass)
  GREEN = 'green', // Green colors (grass, leaves)
  BROWN = 'brown', // Brown colors (dirt, wood)
  GRAY = 'gray', // Gray colors (stone, gravel)
  GOLD = 'gold', // Gold colors (gold ore, sand)
  RED = 'red', // Red colors (lava, flowers)
}

/**
 * Theme display names
 */
export const THEME_NAMES: Record<THEMES, string> = {
  [THEMES.ALL]: 'All Blocks',
  [THEMES.BLUE]: 'Blue',
  [THEMES.GREEN]: 'Green',
  [THEMES.BROWN]: 'Brown',
  [THEMES.GRAY]: 'Gray',
  [THEMES.GOLD]: 'Gold',
  [THEMES.RED]: 'Red',
};

/**
 * Tile groups by theme - organized for gradient effects
 */
export const THEME_TILES: Record<THEMES, number[]> = {
  // All tiles (empty array means all tiles)
  [THEMES.ALL]: [],

  // Blue colors (light sky blue → deep blue)
  [THEMES.BLUE]: [
    18, // Glass (cyan)
    19, // White wool (used as light blue)
    9, // Water (blue)
    23, // Red mushroom (used as purple)
  ],

  // Green colors (light lime → dark green)
  [THEMES.GREEN]: [
    7, // Sapling (lime green)
    1, // Grass (green top)
    17, // Leaves (dark green)
  ],

  // Brown colors (light beige → dark brown)
  [THEMES.BROWN]: [
    6, // Wooden planks (light brown)
    2, // Dirt (brown)
    16, // Wood trunk (dark brown)
    22, // Brown mushroom (very dark brown)
  ],

  // Gray colors (light gray → black)
  [THEMES.GRAY]: [
    25, // Iron block (light gray)
    12, // Gravel (gray)
    3, // Stone (slightly dark gray)
    4, // Cobblestone (dark gray)
    15, // Coal ore (deep gray)
    8, // Bedrock 2 (very dark gray)
    5, // Bedrock (almost black)
  ],

  // Gold/yellow colors (bright yellow → orange)
  [THEMES.GOLD]: [
    20, // Yellow flower (bright yellow)
    24, // Gold block (gold)
    11, // Sand (sand color)
    13, // Gold ore (light gold)
  ],

  // Red colors (pink → red → orange)
  [THEMES.RED]: [
    21, // Red flower (red)
    14, // Iron ore (reddish brown)
    10, // Lava (orange)
  ],
};

/**
 * Theme descriptions (description for the selected theme)
 */
export const THEME_DESCRIPTIONS: Record<THEMES, string> = {
  [THEMES.ALL]: 'You can use all available blocks.',
  [THEMES.BLUE]: 'Create gradient effects from light sky blue to deep blue.',
  [THEMES.GREEN]: 'Express natural plant gradients from lime green to dark green.',
  [THEMES.BROWN]: 'Create natural soil gradients from light wood to dark earth tones.',
  [THEMES.GRAY]: 'Express stone and rock gradients from light gray to deep black.',
  [THEMES.GOLD]: 'Create vibrant gradients from bright yellow to gold colors.',
  [THEMES.RED]: 'Express warm color gradients from red to orange tones.',
};

/**
 * Theme icons (Emoji)
 */
export const THEME_ICONS: Record<THEMES, string> = {
  [THEMES.ALL]: '🧱',
  [THEMES.BLUE]: '🔷',
  [THEMES.GREEN]: '🌿',
  [THEMES.BROWN]: '🟤',
  [THEMES.GRAY]: '⬜',
  [THEMES.GOLD]: '🟡',
  [THEMES.RED]: '🔴',
};

/**
 * Find themes that contain a tile index
 * @param tileIndex Tile index
 * @returns List of themes that contain the tile
 */
export const findThemesByTileIndex = (tileIndex: number): THEMES[] => {
  const themes: THEMES[] = [];

  // All theme is included by default
  themes.push(THEMES.ALL);

  // Check other themes
  Object.entries(THEME_TILES).forEach(([theme, tiles]) => {
    if (theme !== THEMES.ALL && (tiles.includes(tileIndex) || tiles.length === 0)) {
      themes.push(theme as THEMES);
    }
  });

  return themes;
};

/**
 * Convert tile type to theme index
 * @param tileType Tile type
 * @returns Array index corresponding to the tile type
 */
export const getTileIndexFromType = (tileType: number): number => {
  const tileTypeValues = Object.values(TILE_TYPES);
  return tileTypeValues.indexOf(tileType);
};

/**
 * Get tile index list for a theme
 * @param theme Theme
 * @returns List of tile indices for the theme
 */
export const getThemeTileIndices = (theme: THEMES): number[] => {
  // Return all indices if the theme is ALL
  if (theme === THEMES.ALL) {
    return Array.from({ length: Object.keys(TILE_TYPES).length }, (_, i) => i);
  }

  // Return tile indices specified for the theme (already stored as indices)
  return THEME_TILES[theme];
};
