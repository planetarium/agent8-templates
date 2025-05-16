# 3D Point-to-Move Game

## Project Summary

This project is a 3D game where players control a character through a point-and-click movement system from a quarter view perspective. The game features character animations, physics-based movement, and a 3D environment. Players can click on the ground to move their character and use keyboard inputs to perform various actions (walking, running, jumping, attacking, etc.). This project is intended for single-player gameplay with an emphasis on intuitive mouse-based navigation.

## Implementation Strategy

This game uses a **Three.js-based 3D approach**:

- React Three Fiber for 3D rendering in a React environment
- @react-three/rapier for physics simulation
- vibe-starter-3d library for character rendering and animation
- Quarter view camera setup providing an angled top-down view of the game world
- Raycasting system for converting screen clicks to world positions

Key technologies:

- Three.js - 3D rendering
- React Three Fiber - React integration
- @react-three/rapier - Physics simulation
- @react-three/drei - Useful Three.js helpers
- vibe-starter-3d - Character rendering and animation
- Tailwind CSS - UI composition
- Zustand - State management

## Implemented Features

- Point-and-click movement system (click on the ground to move character)
- Targeting system with visual feedback (click effect animations)
- Character animations (idle, run, sprint, jump, punch, kick, normal_attack, cast etc.)
- Various character state management (IDLE, RUN, SPRINT, JUMP, PUNCH, KICK, NORMAL_ATTACK, CAST, etc.)
- Physics-based character movement
- Quarter view camera perspective
- Environmental collision detection
- Mouse and keyboard control (QWER for actions)
- 3D model rendering with animations
- Interactive ground plane
- Animation system with support for looping and one-shot animations
- Raycasting for precise mouse interaction with the 3D environment
- Asset preloading system with progress indication

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

### `src/assets.json`

- File for managing asset metadata. Includes character model and animation information.

### `src/stores/`

- Directory containing Zustand stores for application state management.
  - **`playerStore.ts`**: Manages player-related state and references, particularly for physics interactions. Provides methods to register, unregister, and access player rigid body references.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, jump, etc.).
  - **`character.ts`**: Defines character-related constants (animation states, speed, etc.).

### Components

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Experience.tsx`**: Main component responsible for the primary 3D scene configuration. Includes lighting `ambientLight`, environmental elements `Environment`, the `Player` component wrapped in `PointToMoveController`, the `FollowLight` component that must be included with the controller for proper lighting, and the floor `Floor`. It renders the core visual and interactive elements within the physics simulation configured in `GameScene.tsx`. The inclusion of both `PointToMoveController` and `FollowLight` is essential for the proper functioning of the point-to-move environment.
    - **`Floor.tsx`**: Component defining and visually representing the ground plane in the 3D space. Has physical properties.
    - **`Player.tsx`**: Component handling the logic related to the player character model (movement, rotation, animation state management).
    - **`PointingSystem.tsx`**: Core component for the point-and-click movement mechanics. Implements raycasting to convert screen clicks to world positions. Creates visual feedback when clicking on the ground (click effect).

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component (implementing the Pointer Lock feature), utilizes `KeyboardControls` for handling keyboard inputs, configures the physics simulation using the `Physics` component from `@react-three/rapier`, and loads the `Experience` component with `Suspense` to initialize the 3D rendering environment.
    - **`PreloadScene.tsx`**: Manages asset preloading before the game starts. Loads all assets defined in assets.json (models, textures, etc.) and displays a loading progress bar. Ensures all assets are loaded before the game begins.

  - **`ui/`**: Directory containing components related to the user interface (UI). (Currently empty)

### Key Libraries & Components from External Sources

- **`vibe-starter-3d`**: A library providing foundational 3D game components and utilities.
  - **`PointToMoveController`**: Wraps the player character and manages point-to-move navigation by implementing a character controller with physics. It handles character movement, rotation, and camera following.
  - **`CharacterRenderer`**: Renders 3D character models with animations from glTF/GLB files. Manages animation states and transitions.
  - **`useControllerState`**: A React hook that provides control state management for the character, including:
    - `setEnableInput`: Function to enable/disable player input controls
    - `setMoveToPoint`: Function to set the destination point for character movement
    - `isPointMoving`: Function that returns whether the character is currently moving toward a point
    - `rigidBody`: Reference to the physics body for the character

### Point-to-Move System Implementation

The point-to-move system is implemented through a combination of components:

1. **Click Detection**: `PointingSystem` component uses raycasting to convert mouse clicks to 3D world positions, providing visual feedback at the clicked location.

2. **Movement Control**: `PointToMoveController` from the vibe-starter-3d library handles the physics-based movement of the character toward the destination point.

3. **State Management**: `useControllerState` hook provides shared state between components, allowing the pointing system to set movement targets that the controller can read. Additionally, `playerStore` manages physics body references.

4. **Animation Management**: `Player` component determines appropriate animations based on movement state, using the `isPointMoving()` function to detect when the character should be in a movement animation state.

5. **Asset Management**: `PreloadScene` component ensures all 3D models, textures, and other assets are preloaded before gameplay begins, providing a smooth user experience with a visual loading indicator.
