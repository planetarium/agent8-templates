import { createNoise2D } from 'simplex-noise';

/**
 * Simplified terrain generation utility
 * Using a single preset for simplicity
 */

// Noise generation function (seed-based)
const createNoise = (seed: string) => {
  // Create a numeric string from the seed
  let seedNumber = '';
  for (let i = 0; i < seed.length; i++) {
    seedNumber += seed.charCodeAt(i);
  }

  // Alea algorithm - pseudo-random number generator
  const alea = () => {
    let s0 = 0;
    let s1 = 0;
    let s2 = 0;
    let c = 1;

    const mash = (data: string) => {
      for (let i = 0; i < data.length; i++) {
        s0 += data.charCodeAt(i);
      }
      return s0;
    };

    s0 = mash(seedNumber);
    s1 = mash(seedNumber);
    s2 = mash(seedNumber);

    s0 %= 2147483647;
    s1 %= 2147483647;
    s2 %= 2147483647;

    return () => {
      const t = 2091639 * s0 + c * 2.3283064365386963e-10;
      s0 = s1;
      s1 = s2;
      return (s2 = t - (c = t | 0));
    };
  };

  // Initialize SimplexNoise instance with the seed
  return createNoise2D(alea());
};

// Function to generate height map
function generateHeightMap(noise: ReturnType<typeof createNoise>, width: number, depth: number): number[][] {
  const heightMap: number[][] = [];

  // Single noise settings - adjusted for flatter terrain
  const scale = 0.1; // Larger value (smoother terrain)
  const amplitude = 3; // Lower value (flatter terrain)
  const persistence = 0.4; // Lower value (less detail variation)
  const lacunarity = 1.8; // Lower value (less complexity)
  const octaves = 4; // Fewer octaves
  const baseHeight = -1; // Water level adjustment

  for (let x = 0; x < width; x++) {
    heightMap[x] = [];
    for (let z = 0; z < depth; z++) {
      let amp = amplitude;
      let freq = scale;
      let noiseHeight = 0;

      // Composite noise from multiple octaves
      for (let i = 0; i < octaves; i++) {
        const sampleX = x * freq;
        const sampleZ = z * freq;

        // Generate 2D noise (range -1 to 1)
        const noiseValue = noise(sampleX, sampleZ);

        // Add noise value to height (convert to range 0 to 1)
        noiseHeight += (noiseValue + 1) * 0.5 * amp;

        // Prepare for the next octave
        amp *= persistence;
        freq *= lacunarity;
      }

      // Calculate final height (round to integer)
      heightMap[x][z] = Math.round(noiseHeight) + baseHeight;
    }
  }

  return heightMap;
}

// Extended tile types (25 types)
export const TILE_TYPES = {
  // Basic blocks - first row
  GRASS: 1, // Green top grass block
  DIRT: 2, // Brown dirt block
  STONE: 3, // Gray stone block
  COBBLESTONE: 4, // Textured stone block
  BEDROCK: 5, // Dark gray bedrock

  // More blocks - second row
  WOOD_PLANKS: 6, // Wooden planks
  SAPLING: 7, // Small tree sapling
  BEDROCK_2: 8, // Alternative bedrock
  WATER: 9, // Blue water
  LAVA: 10, // Orange lava

  // Third row
  SAND: 11, // Yellow sand
  GRAVEL: 12, // Gray gravel
  GOLD_ORE: 13, // Gold ore in stone
  IRON_ORE: 14, // Iron ore in stone
  COAL_ORE: 15, // Coal ore in stone

  // Fourth row
  WOOD: 16, // Tree trunk
  LEAVES: 17, // Tree leaves
  GLASS: 18, // Transparent glass
  WOOL_WHITE: 19, // White wool
  FLOWER_YELLOW: 20, // Yellow flower

  // Fifth row
  FLOWER_RED: 21, // Red flower
  MUSHROOM_BROWN: 22, // Brown mushroom
  MUSHROOM_RED: 23, // Red mushroom
  GOLD_BLOCK: 24, // Solid gold block
  IRON_BLOCK: 25, // Solid iron block
};

