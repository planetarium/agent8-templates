# Basic 3D Minecraft-Style Voxel Game

## Project Summary

This project is a 3D Minecraft-inspired voxel game built with Three.js and React. It features color-based block rendering, block manipulation, and first-person exploration. Players can add and remove blocks with various colors, explore the world, and create structures using different themed blocks.

## Implementation Strategy

This project uses a **Color-Based 3D Three.js Voxel Optimization** approach because:

- It requires efficient block-based world rendering
- Three.js provides powerful 3D rendering capabilities in web browsers
- React Three Fiber simplifies integration with React components
- Instanced rendering allows for thousands of blocks with good performance
- Chunk-based systems enable efficient world exploration

Key technologies:

- Three.js - 3D rendering
- React Three Fiber - React integration
- @react-three/rapier - Physics simulation
- Zustand - State management
- vibe-starter-3d - Character control and animation
- Instanced Meshes - Optimized block rendering
- Custom Shaders - Face-specific coloring
- Tailwind CSS - UI composition

## Implemented Features

- Block placing and removing with mouse interaction
- First-person character movement with physics
- Multiple block types organized by color themes
- Optimized chunk-based rendering system
- Custom shader for per-face color implementation
- Accurate raycasting for precise block targeting and preview
- Performance optimizations for handling thousands of blocks
- Dynamic loading and unloading of terrain chunks based on player proximity
- Color-based theme system for intuitive block selection
- Advanced terrain generation with layer-based block distribution
- Absolute Y-coordinate based tile assignment for consistent terrain features
- Enhanced cube preview positioning aligned with actual placement

## Recent Improvements

- **Enhanced Terrain Generation**: Improved terrain generator with smoother transitions and more natural formations
- **Absolute Y-Coordinate System**: Modified terrain generation to use absolute Y-coordinates for more consistent layer-based block distribution
- **Precise Raycasting**: Implemented synchronization between preview and actual cube placement with consistent coordinate systems
- **Coordinate System Alignment**: Fixed positioning offsets between preview cubes and actual placement by aligning the two coordinate systems
- **Theme-Based Block Selection**: Enhanced tile selection UI with improved theme organization and better visual feedback

## Color System Design

The rendering system uses a color-based approach with these key features:

- Direct color values instead of textures for each cube face
- Theme classifications organized by color-based themes (BLUE, GREEN, BROWN, GRAY, GOLD, RED)
- Colors within each theme arranged as gradients from light to dark shades
- Central color management system (ALL_CUBE_COLORS in colorUtils.ts) defines colors for all six faces of each cube type
- Cleaner, more intuitive color management approach with consistent naming and organization

## File Structure Overview

### `src/main.tsx`

- Entry point for the application.
- Sets up React rendering and mounts the `App` component.

### `src/App.tsx`

- Main application component.
- Configures the overall layout and includes the `GameScene` component.
- Manages loading state and switches between `PreloadScene` and `GameScene`.

### `src/App.css`

- Defines the main styles for the `App` component and its child UI elements.

### `src/index.css`

- Defines global base styles, Tailwind CSS directives, fonts, etc., applied throughout the application.

### `src/stores/`

- Directory containing Zustand stores for application state management.
  - **`cubeStore.ts`**: Store for voxel world management that handles adding, removing, and storing block data. Also manages theme selection and controls selected block type.

### `src/utils/`

- Directory containing utility functions for the game.
  - **`colorUtils.ts`**: Defines and manages per-face colors for all block types and provides functions for color conversion and access.
  - **`terrainGenerator.ts`**: Implements procedural terrain generation with multiple layers, using absolute Y-coordinates for consistent block distribution.

### `src/hooks/`

- Directory containing custom React hooks.
  - **`useCubeRaycaster.tsx`**: Custom hook for block placement and removal. Implements precise raycasting for block targeting and handles mouse interactions with perfect alignment between preview and actual placement.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines keyboard control mappings and sets up input configuration for character movement.
  - **`tiles.ts`**: Defines tile types used throughout the application.
  - **`themes.ts`**: Defines color themes and theme-based block groupings for intuitive selection.

### `src/components/`

