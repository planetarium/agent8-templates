import { createNoise2D, createNoise3D } from 'simplex-noise';
import { TILE_TYPES } from '../constants/tiles';

// TODO: Define your own biomes here!
export const BIOMES = {
  PLAINS: 'plains',
  MOUNTAINS: 'mountains',
  DESERT: 'desert',
  // TODO: Add more biomes
  // FOREST: 'forest',
  // TUNDRA: 'tundra',
  // VOLCANIC: 'volcanic',
  // CRYSTAL: 'crystal',
  // MUSHROOM: 'mushroom',
  // UNDERWATER: 'underwater',
  // FLOATING_ISLANDS: 'floating_islands',
};

// TODO: Configure your terrain generation parameters
export const TERRAIN_CONFIG = {
  // Basic settings
  scale: 0.03,
  amplitude: 18,
  baseHeight: 5,

  // TODO: Add your own configuration parameters
  // biomeScale: 0.008,
  // caveScale: 0.05,
  // caveDensity: 0.3,
  // featureProbability: 0.003,
};

// TODO: Define your biome characteristics
export const BIOME_MODIFIERS = {
  // Example:
  [BIOMES.PLAINS]: {
    heightScale: 0.8,
    surfaceTile: TILE_TYPES.GRASS,
    // TODO: Add more properties
  },
  // TODO: Add modifiers for your other biomes
};

// TODO: Define your structures
export const STRUCTURES = {
  // Example:
  SMALL_TREE: {
    // TODO: Define structure properties
  },
  // TODO: Add more structures
  // LARGE_TREE: {},
  // HOUSE: {},
  // CAVE: {},
};

/**
 * Creates a deterministic noise function from a seed string
 */
export function createSeedBasedNoise(seed: string, dimension: '2d' | '3d' = '2d') {
  // Generate a numeric seed from the string
  let numericSeed = 0;
  for (let i = 0; i < seed.length; i++) {
    numericSeed = ((numericSeed << 5) - numericSeed + seed.charCodeAt(i)) | 0;
  }

  // Create a seeded random number generator
  const seededRandom = () => {
    numericSeed = (numericSeed * 9301 + 49297) % 233280;
    return numericSeed / 233280;
  };

  // Return the appropriate noise function
  return dimension === '2d' ? createNoise2D(seededRandom) : createNoise3D(seededRandom);
}

/**
 * Cube information interface
 */
export interface GeneratedCube {
  position: [number, number, number];
  tileIndex: number;
}

/**
 * Terrain generation function
 *
 * TODO: This is where your creativity comes in! Implement your own terrain generation logic.
 * Some ideas:
 * - Create floating islands
 * - Generate cave systems
 * - Make mountain ranges
 * - Add underwater features
 * - Create custom biomes
 * - Implement rivers, lakes, or oceans
 * - Add special structures
 */
export function generateTerrain(seed: string, width: number = 160, depth: number = 160): GeneratedCube[] {
  console.log(`Generating terrain with seed: ${seed}`);

  // Create noise functions
  const terrainNoise = createSeedBasedNoise(seed + '-terrain');
  // TODO: Create more noise functions as needed

  // Create cube array
  const cubes: GeneratedCube[] = [];

  // Calculate offsets to center the terrain around (0,0)
  const xOffset = Math.floor(width / 2);
  const zOffset = Math.floor(depth / 2);

  // Basic flat terrain example
  // TODO: Replace with your own terrain generation logic!
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      // Generate a simple height using noise
      const nx = x * TERRAIN_CONFIG.scale;
      const nz = z * TERRAIN_CONFIG.scale;
      // Add 0 as the third parameter for 2D noise
      const height = Math.floor((terrainNoise(nx, nz, 0) + 1) * 5) + TERRAIN_CONFIG.baseHeight;

      // Calculate centered positions
      const xPos = x - xOffset;
      const zPos = z - zOffset;

      // Add blocks from bottom to top
      for (let y = 0; y <= height; y++) {
        let tileType;

        // Simple layer-based tile assignment
        // TODO: Implement your own tile selection logic
        if (y === 0) {
          tileType = TILE_TYPES.BEDROCK;
        } else if (y < height - 1) {
          tileType = TILE_TYPES.DIRT;
        } else {
          tileType = TILE_TYPES.GRASS;
        }

        cubes.push({
          position: [xPos, y, zPos],
          tileIndex: tileType,
        });
      }

      // TODO: Add your own features here!
      // - Trees, rocks, flowers
      // - Caves, tunnels
      // - Structures
      // - Biome-specific features
    }
  }

  return cubes;
}

/**
 * Determines the biome at a given position
 *
 * TODO: Implement your own biome selection logic!
 */
export function getBiomeAt(x: number, z: number, biomeNoise: ReturnType<typeof createNoise2D>): string {
  // TODO: Replace with your own biome selection logic
  return BIOMES.PLAINS;
}

/**
 * Generates a special structure at the given position
 *
 * TODO: Implement your own structure generation logic!
 */
export function generateStructure(x: number, y: number, z: number, structureType: keyof typeof STRUCTURES, cubes: GeneratedCube[]): void {
  // TODO: Implement your structure generation logic
}

/**
 * Generates a cave system
 *
 * TODO: Implement your own cave generation logic!
 */
export function generateCaves(x: number, y: number, z: number, caveNoise: ReturnType<typeof createNoise3D>): boolean {
  // TODO: Implement your cave generation logic
  return false;
}

/**
 * Post-processing for the terrain
 *
 * TODO: Implement your own post-processing logic!
 * - Smooth terrain
 * - Create rivers
 * - Add paths
 */
export function postProcessTerrain(cubes: GeneratedCube[]): GeneratedCube[] {
  // TODO: Implement your post-processing logic
  return cubes;
}
