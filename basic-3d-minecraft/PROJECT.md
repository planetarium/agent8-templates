# Basic 3D Minecraft-Style Voxel Game

## Project Summary

This project is a 3D Minecraft-inspired voxel game built with Three.js and React. It features procedural terrain generation, block manipulation, and first-person exploration. Players can add and remove blocks, explore a procedurally generated world, and interact with different types of blocks.

## Implementation Strategy

This project uses a **3D Three.js-based approach with Voxel Optimization** because:

- It requires procedural world generation with efficient rendering
- Three.js provides powerful 3D rendering capabilities in web browsers
- React Three Fiber simplifies integration with React components
- Instanced rendering allows for thousands of blocks with good performance
- Chunk-based systems enable infinite-like world exploration

Key technologies:

- Three.js for 3D rendering
- React Three Fiber for React integration
- @react-three/rapier for physics simulation
- Simplex-noise for procedural terrain generation
- Zustand for game state management
- vibe-starter-3d for character control and animation
- Instanced Meshes for optimized block rendering

## Implemented Features

- Procedural terrain generation with customizable seeds
- Block placing and removing with mouse interaction
- First-person character movement with physics
- Multiple block types (grass, dirt, stone, water, etc.)
- Optimized chunk-based rendering system
- Custom shader for texture atlas implementation
- Raycasting for accurate block targeting
- Performance optimizations for handling thousands of blocks
- Character animation system (idle, walk, run, jump)
- Dynamic loading and unloading of terrain chunks based on player proximity

## File Structure Overview

### `src/main.tsx`

- Entry point for the application.
- Sets up React rendering and mounts the `App` component.

### `src/App.tsx`

- Main application component.
- Renders the `GameScene` component.

### `src/assets.json`

- Defines game assets for character models and animations.
- Maps animation types to resource URLs.

### `src/store/`

- Directory containing Zustand stores for application state management.
  - **`cubeStore.ts`**: Store for voxel world management that handles adding, removing, and storing block data. Also manages terrain generation state and controls selected block type.

### `src/utils/`

- Directory containing utility functions for the game.
  - **`terrainGenerator.ts`**: Implements procedural terrain generation using simplex noise. Creates height maps based on seed values and determines block types based on terrain height.
  - **`tileTextureLoader.ts`**: Manages texture atlas for different block types and maps tile indices to UV coordinates.

### `src/hooks/`

- Directory containing custom React hooks.
  - **`useCubeRaycaster.tsx`**: Custom hook for block placement and removal. Implements raycasting for block targeting and handles mouse interactions with the world.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`character.ts`**: Defines character states (idle, walk, run, jump) and provides animation mappings.
  - **`controls.ts`**: Defines keyboard control mappings and sets up input configuration for character movement.

### `src/components/`

- Directory managing React components.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`GameScene.tsx`**: Main game scene component that sets up Canvas and Experience components.
    - **`Experience.tsx`**: Sets up 3D environment. . Includes the crucial `FirstPersonViewController`, physics, lighting, and sky. Configures core game elements and handles terrain regeneration.
    - **`Player.tsx`**: Player character implementation that handles animations, movement, and state transitions. Processes user input for character control.
    - **`InstancedCubes.tsx`**: Core voxel rendering system that implements chunk-based rendering optimization. Uses instanced meshes for efficient block rendering and includes custom shader for texture atlas support.
    - **`CubePreview.tsx`**: Shows preview of block placement location and provides visual feedback for block placement.
    - **`Floor.tsx`**: Implements basic floor grid for reference and serves as the bottom boundary of the world.