// Function to determine tile index with more variety (simplified)
function getTileIndexForHeight(height: number, maxHeight: number, x: number, z: number, noise: ReturnType<typeof createNoise>): number {
  // Use coordinate-based noise to create diverse tiles
  const detailNoise = noise(x * 0.2, z * 0.2);
  const varietyNoise = noise(x * 0.5, z * 0.5);

  // Below water
  if (height < 0) return TILE_TYPES.WATER;

  // Shoreline (beach)
  if (height === 0) {
    // Various beach tiles (sand, gravel)
    if (detailNoise > 0.7) return TILE_TYPES.GRAVEL;
    return TILE_TYPES.SAND;
  }

  // Low areas (0-20%)
  if (height < maxHeight * 0.2) {
    // Place different tiles based on noise values
    if (detailNoise > 0.9) return TILE_TYPES.FLOWER_YELLOW; // Rare flowers
    if (detailNoise > 0.85) return TILE_TYPES.FLOWER_RED; // Rare flowers
    if (detailNoise > 0.8) {
      // Mushrooms
      return varietyNoise > 0.5 ? TILE_TYPES.MUSHROOM_BROWN : TILE_TYPES.MUSHROOM_RED;
    }
    if (detailNoise > 0.6) return TILE_TYPES.GRAVEL;
    return TILE_TYPES.GRASS;
  }

  // Mid areas (20-50%)
  if (height < maxHeight * 0.5) {
    // Place different tiles based on noise values
    if (detailNoise > 0.85) return TILE_TYPES.IRON_ORE; // Rare iron ore
    if (detailNoise > 0.8) return TILE_TYPES.COAL_ORE; // Coal ore
    if (detailNoise > 0.6) return TILE_TYPES.COBBLESTONE;
    if (detailNoise < 0.3) return TILE_TYPES.WOOD_PLANKS;
    return TILE_TYPES.DIRT;
  }

  // High areas (50-80%)
  if (height < maxHeight * 0.8) {
    // Place different tiles based on noise values
    if (detailNoise > 0.9) return TILE_TYPES.GOLD_ORE; // Rare gold ore
    if (detailNoise > 0.85) return TILE_TYPES.IRON_ORE; // Iron ore
    if (detailNoise > 0.7) return TILE_TYPES.GLASS;
    return TILE_TYPES.STONE;
  }

  // Mountain peaks (80-100%)
  if (varietyNoise > 0.7) {
    // Some peaks have different tiles instead of snow
    if (detailNoise > 0.9) return TILE_TYPES.GOLD_BLOCK; // Very rare gold block
    if (detailNoise > 0.8) return TILE_TYPES.IRON_BLOCK; // Rare iron block
    if (detailNoise > 0.6) return TILE_TYPES.BEDROCK;
  }

  // Default mountain peaks are white (wool or snow)
  return TILE_TYPES.WOOL_WHITE;
}

// Cube information generation function
export interface GeneratedCube {
  position: [number, number, number];
  tileIndex: number;
}

/**
 * Simplified terrain generation function
 * @param seed Seed to use for terrain generation
 * @param width Terrain width
 * @param depth Terrain depth
 */
export function generateTerrain(seed: string, width: number = 160, depth: number = 160): GeneratedCube[] {
  // Generate seed-based noise
  const noise = createNoise(seed);

  // Generate height map
  const heightMap = generateHeightMap(noise, width, depth);

  // Create cube array
  const cubes: GeneratedCube[] = [];

  // Calculate maximum height (used for determining tile index)
  let maxHeight = 0;
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      maxHeight = Math.max(maxHeight, heightMap[x][z]);
    }
  }

  // Create water surface plane (at y=0 position)
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      if (heightMap[x][z] < 0) {
        cubes.push({
          position: [Math.floor(x) + 0.5, Math.floor(0) + 0.5, Math.floor(z) + 0.5],
          tileIndex: TILE_TYPES.WATER,
        });
      }
    }
  }

  // Generate surface cubes
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      const height = heightMap[x][z];

      if (height >= 0) {
        // Select surface tile
        const tileIndex = getTileIndexForHeight(height, maxHeight, x, z, noise);

        // Add surface cube
        cubes.push({
          position: [Math.floor(x) + 0.5, Math.floor(height) + 0.5, Math.floor(z) + 0.5],
          tileIndex,
        });

        // Layer below surface is dirt or stone
        if (height > 0) {
          cubes.push({
            position: [Math.floor(x) + 0.5, Math.floor(height - 1) + 0.5, Math.floor(z) + 0.5],
            tileIndex: height > maxHeight * 0.5 ? TILE_TYPES.STONE : TILE_TYPES.DIRT,
          });
        }

        // Create trees only on grass (very low probability)
        if (tileIndex === TILE_TYPES.GRASS && Math.random() < 0.005) {
          // Tree trunk
          for (let y = 1; y <= 4; y++) {
            cubes.push({
              position: [Math.floor(x) + 0.5, Math.floor(height + y) + 0.5, Math.floor(z) + 0.5],
              tileIndex: TILE_TYPES.WOOD,
            });
          }

          // Tree leaves (wider)
          for (let ox = -2; ox <= 2; ox++) {
            for (let oz = -2; oz <= 2; oz++) {
              // Exclude corners
              if (Math.abs(ox) === 2 && Math.abs(oz) === 2) continue;

              for (let oy = 0; oy <= 2; oy++) {
                // Top layer is smaller
                if (oy === 2 && (Math.abs(ox) > 1 || Math.abs(oz) > 1)) continue;

                cubes.push({
                  position: [Math.floor(x + ox) + 0.5, Math.floor(height + 4 + oy) + 0.5, Math.floor(z + oz) + 0.5],
                  tileIndex: TILE_TYPES.LEAVES,
                });
              }
            }
          }
        }
      }
    }
  }

  return cubes;
}

export default generateTerrain;
