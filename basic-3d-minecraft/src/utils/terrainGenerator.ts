import { createNoise2D } from 'simplex-noise';

/**
 * Procedural terrain generation utility based on seed.
 * Using the same seed always generates the same terrain.
 * Optimization: Generate only surface cubes.
 */

// Noise generation function (seed-based)
export function createNoise(seed: string) {
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
}

// Function to generate height map
export function generateHeightMap(
  noise: ReturnType<typeof createNoise>,
  width: number,
  depth: number,
  options = {
    scale: 0.1,
    amplitude: 5,
    persistence: 0.5,
    lacunarity: 2.0,
    octaves: 4,
    baseHeight: -2,
  },
): number[][] {
  const heightMap: number[][] = [];

  for (let x = 0; x < width; x++) {
    heightMap[x] = [];
    for (let z = 0; z < depth; z++) {
      let amplitude = options.amplitude;
      let frequency = options.scale;
      let noiseHeight = 0;

      // Composite noise from multiple octaves
      for (let i = 0; i < options.octaves; i++) {
        const sampleX = x * frequency;
        const sampleZ = z * frequency;

        // Generate 2D noise (range -1 to 1)
        const noiseValue = noise(sampleX, sampleZ);

        // Add noise value to height (convert to range 0 to 1)
        noiseHeight += (noiseValue + 1) * 0.5 * amplitude;

        // Prepare for the next octave
        amplitude *= options.persistence;
        frequency *= options.lacunarity;
      }

      // Calculate final height (round to integer)
      heightMap[x][z] = Math.round(noiseHeight) + options.baseHeight;
    }
  }

  return heightMap;
}

// Function to determine tile index (select different block types based on height)
export function getTileIndexForHeight(height: number, maxHeight: number): number {
  // Return different block types based on height
  if (height < 0) return 7; // Water
  if (height === 0) return 1; // Sand
  if (height < maxHeight * 0.2) return 2; // Grass
  if (height < maxHeight * 0.7) return 3; // Dirt
  return 4; // Stone
}

// Cube information generation function
export interface GeneratedCube {
  position: [number, number, number];
  tileIndex: number;
}

// Procedural terrain generation function (Optimization: generate only surface cubes)
export function generateTerrain(
  seed: string,
  width: number = 12,
  depth: number = 12,
  options = {
    scale: 0.1,
    amplitude: 8,
    persistence: 0.5,
    lacunarity: 2.0,
    octaves: 4,
    baseHeight: -2,
  },
): GeneratedCube[] {
  // Generate seed-based noise
  const noise = createNoise(seed);

  // Generate height map
  const heightMap = generateHeightMap(noise, width, depth, options);

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
  if (options.baseHeight < 0) {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        if (heightMap[x][z] < 0) {
          cubes.push({
            position: [Math.floor(x) + 0.5, Math.floor(0) + 0.5, Math.floor(z) + 0.5],
            // Water tile
            tileIndex: 7,
          });
        }
      }
    }
  }

  // Generate only surface cubes (Optimization)
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      const height = heightMap[x][z];

      if (height >= 0) {
        // 표면 큐브만 추가 (내부는 생성하지 않음)
        // Add only surface cubes (do not generate interior)
        const tileIndex = getTileIndexForHeight(height, maxHeight);

        cubes.push({
          position: [Math.floor(x) + 0.5, Math.floor(height) + 0.5, Math.floor(z) + 0.5],
          tileIndex,
        });

        // 추가: 표면 아래 한 층만 흙 블록 추가
        // Addition: Add only one layer of dirt blocks below the surface
        if (height > 0) {
          cubes.push({
            position: [Math.floor(x) + 0.5, Math.floor(height - 1) + 0.5, Math.floor(z) + 0.5],
            tileIndex: 3, // 흙 타일
            // Dirt tile
          });
        }
      }
    }
  }

  return cubes;
}
