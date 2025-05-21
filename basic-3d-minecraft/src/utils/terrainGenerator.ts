import { createNoise2D } from 'simplex-noise';
import { TILE_TYPES } from '../constants/tiles';

// Terrain generation configuration values
const TERRAIN_CONFIG = {
  // Basic terrain generation settings - adjusted for smoother mountain shapes
  scale: 0.02, // Smaller noise scale value for wider and smoother terrain generation (previously 0.08)
  amplitude: 20, // Increased height amplitude to generate higher mountains (previously 12)
  persistence: 0.45, // Adjusted amplitude reduction rate per octave (previously 0.5)
  lacunarity: 2.2, // Increased frequency growth rate per octave (previously 2.0)
  octaves: 6, // Increased number of noise octaves for more natural terrain generation (previously 4)
  baseHeight: 5, // Increased base height to emphasize mountain formations (previously 0)
  smoothingFactor: 0.7, // Added smoothing factor for interpolating adjacent height values

  // Layer-by-layer tile settings - applied based on absolute Y coordinate
  layers: [
    { minY: 0, maxY: 5, tile: TILE_TYPES.WATER }, // Water layer (bottom-most)
    { minY: 5, maxY: 6, tile: TILE_TYPES.SAND }, // Sand layer (beach)
    { minY: 6, maxY: 8, tile: TILE_TYPES.DIRT }, // Dirt layer
    { minY: 8, maxY: 12, tile: TILE_TYPES.GRASS }, // Grass layer (plains)
    { minY: 12, maxY: 16, tile: TILE_TYPES.STONE }, // Stone layer (low mountains)
    { minY: 16, maxY: 20, tile: TILE_TYPES.COBBLESTONE }, // Cobblestone layer (mid mountains)
    { minY: 20, maxY: 25, tile: TILE_TYPES.COAL_ORE }, // Coal ore layer
    { minY: 25, maxY: 30, tile: TILE_TYPES.IRON_ORE }, // Iron ore layer (high mountains)
    { minY: 30, maxY: 35, tile: TILE_TYPES.GOLD_ORE }, // Gold ore layer (very high mountains)
    { minY: 35, maxY: 100, tile: TILE_TYPES.WOOL_WHITE }, // Peak layer (snow - top-most)
  ],
};

/**
 * Seed-based noise generation function
 * @param seed Seed to use for terrain generation
 * @returns 2D noise function
 */
function createNoise(seed: string) {
  // Generate number string from seed
  let seedNumber = '';
  for (let i = 0; i < seed.length; i++) {
    seedNumber += seed.charCodeAt(i);
  }

  // Alea algorithm - seed-based pseudo-random number generator
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

  // Initialize SimplexNoise instance
  return createNoise2D(alea());
}

/**
 * Height map generation function - improved for smooth terrain generation
 * @param noise Noise function
 * @param width Terrain width
 * @param depth Terrain depth
 * @returns 2D array height map
 */
