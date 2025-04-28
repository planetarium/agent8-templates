import { create } from 'zustand';
import { generateTerrain, TILE_TYPES } from '../utils/terrainGenerator';

// Edit mode enum
export enum EditMode {
  BUILD = 'build',
}

// Seed value constant
export const DEFAULT_SEED = import.meta.env.VITE_AGENT8_VERSE || 'minecraft123';

// Single terrain configuration value
export const TERRAIN_CONFIG = {
  width: 160,
  depth: 160,
};

// Cube information interface
interface CubeInfo {
  position: [number, number, number]; // Cube position
  tileIndex: number; // Tile index
}

interface CubeStore {
  cubes: CubeInfo[]; // Cube information array
  seed: string; // Terrain generation seed
  regenerateTerrain: (newSeed?: string) => void; // Terrain regeneration function
  addCube: (x: number, y: number, z: number, tileIndex: number) => void; // Add cube
  removeCube: (x: number, y: number, z: number) => void; // Remove cube
  selectedTile: number; // Selected tile
  setSelectedTile: (index: number) => void; // Tile selection function
  tileTypes: typeof TILE_TYPES; // Tile type constants
}

// Helper function to check if two positions are the same
const isSamePosition = (pos1: [number, number, number], pos2: [number, number, number]): boolean => {
  return pos1[0] === pos2[0] && pos1[1] === pos2[1] && pos1[2] === pos2[2];
};

// Initial terrain generation function
const createInitialTerrain = (seed: string): CubeInfo[] => {
  return generateTerrain(seed, TERRAIN_CONFIG.width, TERRAIN_CONFIG.depth);
};

export const useCubeStore = create<CubeStore>((set) => ({
  // Initial setup
  seed: DEFAULT_SEED,
  cubes: createInitialTerrain(DEFAULT_SEED),
  tileTypes: TILE_TYPES,

  // Terrain regeneration function (simplified)
  regenerateTerrain: (newSeed) =>
    set((state) => {
      const seed = newSeed || state.seed;
      return {
        seed,
        cubes: createInitialTerrain(seed),
      };
    }),

  // Add cube
  addCube: (x, y, z, tileIndex) =>
    set((state) => ({
      cubes: [...state.cubes, { position: [x, y, z], tileIndex }],
    })),

  // Remove cube
  removeCube: (x, y, z) =>
    set((state) => ({
      cubes: state.cubes.filter((cube) => !isSamePosition(cube.position, [x, y, z])),
    })),

  selectedTile: 0, // Default tile
  setSelectedTile: (index) => set({ selectedTile: index }),
}));
