import * as THREE from 'three';
import assetsData from '../assets.json';

// Sprite information
const spriteInfo = assetsData.sprites.minecraft;
const SPRITE_URL = spriteInfo.url;
const SPRITE_WIDTH = spriteInfo.size.width;
const SPRITE_HEIGHT = spriteInfo.size.height;
const SPRITE_CELL_SIZE_WIDTH = spriteInfo.cellSize.width;
const SPRITE_CELL_SIZE_HEIGHT = spriteInfo.cellSize.height;

// Calculate tile grid
const TILES_X = Math.floor(SPRITE_WIDTH / SPRITE_CELL_SIZE_WIDTH);
const TILES_Y = Math.floor(SPRITE_HEIGHT / SPRITE_CELL_SIZE_HEIGHT);
const TOTAL_TILES = TILES_X * TILES_Y;

/**
 * Calculate the row and column coordinates of a tile
 */
export const getTileCoordinates = (index: number) => {
  const row = Math.floor(index / TILES_X);
  const col = index % TILES_X;
  return { row, col };
};

// Texture cache
const textureCache: Map<number, THREE.Texture> = new Map();
// Texture loader
const loader = new THREE.TextureLoader();

/**
 * Load spritesheet texture
 */
export async function loadSpritesheet(): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    if (textureCache.has(-1)) {
      resolve(textureCache.get(-1)!.clone());
      return;
    }

    loader.load(
      SPRITE_URL,
      (texture) => {
        // Texture settings
        texture.flipY = false;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // Cache main texture
        textureCache.set(-1, texture);
        resolve(texture.clone());
      },
      undefined,
      (error) => {
        console.error('Failed to load spritesheet:', error);
        reject(error);
      },
    );
  });
}

/**
 * Calculate tile index from row and column coordinates
 */
export const getTileIndex = (row: number, col: number) => {
  return row * TILES_X + col;
};

/**
 * Return spritesheet information
 */
export const getSpriteInfo = () => {
  return {
    url: SPRITE_URL,
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
    cellSizeWidth: SPRITE_CELL_SIZE_WIDTH,
    cellSizeHeight: SPRITE_CELL_SIZE_HEIGHT,
    tilesX: TILES_X,
    tilesY: TILES_Y,
    totalTiles: TOTAL_TILES,
  };
};

/**
 * Get tile texture
 */
export const getTileTexture = async (index: number): Promise<THREE.Texture> => {
  // Return cached tile texture if available
  if (textureCache.has(index)) {
    return textureCache.get(index)!.clone();
  }

  const { row, col } = getTileCoordinates(index);

  // Calculate UV coordinates
  const u = col / TILES_X;
  const v = row / TILES_Y;
  const tileWidth = 1 / TILES_X;
  const tileHeight = 1 / TILES_Y;

  // Load main texture
  const texture = await loadSpritesheet();
  const tileTexture = texture.clone();

  // Set UV transformation
  tileTexture.repeat.set(tileWidth, tileHeight);
  tileTexture.offset.set(u, v);
  tileTexture.needsUpdate = true;

  // Save to cache
  textureCache.set(index, tileTexture);

  return tileTexture.clone();
};

/**
 * Preload all tile textures (save to cache)
 */
export async function preloadAllTiles(): Promise<THREE.Texture[]> {
  const textures: THREE.Texture[] = [];

  // Load main spritesheet
  const mainTexture = await loadSpritesheet();
  textures.push(mainTexture);

  // Create textures for each tile
  const promises = Array.from({ length: TOTAL_TILES }, (_, i) => getTileTexture(i));
  const results = await Promise.all(promises);
  textures.push(...results);

  return textures;
}

/**
 * Return total number of tiles
 */
export function getTotalTileCount(): number {
  return TOTAL_TILES;
}