function generateHeightMap(noise: ReturnType<typeof createNoise>, width: number, depth: number): number[][] {
  const heightMap: number[][] = [];
  const rawHeightMap: number[][] = []; // Array for storing raw height data

  // Noise settings
  const scale = TERRAIN_CONFIG.scale;
  const amplitude = TERRAIN_CONFIG.amplitude;
  const persistence = TERRAIN_CONFIG.persistence;
  const lacunarity = TERRAIN_CONFIG.lacunarity;
  const octaves = TERRAIN_CONFIG.octaves;
  const baseHeight = TERRAIN_CONFIG.baseHeight;

  // 1. First generate raw noise data
  for (let x = 0; x < width; x++) {
    rawHeightMap[x] = [];
    for (let z = 0; z < depth; z++) {
      let amp = amplitude;
      let freq = scale;
      let noiseHeight = 0;

      // Combine multiple octaves of noise
      for (let i = 0; i < octaves; i++) {
        const sampleX = x * freq;
        const sampleZ = z * freq;

        // Generate 2D noise (range -1 to 1)
        const noiseValue = noise(sampleX, sampleZ);

        // Add noise value to height (convert range to 0-1)
        noiseHeight += (noiseValue + 1) * 0.5 * amp;

        // Prepare for next octave
        amp *= persistence;
        freq *= lacunarity;
      }

      // Store height value (before smoothing)
      rawHeightMap[x][z] = noiseHeight + baseHeight;
    }
  }

  // 2. Additional noise layer for mountain effect (ridge noise effect)
  const ridgeNoise = (nx: number, nz: number) => {
    const value = noise(nx * 0.01, nz * 0.01);
    // Create ridge pattern (flip values to create mountain shapes)
    return 2 * (0.5 - Math.abs(0.5 - (value + 1) * 0.5));
  };

  // 3. Apply smoothing to raw data and add ridge effect
  for (let x = 0; x < width; x++) {
    heightMap[x] = [];
    for (let z = 0; z < depth; z++) {
      // Apply ridge effect (emphasize mountain shapes)
      const ridge = ridgeNoise(x, z) * amplitude * 0.6;

      // Add ridge effect to raw height
      let height = rawHeightMap[x][z] + ridge;

      // Smoothing to make height differences between adjacent tiles more gradual
      if (x > 0 && x < width - 1 && z > 0 && z < depth - 1) {
        const neighbors = [rawHeightMap[x - 1][z], rawHeightMap[x + 1][z], rawHeightMap[x][z - 1], rawHeightMap[x][z + 1]];

        const avgNeighbor = neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length;
        // Apply smooth interpolation
        height = height * (1 - TERRAIN_CONFIG.smoothingFactor) + avgNeighbor * TERRAIN_CONFIG.smoothingFactor;
      }

      // Calculate final height (round to integer)
      heightMap[x][z] = Math.round(height);
    }
  }

  return heightMap;
}

/**
 * Function to determine tile index based on absolute Y coordinate
 * @param y Absolute Y coordinate (position[1])
 * @param x X coordinate
 * @param z Z coordinate
 * @param noise Noise function (for additional variation)
 * @returns Tile index
 */
