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
- vibe-starter-3d (v0.4.0) - Advanced character control, animation system, and physics integration
- Instanced Meshes - Optimized block rendering
- Custom Shaders - Face-specific coloring
- Tailwind CSS - UI composition

## Core Features

- **Block Manipulation**: Interactive block placing and removing with precise mouse targeting
- **First-Person Control**: Smooth character movement with physics-based collision detection
- **Advanced Animation System**: Character state management with multiple animation types (idle, walk, run, jump, cast)
- **Color-Based Block System**: Multiple block types organized by intuitive color themes
- **Optimized Rendering**: Chunk-based system with instanced meshes for efficient rendering of thousands of blocks
- **Custom Shader Implementation**: Per-face color rendering without texture overhead
- **Precise Raycasting**: Accurate block targeting with synchronized preview and placement systems
- **Dynamic World Loading**: Automatic chunk loading/unloading based on player proximity
- **Procedural Terrain**: Advanced terrain generation with layer-based block distribution using absolute Y-coordinates
- **Physics Integration**: Complete physics simulation with collision detection and rigid body management
- **Player Reference System**: Multiplayer-ready player tracking and state management

## Current Implementation Features

- **Advanced Player System**: Dedicated Player.tsx component with comprehensive character management, animation control, and state transitions
- **Character Animation System**: Complete character state management with animation mapping for idle, walking, running, jumping, and casting actions
- **Physics Integration**: Full physics integration with collision detection, rigid body object type definitions, and player reference management
- **Optimized Terrain Generation**: Procedural terrain generation with smooth transitions, natural formations, and absolute Y-coordinate based layer distribution
- **Precise Block Interaction**: Synchronized raycasting system with perfect alignment between preview and actual cube placement
- **Theme-Based Block System**: Intuitive color-based theme organization with enhanced tile selection UI and visual feedback
- **Chunk-Based Rendering**: Efficient world rendering with dynamic loading/unloading based on player proximity
- **Custom Shader System**: Per-face color implementation for diverse block types without texture overhead

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

- Directory containing state management stores using Zustand.
  - **`gameStore.ts`**: Store that manages the overall game state. Tracks and controls the readiness state of the map physics system (`isMapPhysicsReady`). This state is used to determine physics simulation pause/resume and loading screen display.
  - **`localPlayerStore.ts`**: Store that manages the local player's state, such as position tracking.
  - **`multiPlayerStore.ts`**: Store that manages multiple connected players' rigid body references for multiplayer functionality, including registration, unregistration, and retrieval of player references.
  - **`cubeStore.ts`**: Store for voxel world management that handles adding, removing, and storing block data. Also manages theme selection and controls selected block type.
  - **`playerActionStore.ts`**: Store that manages player action states including combat actions (punch, kick, meleeAttack, cast) and block manipulation (addCube) with support for setting, getting, and resetting action states.

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
  - **`character.ts`**: Defines character animation states and types for player state management.
  - **`rigidBodyObjectType.ts`**: Defines physics object types for collision detection and interaction systems.

### `src/components/`

- Directory managing React components.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Experience.tsx`**: Sets up 3D environment including lighting, sky, and world elements. Coordinates the overall 3D scene composition.
    - **`GameSceneCanvas.tsx`**: React Three Fiber Canvas component that renders the 3D game world with physics simulation and controller setup.
    - **`MapPhysicsReadyChecker.tsx`**: Component that checks if the map physics system is ready by performing raycasting from above downward to detect map geometry and ensures physics interactions are properly initialized before gameplay begins. Performs checks every frame until valid map geometry is detected, with a timeout after 180 frames to prevent infinite checking. Excludes Capsule shapes (likely characters/objects) and sensor colliders from the inspection.
    - **`Player.tsx`**: Advanced player component integrating RigidBodyPlayer with CharacterRenderer for comprehensive character management, physics interactions, and animation state management with collision detection capabilities.
    - **`InstancedCube.tsx`**: Core voxel rendering system using instanced meshes with custom shader for optimized color-based rendering and chunk-based optimization.
    - **`SingleCube.tsx`**: Component for rendering individual cubes with color-based faces for UI and preview purposes.
    - **`CubePreview.tsx`**: Shows preview of block placement location with precise coordinate alignment to the actual placement position.
    - **`Water.tsx`**: Implements water simulation with translucent rendering.

  - **`scene/`**: Contains components related to scene setup.

    - **`GameScene.tsx`**: Main game scene component that serves as a layout container arranging the game UI and 3D Canvas. Contains critical performance warnings and guidelines to prevent re-rendering issues. Includes the `GameSceneCanvas` and `GameSceneUI` components in a proper layered structure where the Canvas renders the 3D world and UI components render as overlays.
    - **`PreloadScene.tsx`**: Manages asset preloading before the game starts and displays a loading progress bar.

  - **`ui/`**: Contains UI components for the game interface.
    - **`GameSceneUI.tsx`**: Component that manages UI overlays for the game scene.
    - **`LoadingScreen.tsx`**: Loading screen component displayed during game loading.
    - **`InputController.tsx`**: Manages all input handling including keyboard, mouse, and touch controls with virtual joystick support for mobile devices and action buttons for block manipulation.
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

4. **Advanced Player System**: The dedicated `Player` component integrates with vibe-starter-3d's `FirstPersonViewController` and `CharacterRenderer` to provide smooth first-person movement, camera control, and comprehensive animation system with state management for character actions.

5. **State Management**: Zustand stores including `cubeStore` for voxel world management and `playerStore` for player reference tracking maintain comprehensive game state, handling block operations, player physics interactions, and multiplayer support in a performant way.

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