- Directory managing React components.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Experience.tsx`**: Sets up 3D environment. Includes the crucial `FirstPersonViewController`, the `FollowLight` component that must be included with the controller for proper lighting, physics, lighting, and sky.
    - **`InstancedCube.tsx`**: Core voxel rendering system using instanced meshes with custom shader for optimized color-based rendering and chunk-based optimization.
    - **`SingleCube.tsx`**: Component for rendering individual cubes with color-based faces for UI and preview purposes.
    - **`CubePreview.tsx`**: Shows preview of block placement location with precise coordinate alignment to the actual placement position.
    - **`Water.tsx`**: Implements water simulation with translucent rendering.

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component (implementing the Pointer Lock feature), utilizes `KeyboardControls` for handling keyboard inputs, configures the physics simulation using the `Physics` component from `@react-three/rapier`, and loads the `Experience` component with `Suspense` to initialize the 3D rendering environment.
    - **`PreloadScene.tsx`**: Manages asset preloading before the game starts and displays a loading progress bar.

  - **`ui/`**: Directory containing components related to the user interface (UI).
    - **`Crosshair.tsx`**: Displays a crosshair in the center of the screen for accurate block targeting.
    - **`TileSelector.tsx`**: Provides UI for selecting different block types and themes with 3D preview of each block.

### Key Libraries & Components from External Sources

- **`vibe-starter-3d`**: A library providing foundational 3D game components and utilities.

  - **`FirstPersonViewController`**: Implements a first-person camera and character controller with physics. Handles movement, looking, and interactions with the voxel world.
  - **`FollowLight`**: A directional light that follows the character to ensure consistent lighting throughout the voxel world.

- **`@react-three/rapier`**: Physics library for React Three Fiber.
  - Provides collision detection essential for character movement and interaction with blocks
  - Implements raycasting functionality used for block targeting and manipulation

### Voxel System Implementation

The Minecraft-style voxel system is implemented through a combination of components and techniques:

1. **Chunk-Based Rendering**: The world is divided into chunks that are rendered using instanced meshes for performance optimization. Only chunks near the player are loaded, allowing for efficient rendering of large worlds.

2. **Block Manipulation**: The system allows players to add and remove blocks through raycasting, with visual feedback provided through the `CubePreview` component which aligns perfectly with actual placement positions.

3. **Color-Based System**: Multiple block types are supported through a custom shader that applies unique colors to each face, allowing for diverse environments with minimal performance impact.

4. **First-Person Control**: The `FirstPersonViewController` component from vibe-starter-3d provides smooth first-person movement and camera control, allowing players to navigate and interact with the voxel world.

5. **State Management**: Zustand stores like `cubeStore` maintain the state of the voxel world, tracking block positions, types, and handling block operations in a performant way.

6. **Theme System**: Color-based themes group similar colored blocks to make it easy to create structures with natural gradient effects.

7. **Optimized Instance Rendering**: The custom shader and instanced mesh approach allows for efficient rendering of thousands of blocks while still applying unique colors to each face of every block.

8. **Advanced Terrain Generation**: The terrain is generated using a layered approach based on absolute Y-coordinates, creating natural-looking landscapes with appropriate block types at different heights.

9. **Coordinate System Synchronization**: The raycasting and placement systems are carefully aligned to ensure that preview blocks appear exactly where they will be placed, making building more intuitive and precise.

# Critical Memory

- **Design Decision**: Use only color values for cubes instead of textures if not explicitly requested

# Next Actions

- **HIGHEST PRIORITY**: AI AGENT MUST IMPLEMENT CREATIVE TERRAIN GENERATION LOGIC IMMEDIATELY. Focus on terrainGenerator.ts and create an impressive, varied 3D world with multiple biomes, structures, and terrain features. This is the most critical task for game engagement and visual appeal. Skip all other tasks until terrain generation is complete and visually stunning.

- **SECOND PRIORITY**: AI AGENT MUST IMPLEMENT SKYBOX USING EXISTING RESOURCES AND TOOLS. Immediately utilize available skybox resources, textures, or libraries to enhance the visual environment. If suitable tools or libraries exist for skybox implementation, use them directly rather than building from scratch. The skybox should complement the terrain features and biomes to create a cohesive visual experience. This task should be completed efficiently using readily available resources.

- **Third Priority**: AI AGENT to implement additional gameplay features after terrain and skybox are properly implemented.
