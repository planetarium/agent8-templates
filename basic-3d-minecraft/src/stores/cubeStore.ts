import { create } from 'zustand';
import { TILE_TYPES } from '../constants/tiles';
import { THEMES, getThemeTileIndices } from '../constants/themes';
import { getTileTypeFromIndex } from '../utils/colorUtils';
import { generateCubeMap, GeneratedCube } from '../utils/cubeMapGenerator';

// Seed value constant
const DEFAULT_SEED = import.meta.env.VITE_AGENT8_VERSE || 'minecraft123';

// Single cubeMap configuration value
const CUBEMAP_CONFIG = {
  width: 80,
  depth: 80,
};

// Cube information interface - storing tileIndex directly without conversion
interface CubeInfo {
  position: [number, number, number]; // Cube position
  tileIndex: number; // Tile index (not tile type)
}

// Create a mapping table to convert from array index to tile type
const TILE_INDEX_MAP = Object.values(TILE_TYPES).reduce(
  (map, val, idx) => {
    map[idx] = val;
    return map;
  },
  {} as Record<number, number>,
);

interface CubeStore {
  cubes: CubeInfo[]; // Cube information array
  seed: string; // Terrain generation seed
  addCube: (x: number, y: number, z: number, tileIndex: number) => void; // Add cube
  removeCube: (x: number, y: number, z: number) => void; // Remove cube
  selectedTile: number; // Selected tile
  setSelectedTile: (index: number) => void; // Tile selection function
  getTileTypeFromIndex: (index: number) => number; // Index to tile type conversion function
  tileTypes: typeof TILE_TYPES; // Tile type constants
  builderMode: boolean; // Builder mode
  toggleBuilderMode: () => void; // Toggle builder mode
  regenerateCubeMap: (newSeed?: string) => void; // Function to regenerate cubeMap

  // Theme related states and functions
  selectedTheme: THEMES; // Selected theme
  setSelectedTheme: (theme: THEMES) => void; // Theme selection function
  availableTiles: number[]; // List of available tile indices in the current theme
  updateAvailableTiles: () => void; // Function to update the list of available tiles
}

// Check if two positions are the same
const isSamePosition = (a: [number, number, number], b: [number, number, number]) => {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};

// Function to create initial cubeMap
const createInitialCubeMap = (seed: string): CubeInfo[] => {
  return generateCubeMap(seed, CUBEMAP_CONFIG.width, CUBEMAP_CONFIG.depth);
};

const useCubeStore = create<CubeStore>((set, get) => ({
  // Initial setup
  seed: DEFAULT_SEED,
  cubes: createInitialCubeMap(DEFAULT_SEED), // Apply initial cubeMap generation
  tileTypes: TILE_TYPES,
  builderMode: true,

  // CubeMap regeneration function
  regenerateCubeMap: (newSeed) =>
    set((state) => {
      const seed = newSeed || state.seed;
      return {
        seed,
        cubes: createInitialCubeMap(seed), // Regenerate cubeMap
      };
    }),

  // Add cube - store the index directly without conversion
  addCube: (x, y, z, tileIndex) => {
    set((state) => ({
      cubes: [...state.cubes, { position: [x, y, z], tileIndex: tileIndex }],
    }));
  },

  // Remove cube
  removeCube: (x, y, z) =>
    set((state) => ({
      cubes: state.cubes.filter((cube) => !isSamePosition(cube.position, [x, y, z])),
    })),

  selectedTile: 0, // Default tile
  setSelectedTile: (index) => set({ selectedTile: index }),

  // Index to tile type conversion function - use the shared function
  getTileTypeFromIndex,

  // Toggle builder mode
  toggleBuilderMode: () => set((state) => ({ builderMode: !state.builderMode })),

  // Theme related states and functions
  selectedTheme: THEMES.ALL, // Default theme is all blocks
  setSelectedTheme: (theme) => {
    set({ selectedTheme: theme });
    // Update the list of available tiles when the theme changes
    get().updateAvailableTiles();
  },
  availableTiles: getThemeTileIndices(THEMES.ALL), // Initial value is all tiles
  updateAvailableTiles: () => {
    const theme = get().selectedTheme;
    const availableTiles = getThemeTileIndices(theme);

    set({ availableTiles });

    // If the currently selected tile is not available in the new theme, change to the first available tile
    const selectedTile = get().selectedTile;
    if (!availableTiles.includes(selectedTile) && availableTiles.length > 0) {
      set({ selectedTile: availableTiles[0] });
    }
  },
}));

export default useCubeStore;
