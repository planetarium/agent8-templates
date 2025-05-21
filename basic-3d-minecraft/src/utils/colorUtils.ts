import * as THREE from 'three';
import { TILE_TYPES } from '../constants/tiles';

// Face index definition (for reference)
export const FACE_INDEX = {
  FRONT: 0, // Front
  RIGHT: 1, // Right
  BACK: 2, // Back
  LEFT: 3, // Left
  TOP: 4, // Top
  BOTTOM: 5, // Bottom
};

// Define all colors for all faces of all tiles directly
export const ALL_CUBE_COLORS: Record<number, Array<{ r: number; g: number; b: number }>> = {
  // Tile 0 (Default gray)
  0: [
    { r: 0.4, g: 0.4, b: 0.4 }, // Front
    { r: 0.4, g: 0.4, b: 0.4 }, // Right
    { r: 0.4, g: 0.4, b: 0.4 }, // Back
    { r: 0.4, g: 0.4, b: 0.4 }, // Left
    { r: 0.4, g: 0.4, b: 0.4 }, // Top
    { r: 0.4, g: 0.4, b: 0.4 }, // Bottom
  ],

  // Tile 1 (Grass)
  1: [
    { r: 0.6, g: 0.3, b: 0.0 }, // Front (Dirt)
    { r: 0.6, g: 0.3, b: 0.0 }, // Right (Dirt)
    { r: 0.6, g: 0.3, b: 0.0 }, // Back (Dirt)
    { r: 0.6, g: 0.3, b: 0.0 }, // Left (Dirt)
    { r: 0.0, g: 0.8, b: 0.0 }, // Top (Green grass)
    { r: 0.6, g: 0.3, b: 0.0 }, // Bottom (Dirt)
  ],

  // Tile 2 (Dirt)
  2: [
    { r: 0.6, g: 0.3, b: 0.0 }, // Front
    { r: 0.6, g: 0.3, b: 0.0 }, // Right
    { r: 0.6, g: 0.3, b: 0.0 }, // Back
    { r: 0.6, g: 0.3, b: 0.0 }, // Left
    { r: 0.6, g: 0.3, b: 0.0 }, // Top
    { r: 0.6, g: 0.3, b: 0.0 }, // Bottom
  ],

  // Tile 3 (Stone)
  3: [
    { r: 0.6, g: 0.55, b: 0.5 }, // Front
    { r: 0.55, g: 0.5, b: 0.45 }, // Right
    { r: 0.5, g: 0.45, b: 0.4 }, // Back
    { r: 0.55, g: 0.5, b: 0.45 }, // Left
    { r: 0.65, g: 0.6, b: 0.55 }, // Top
    { r: 0.5, g: 0.45, b: 0.4 }, // Bottom
  ],

  // Tile 4 (Gravel)
  4: [
    { r: 0.45, g: 0.45, b: 0.4 }, // Front
    { r: 0.4, g: 0.4, b: 0.35 }, // Right
    { r: 0.35, g: 0.35, b: 0.3 }, // Back
    { r: 0.4, g: 0.4, b: 0.35 }, // Left
    { r: 0.5, g: 0.5, b: 0.45 }, // Top
    { r: 0.35, g: 0.35, b: 0.3 }, // Bottom
  ],

  // Tile 5 (Bedrock)
  5: [
    { r: 0.2, g: 0.2, b: 0.2 }, // Front
    { r: 0.2, g: 0.2, b: 0.2 }, // Right
    { r: 0.2, g: 0.2, b: 0.2 }, // Back
    { r: 0.2, g: 0.2, b: 0.2 }, // Left
    { r: 0.2, g: 0.2, b: 0.2 }, // Top
    { r: 0.2, g: 0.2, b: 0.2 }, // Bottom
  ],

  // Tile 6 (Wooden Planks)
  6: [
    { r: 0.8, g: 0.5, b: 0.2 }, // Front
    { r: 0.75, g: 0.45, b: 0.15 }, // Right
    { r: 0.7, g: 0.4, b: 0.1 }, // Back
    { r: 0.75, g: 0.45, b: 0.15 }, // Left
    { r: 0.85, g: 0.55, b: 0.25 }, // Top
    { r: 0.7, g: 0.4, b: 0.1 }, // Bottom
  ],

  // Tile 7 (Small Tree Sapling)
  7: [
    { r: 0.0, g: 0.7, b: 0.1 }, // Front
    { r: 0.0, g: 0.65, b: 0.1 }, // Right
    { r: 0.0, g: 0.6, b: 0.1 }, // Back
    { r: 0.0, g: 0.65, b: 0.1 }, // Left
    { r: 0.0, g: 0.75, b: 0.1 }, // Top
    { r: 0.0, g: 0.6, b: 0.1 }, // Bottom
  ],

  // Tile 8 (Alternative Bedrock)
  8: [
    { r: 0.3, g: 0.3, b: 0.3 }, // Front
    { r: 0.3, g: 0.3, b: 0.3 }, // Right
    { r: 0.3, g: 0.3, b: 0.3 }, // Back
    { r: 0.3, g: 0.3, b: 0.3 }, // Left
    { r: 0.3, g: 0.3, b: 0.3 }, // Top
    { r: 0.3, g: 0.3, b: 0.3 }, // Bottom
  ],

  // Tile 9 (Water)
  9: [
    { r: 0.0, g: 0.0, b: 0.7 }, // Front
    { r: 0.0, g: 0.0, b: 0.7 }, // Right
    { r: 0.0, g: 0.0, b: 0.7 }, // Back
    { r: 0.0, g: 0.0, b: 0.7 }, // Left
    { r: 0.0, g: 0.2, b: 0.9 }, // Top
    { r: 0.0, g: 0.0, b: 0.6 }, // Bottom
  ],

  // Tile 10 (Lava)
  10: [
    { r: 0.9, g: 0.3, b: 0.0 }, // Front
    { r: 0.9, g: 0.3, b: 0.0 }, // Right
    { r: 0.9, g: 0.3, b: 0.0 }, // Back
    { r: 0.9, g: 0.3, b: 0.0 }, // Left
    { r: 1.0, g: 0.4, b: 0.0 }, // Top
    { r: 0.7, g: 0.2, b: 0.0 }, // Bottom
  ],

  // Tile 11 (Sand)
  11: [
    { r: 0.9, g: 0.8, b: 0.2 }, // Front
    { r: 0.85, g: 0.75, b: 0.18 }, // Right
    { r: 0.85, g: 0.75, b: 0.18 }, // Back
    { r: 0.85, g: 0.75, b: 0.18 }, // Left
    { r: 0.95, g: 0.85, b: 0.25 }, // Top
    { r: 0.85, g: 0.75, b: 0.18 }, // Bottom
  ],

  // Tile 12 (Gravel)
  12: [
    { r: 0.6, g: 0.6, b: 0.6 }, // Front
    { r: 0.55, g: 0.55, b: 0.55 }, // Right
    { r: 0.5, g: 0.5, b: 0.5 }, // Back
    { r: 0.55, g: 0.55, b: 0.55 }, // Left
    { r: 0.65, g: 0.65, b: 0.65 }, // Top
    { r: 0.5, g: 0.5, b: 0.5 }, // Bottom
  ],

  // Tile 13 (Gold Ore)
  13: [
    { r: 0.7, g: 0.7, b: 0.4 }, // Front
    { r: 0.65, g: 0.65, b: 0.35 }, // Right
    { r: 0.6, g: 0.6, b: 0.3 }, // Back
    { r: 0.65, g: 0.65, b: 0.35 }, // Left
    { r: 0.75, g: 0.75, b: 0.45 }, // Top
    { r: 0.6, g: 0.6, b: 0.3 }, // Bottom
  ],

  // Tile 14 (Iron Ore)
  14: [
    { r: 0.7, g: 0.5, b: 0.5 }, // Front
    { r: 0.65, g: 0.45, b: 0.45 }, // Right
    { r: 0.6, g: 0.4, b: 0.4 }, // Back
    { r: 0.65, g: 0.45, b: 0.45 }, // Left
    { r: 0.75, g: 0.55, b: 0.55 }, // Top
    { r: 0.6, g: 0.4, b: 0.4 }, // Bottom
  ],

  // Tile 15 (Coal Ore)
  15: [
    { r: 0.35, g: 0.3, b: 0.25 }, // Front
    { r: 0.3, g: 0.25, b: 0.2 }, // Right
    { r: 0.25, g: 0.2, b: 0.15 }, // Back
    { r: 0.3, g: 0.25, b: 0.2 }, // Left
    { r: 0.4, g: 0.35, b: 0.3 }, // Top
    { r: 0.25, g: 0.2, b: 0.15 }, // Bottom
  ],

  // Tile 16 (Wood Trunk)
  16: [
    { r: 0.5, g: 0.3, b: 0.0 }, // Front
    { r: 0.5, g: 0.3, b: 0.0 }, // Right
    { r: 0.5, g: 0.3, b: 0.0 }, // Back
    { r: 0.5, g: 0.3, b: 0.0 }, // Left
    { r: 0.7, g: 0.4, b: 0.1 }, // Top
    { r: 0.7, g: 0.4, b: 0.1 }, // Bottom
  ],

  // Tile 17 (Leaves)
  17: [
    { r: 0.0, g: 0.5, b: 0.0 }, // Front
    { r: 0.0, g: 0.45, b: 0.0 }, // Right
    { r: 0.0, g: 0.45, b: 0.0 }, // Back
    { r: 0.0, g: 0.45, b: 0.0 }, // Left
    { r: 0.0, g: 0.6, b: 0.0 }, // Top
    { r: 0.0, g: 0.4, b: 0.0 }, // Bottom
  ],

  // Tile 18 (Glass)
  18: [
    { r: 0.2, g: 0.8, b: 0.8 }, // Front
    { r: 0.15, g: 0.7, b: 0.7 }, // Right
    { r: 0.1, g: 0.6, b: 0.6 }, // Back
    { r: 0.15, g: 0.7, b: 0.7 }, // Left
    { r: 0.3, g: 0.9, b: 0.9 }, // Top
    { r: 0.1, g: 0.6, b: 0.6 }, // Bottom
  ],

  // Tile 19 (White Wool)
  19: [
    { r: 1.0, g: 0.5, b: 0.8 }, // Front
    { r: 0.9, g: 0.4, b: 0.7 }, // Right
    { r: 0.8, g: 0.3, b: 0.6 }, // Back
    { r: 0.9, g: 0.4, b: 0.7 }, // Left
    { r: 1.0, g: 0.6, b: 0.9 }, // Top
    { r: 0.8, g: 0.3, b: 0.6 }, // Bottom
  ],

  // Tile 20 (Yellow Flower)
  20: [
    { r: 1.0, g: 0.9, b: 0.3 }, // Front
    { r: 0.95, g: 0.85, b: 0.25 }, // Right
    { r: 0.9, g: 0.8, b: 0.2 }, // Back
    { r: 0.95, g: 0.85, b: 0.25 }, // Left
    { r: 1.0, g: 1.0, b: 0.4 }, // Top
    { r: 0.9, g: 0.8, b: 0.2 }, // Bottom
  ],

  // Tile 21 (Red Flower)
  21: [
    { r: 1.0, g: 0.0, b: 0.0 }, // Front
    { r: 0.9, g: 0.0, b: 0.0 }, // Right
    { r: 0.8, g: 0.0, b: 0.0 }, // Back
    { r: 0.9, g: 0.0, b: 0.0 }, // Left
    { r: 1.0, g: 0.2, b: 0.2 }, // Top
    { r: 0.8, g: 0.0, b: 0.0 }, // Bottom
  ],

  // Tile 22 (Brown Mushroom)
  22: [
    { r: 0.6, g: 0.4, b: 0.2 }, // Front
    { r: 0.5, g: 0.3, b: 0.15 }, // Right
    { r: 0.4, g: 0.25, b: 0.1 }, // Back
    { r: 0.5, g: 0.3, b: 0.15 }, // Left
    { r: 0.7, g: 0.45, b: 0.25 }, // Top
    { r: 0.4, g: 0.25, b: 0.1 }, // Bottom
  ],

  // Tile 23 (Red Mushroom)
  23: [
    { r: 0.6, g: 0.2, b: 0.8 }, // Front
    { r: 0.5, g: 0.15, b: 0.7 }, // Right
    { r: 0.4, g: 0.1, b: 0.6 }, // Back
    { r: 0.5, g: 0.15, b: 0.7 }, // Left
    { r: 0.7, g: 0.25, b: 0.9 }, // Top
    { r: 0.4, g: 0.1, b: 0.6 }, // Bottom
  ],

  // Tile 24 (Gold Block)
  24: [
    { r: 1.0, g: 0.8, b: 0.0 }, // Front
    { r: 0.95, g: 0.75, b: 0.0 }, // Right
    { r: 0.95, g: 0.75, b: 0.0 }, // Back
    { r: 0.95, g: 0.75, b: 0.0 }, // Left
    { r: 1.0, g: 0.9, b: 0.0 }, // Top
    { r: 0.9, g: 0.7, b: 0.0 }, // Bottom
  ],

  // Tile 25 (Iron Block)
  25: [
    { r: 0.6, g: 0.65, b: 0.7 }, // Front
    { r: 0.55, g: 0.6, b: 0.65 }, // Right
    { r: 0.5, g: 0.55, b: 0.6 }, // Back
    { r: 0.55, g: 0.6, b: 0.65 }, // Left
    { r: 0.65, g: 0.7, b: 0.75 }, // Top
    { r: 0.5, g: 0.55, b: 0.6 }, // Bottom
  ],
};

