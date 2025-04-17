import { create } from 'zustand';

// Edit mode enum
export enum EditMode {
  BUILD = 'build',
}

// Cube information interface
interface CubeInfo {
  position: [number, number, number]; // Cube position
  tileIndex: number; // Tile index
}

interface CubeStore {
  cubes: CubeInfo[]; // Changed to an array of cube information
  addCube: (x: number, y: number, z: number, tileIndex: number) => void;
  removeCube: (x: number, y: number, z: number) => void; // Added cube removal function
  selectedTile: number;
  setSelectedTile: (index: number) => void;
}

// Helper function to check if two positions are the same
const isSamePosition = (pos1: [number, number, number], pos2: [number, number, number]): boolean => {
  return pos1[0] === pos2[0] && pos1[1] === pos2[1] && pos1[2] === pos2[2];
};

export const useCubeStore = create<CubeStore>((set) => ({
  cubes: [],
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
