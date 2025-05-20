import { create } from 'zustand';
import { TILE_TYPES } from '../constants/tiles';
import { THEMES, getThemeTileIndices } from '../constants/themes';
import { getTileTypeFromIndex } from '../utils/colorUtils';

// Seed value constant
const DEFAULT_SEED = import.meta.env.VITE_AGENT8_VERSE || 'minecraft123';

// Single terrain configuration value
const TERRAIN_CONFIG = {
  width: 160,
  depth: 160,
};

// Cube information interface - storing tileIndex directly without conversion
interface CubeInfo {
  position: [number, number, number]; // Cube position
  tileIndex: number; // Tile index (not tile type)
}

// 배열 인덱스에서 타일 타입으로 변환하는 매핑 테이블 생성
const TILE_INDEX_MAP = Object.values(TILE_TYPES).reduce((map, val, idx) => {
  map[idx] = val;
  return map;
}, {} as Record<number, number>);

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

  // 테마 관련 상태와 함수
  selectedTheme: THEMES; // 선택된 테마
  setSelectedTheme: (theme: THEMES) => void; // 테마 선택 함수
  availableTiles: number[]; // 현재 테마에서 사용 가능한 타일 인덱스 목록
  updateAvailableTiles: () => void; // 사용 가능한 타일 목록 업데이트
}

// Check if two positions are the same
const isSamePosition = (a: [number, number, number], b: [number, number, number]) => {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};

const useCubeStore = create<CubeStore>((set, get) => ({
  // Initial setup
  seed: DEFAULT_SEED,
  cubes: [],
  tileTypes: TILE_TYPES,
  builderMode: true,

  // Terrain regeneration function (simplified)
  regenerateTerrain: (newSeed) =>
    set((state) => {
      const seed = newSeed || state.seed;
      return {
        seed,
        cubes: [],
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

  // 테마 관련 상태와 함수
  selectedTheme: THEMES.ALL, // 기본 테마는 모든 블록
  setSelectedTheme: (theme) => {
    set({ selectedTheme: theme });
    // 테마가 변경되면 사용 가능한 타일 목록 업데이트
    get().updateAvailableTiles();
  },
  availableTiles: getThemeTileIndices(THEMES.ALL), // 초기값은 모든 타일
  updateAvailableTiles: () => {
    const theme = get().selectedTheme;
    const availableTiles = getThemeTileIndices(theme);

    set({ availableTiles });

    // 현재 선택된 타일이 새 테마에 없는 경우, 첫 번째 사용 가능한 타일로 변경
    const selectedTile = get().selectedTile;
    if (!availableTiles.includes(selectedTile) && availableTiles.length > 0) {
      set({ selectedTile: availableTiles[0] });
    }
  },
}));

export default useCubeStore;