/**
 * Convert from index to tile type
 * @param index Tile index (0-based)
 * @returns Tile type value (1-based)
 */
export const getTileTypeFromIndex = (index: number): number => {
  // Get array of values from TILE_TYPES
  const tileTypeValues = Object.values(TILE_TYPES);
  // Return the corresponding tile type if index is valid, otherwise return default (0)
  return index >= 0 && index < tileTypeValues.length ? tileTypeValues[index] : 0;
};

/**
 * Return color based on tile index and face direction
 * @param index Tile index
 * @param faceDirection Face direction (0-5)
 * @returns RGB color object
 */
export const getColorByFace = (index: number, faceDirection: number): { r: number; g: number; b: number } => {
  // Default color (gray)
  const defaultColor = { r: 0.5, g: 0.5, b: 0.5 };

  // Return the color for the specified face and index
  if (ALL_CUBE_COLORS[index] && ALL_CUBE_COLORS[index][faceDirection]) {
    return ALL_CUBE_COLORS[index][faceDirection];
  }

  // Return default color if the specified color doesn't exist
  return defaultColor;
};

/**
 * Convert to Three.js Color object
 * @param color RGB color object
 * @returns THREE.Color object
 */
export const getThreeColor = (color: { r: number; g: number; b: number }): THREE.Color => {
  return new THREE.Color(color.r, color.g, color.b);
};