function getTileIndexForHeight(y: number, x: number, z: number, noise: ReturnType<typeof createNoise>): number {
  // Detail noise for additional randomness
  const detailNoise = noise(x * 0.2, z * 0.2);

  // Calculate surrounding heights for slope-based tile selection
  const slopeNoise = noise(x * 0.05, z * 0.05) + 0.5; // Range 0-1

  // Determine tile based on absolute Y coordinate - check layers by absolute Y value
  for (let i = 0; i < TERRAIN_CONFIG.layers.length; i++) {
    const layer = TERRAIN_CONFIG.layers[i];

    // Check if current Y is within this layer's range
    if (y >= layer.minY && y < layer.maxY) {
      // Special case: Water tiles
      if (layer.tile === TILE_TYPES.WATER && y < TERRAIN_CONFIG.baseHeight) {
        return detailNoise > 0.5 ? TILE_TYPES.SAND : TILE_TYPES.DIRT;
      }

      // Probability-based special tile generation (multiple probability cases)
      // Edge effect generation (steeper slopes expose more stone)
      if (layer.tile === TILE_TYPES.GRASS && slopeNoise > 0.7) {
        return TILE_TYPES.STONE;
      }

      // Expand snow distribution in high altitude areas
      if (y >= 25 && detailNoise > 0.4) {
        // Snow can appear at iron ore layer and above
        return TILE_TYPES.WOOL_WHITE;
      }

      // 10% chance to diversify some blocks (ores and special blocks)
      if (detailNoise > 0.9) {
        // Stone layer can contain coal, iron, and gold ores
        if (layer.tile === TILE_TYPES.STONE) {
          if (detailNoise > 0.97) return TILE_TYPES.GOLD_ORE;
          if (detailNoise > 0.93) return TILE_TYPES.IRON_ORE;
          return TILE_TYPES.COAL_ORE;
        }

        // Grass layer can contain flowers or mushrooms
        if (layer.tile === TILE_TYPES.GRASS) {
          if (detailNoise > 0.97) return TILE_TYPES.FLOWER_RED;
          if (detailNoise > 0.94) return TILE_TYPES.FLOWER_YELLOW;
          return TILE_TYPES.MUSHROOM_BROWN;
        }
      }

      return layer.tile;
    }
  }

  // Default value (should not occur)
  return TILE_TYPES.STONE;
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
 * @param seed Seed to use for terrain generation
 * @param width Terrain width (default 160)
 * @param depth Terrain depth (default 160)
 * @returns Array of generated cubes
 */
export function generateTerrain(seed: string, width: number = 160, depth: number = 160): GeneratedCube[] {
  // Create seed-based noise function
  const noise = createNoise(seed);

  // Generate height map
  const heightMap = generateHeightMap(noise, width, depth);

  // Create cube array
  const cubes: GeneratedCube[] = [];

  // Layered terrain generation (create blocks based on height at each position)
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      const height = heightMap[x][z];

      // Generate surface
      if (height >= TERRAIN_CONFIG.baseHeight) {
        const tileIndex = getTileIndexForHeight(height, x, z, noise);

        // Add surface cube
        cubes.push({
          position: [x, height, z],
          tileIndex,
        });

        // Generate layers below surface (up to a limited depth)
        const maxDepth = Math.min(5, height - TERRAIN_CONFIG.baseHeight + 1); // Generate up to 5 blocks deep

        for (let y = 1; y <= maxDepth; y++) {
          // Improved logic for selecting tiles below the surface
          const belowY = height - y;
          let depthTile;

          if (y === 1) {
            if (tileIndex === TILE_TYPES.GRASS || tileIndex === TILE_TYPES.DIRT) {
              depthTile = TILE_TYPES.DIRT;
            } else if (tileIndex === TILE_TYPES.SAND) {
              depthTile = noise(x * 0.3, z * 0.3) > 0.5 ? TILE_TYPES.SAND : TILE_TYPES.DIRT;
            } else {
              depthTile = TILE_TYPES.STONE;
            }
          } else {
            depthTile = getTileIndexForHeight(belowY, x, z, noise);
          }

          cubes.push({
            position: [x, belowY, z],
            tileIndex: depthTile,
          });
        }
      }
      // Generate water (below sea level)
      else if (height < TERRAIN_CONFIG.baseHeight) {
        // Add water block
        cubes.push({
          position: [x, TERRAIN_CONFIG.baseHeight, z],
          tileIndex: TILE_TYPES.WATER,
        });

        // Underwater terrain
        const underwaterNoise = noise(x * 0.3, z * 0.3);
        cubes.push({
          position: [x, height, z],
          tileIndex: getTileIndexForHeight(height, x, z, noise),
        });

        // Additional terrain at medium water depths
        if (TERRAIN_CONFIG.baseHeight - height > 2) {
          for (let y = 1; y < TERRAIN_CONFIG.baseHeight - height - 1; y++) {
            if (underwaterNoise > 0.8) {
              const belowWaterY = height + y;
              cubes.push({
                position: [x, belowWaterY, z],
                tileIndex: getTileIndexForHeight(belowWaterY, x, z, noise),
              });
            }
          }
        }
      }

      // Tree generation (only on grass or dirt)
      const surfaceTile = getTileIndexForHeight(height, x, z, noise);
      if ((surfaceTile === TILE_TYPES.GRASS || surfaceTile === TILE_TYPES.DIRT) && noise(x * 0.7, z * 0.7) > 0.96 && height >= TERRAIN_CONFIG.baseHeight) {
        // Tree trunk
        const trunkHeight = 3 + Math.floor(noise(x, z) * 3); // 3-5 blocks height

        for (let y = 1; y <= trunkHeight; y++) {
          cubes.push({
            position: [x, height + y, z],
            tileIndex: TILE_TYPES.WOOD,
          });
        }

        // Leaves - improved for more natural shape
        const leafRadius = 2;
        const leafHeight = 3;
        const leafNoiseScale = 0.8; // Scale for irregular leaf shape

        for (let lx = -leafRadius; lx <= leafRadius; lx++) {
          for (let lz = -leafRadius; lz <= leafRadius; lz++) {
            for (let ly = 0; ly < leafHeight; ly++) {
              // Spherical base shape
              const distSq = lx * lx + lz * lz + ly * ly * 1.5; // Slightly flattened vertically

              // If distance is within radius and meets noise condition, add leaves
              if (distSq <= leafRadius * leafRadius) {
                // Add irregular shape to edges
                const leafNoise = noise((x + lx) * leafNoiseScale, (z + lz) * leafNoiseScale + 300);
                const edgeCondition = distSq < leafRadius || leafNoise > 0.3;

                if (edgeCondition) {
                  cubes.push({
                    position: [x + lx, height + trunkHeight + ly, z + lz],
                    tileIndex: TILE_TYPES.LEAVES,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return cubes;
}
