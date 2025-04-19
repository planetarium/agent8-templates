import { create } from 'zustand';
import { generateTerrain } from '../utils/terrainGenerator';

// Edit mode enum
export enum EditMode {
  BUILD = 'build',
}

// Seed value constant
export const DEFAULT_SEED = 'minecraft123';

// Cube information interface
interface CubeInfo {
  position: [number, number, number]; // Cube position
  tileIndex: number; // Tile index
}

interface CubeStore {
  cubes: CubeInfo[]; // Changed to an array of cube information
  seed: string; // Seed to use for terrain generation
  regenerateTerrain: (newSeed?: string) => void; // Function to regenerate the terrain
  addCube: (x: number, y: number, z: number, tileIndex: number) => void;
  removeCube: (x: number, y: number, z: number) => void; // Added cube removal function
  selectedTile: number;
  setSelectedTile: (index: number) => void;
}

// Helper function to check if two positions are the same
const isSamePosition = (pos1: [number, number, number], pos2: [number, number, number]): boolean => {
  return pos1[0] === pos2[0] && pos1[1] === pos2[1] && pos1[2] === pos2[2];
};

// Initial terrain generation function
const createInitialTerrain = (seed: string): CubeInfo[] => {
  // Procedural terrain generation (optimized settings)
  const terrainOptions = {
    scale: 0.08,
    // Noise scale (lower means smoother terrain)
    amplitude: 3,
    // Height magnitude (lower means flatter)
    persistence: 0.5,
    // Amplitude reduction rate for each octave
    lacunarity: 2.0,
    // Frequency increase rate for each octave
    octaves: 3,
    // Number of noise octaves (lower means less calculation)
    baseHeight: -1,
    // Base height (negative means below water)
  };

  // Terrain size reduction (reduced to 16x16)
  return generateTerrain(seed, 16, 16, terrainOptions);
};

/**
 * Optimization: Version that renders only surface cubes
 * Generate only the surface without filling the interior (not yet implemented)
 */

export const useCubeStore = create<CubeStore>((set) => ({
  // Initial seed setting and terrain generation
  seed: DEFAULT_SEED,
  cubes: createInitialTerrain(DEFAULT_SEED),

  // Terrain regeneration function
  regenerateTerrain: (newSeed) =>
    set((state) => {
      const seed = newSeed || state.seed;
      return {
        seed,
        cubes: createInitialTerrain(seed),
      };
    }),

  // Modified addCube function: Save tile index as well
  addCube: (x, y, z, tileIndex) =>
    set((state) => ({
      cubes: [...state.cubes, { position: [x, y, z], tileIndex }],
    })),
  // Added removeCube function: Remove cube at a specific position
  removeCube: (x, y, z) =>
    set((state) => ({
      cubes: state.cubes.filter((cube) => !isSamePosition(cube.position, [x, y, z])),
    })),
  selectedTile: 0, // Default tile (the first tile)
  setSelectedTile: (index) => set({ selectedTile: index }),
}));
