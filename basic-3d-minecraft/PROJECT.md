# 3D Minecraft-Style Voxel Game

## Project Overview

This project is a 3D Minecraft-inspired voxel game built with Three.js and React. It features procedural terrain generation, block manipulation, and first-person exploration. Players can add and remove blocks, explore a procedurally generated world, and interact with different types of blocks. The terrain is created using seed-based generation, allowing for consistent world creation with the same seed values.

## Implementation Strategy

This game uses a **3D Three.js-based approach with Voxel Optimization**:

- Procedural terrain generation using simplex noise
- Efficient instanced cube rendering for thousands of blocks
- Chunk-based rendering system for performance optimization
- Physics-based character controller with collision detection
- First-person camera controls with raycasting for block placement
- Shader-based texture atlas for various block types

Key technologies:

- Three.js: 3D rendering
- React Three Fiber: React integration
- @react-three/rapier: Physics simulation
- Simplex-noise: Procedural terrain generation
- Zustand: Game state management
- vibe-starter-3d: Character control and camera system
- Instanced Meshes: Optimized block rendering

## Implemented Features

- Procedural terrain generation with customizable seeds
- Block placing and removing with mouse interaction
- First-person character movement with physics
- Different block types (grass, dirt, stone, water, etc.)
- Optimized chunk-based rendering system
- Custom shader for texture atlas implementation
- Raycasting for accurate block targeting
- Performance optimizations for handling thousands of blocks
- Character animation system (idle, walk, run, jump)
- Dynamic loading and unloading of terrain chunks based on player proximity

## File Structure Overview

### src/main.tsx

- Entry point for the application
- Sets up React rendering

### src/App.tsx

- Main application component
- Renders GameScene component

### src/assets.json

- Defines game assets for character models and animations
- Maps animation types to resource URLs

### src/store/cubeStore.ts

- Zustand store for voxel world management
- Handles adding, removing, and storing block data
- Manages terrain generation state
- Controls selected block type

### src/utils/terrainGenerator.ts

- Implements procedural terrain generation using simplex noise
- Creates height maps based on seed values
- Determines block types based on terrain height
- Optimized to generate only surface blocks

### src/utils/tileTextureLoader.ts

- Manages texture atlas for different block types
- Maps tile indices to UV coordinates

### src/hooks/useCubeRaycaster.tsx

- Custom hook for block placement and removal
- Implements raycasting for block targeting
- Handles mouse interactions with the world

### src/constants/character.ts

- Defines character states (idle, walk, run, jump)
- Provides animation mappings

### src/constants/controls.ts

- Defines keyboard control mappings
- Sets up input configuration for character movement

### src/components/r3f/GameScene.tsx

- Main game scene component
- Sets up Canvas and Experience components

### src/components/r3f/Experience.tsx

- Sets up 3D environment (physics, lighting, sky)
- Configures core game elements
- Handles terrain regeneration UI

### src/components/r3f/Player.tsx

- Player character implementation
- Handles animations, movement, and state transitions
- Processes user input for character control

### src/components/r3f/InstancedCubes.tsx

- Core voxel rendering system
- Implements chunk-based rendering optimization
- Uses instanced meshes for efficient block rendering
- Custom shader for texture atlas support

### src/components/r3f/CubePreview.tsx

- Shows preview of block placement location
- Provides visual feedback for block placement

### src/components/r3f/Floor.tsx

- Implements basic floor grid for reference
- Serves as the bottom boundary of the world
