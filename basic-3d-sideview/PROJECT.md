# 3D Side View Game

## Project Summary

This project is a 3D platformer game with a side-scrolling perspective, similar to classic 2D platformers but with 3D graphics. Players control a character that can run, jump, and perform various actions while navigating through a procedurally generated terrain of platforms. The game features character animations, physics-based movement, and jump mechanics that are essential for platformer gameplay. This project is intended for single-player gameplay with an emphasis on platform jumping and character control.

## Implementation Strategy

This game uses a **Three.js-based 3D approach**:

- React Three Fiber for 3D rendering in a React environment
- @react-three/rapier for physics simulation and collision detection
- vibe-starter-3d library for character rendering and animation
- Side view camera setup providing a classic platformer perspective
- Seed-based procedural generation for platform layouts

Key technologies:

- Three.js - 3D rendering
- React Three Fiber - React integration
- @react-three/rapier - Physics simulation
- @react-three/drei - Useful Three.js helpers
- vibe-starter-3d - Character rendering and animation
- Tailwind CSS - UI composition
- Zustand - State management

## Implemented Features

- Character animations (idle, run, sprint, jump, punch, kick, normal_attack, cast etc.)
- Various character state management (IDLE, RUN, SPRINT, JUMP, PUNCH, KICK, NORMAL_ATTACK, CAST, etc.)
- Physics-based character movement with gravity
- Side view camera perspective (fixed orientation)
- Platformer-style jumping mechanics
- Procedurally generated platforms using seed-based randomization
- Environmental collision detection
- Keyboard controls for character movement and actions
- 3D model rendering with animations
- Variable platform heights and gaps for challenging gameplay
- Animation system with support for looping and one-shot animations
- Character bounding box calculations
- Keyboard controls for movement (WASD/arrow keys), skills (Q/E/R/F), and mouse click for interactions
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

    - **`Experience.tsx`**: Main component responsible for the primary 3D scene configuration. Includes lighting `ambientLight`, environmental elements `Environment`, the `Player` component wrapped in `SideViewController`, the `FollowLight` component that must be included with the controller for proper lighting, and the floor `Floor`. It renders the core visual and interactive elements within the physics simulation configured in `GameScene.tsx`. The inclusion of both `SideViewController` and `FollowLight` is essential for the proper functioning of the side view environment.
    - **`Floor.tsx`**: Component defining and visually representing the ground plane in the 3D space. Has physical properties and implements procedurally generated platforms for the platformer gameplay.
    - **`Player.tsx`**: Component handling the logic related to the player character model (movement, rotation, animation state management).

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component (implementing the Pointer Lock feature), utilizes `KeyboardControls` for handling keyboard inputs, configures the physics simulation using the `Physics` component from `@react-three/rapier`, and loads the `Experience` component with `Suspense` to initialize the 3D rendering environment.
    - **`PreloadScene.tsx`**: Manages asset preloading before the game starts. Loads all assets defined in assets.json (models, textures, etc.) and displays a loading progress bar. Ensures all assets are loaded before the game begins.

  - **`ui/`**: Directory containing components related to the user interface (UI). (Currently empty)

### Key Libraries & Components from External Sources

- **`vibe-starter-3d`**: A library providing foundational 3D game components and utilities.
  - **`SideViewController`**: Wraps the player character and manages side view navigation by implementing a character controller with physics. It handles character movement, jumping mechanics, and camera following with a fixed side-view perspective.
  - **`CharacterRenderer`**: Renders 3D character models with animations from glTF/GLB files. Manages animation states and transitions based on player actions.
  - **`useControllerState`**: A React hook that provides control state management for the character, including:
    - `setEnableInput`: Function to enable/disable player input controls
    - `rigidBody`: Reference to the physics body for the character
  - **`useMouseControls`**: A React hook that provides access to mouse input state (left/right buttons and positions).

### Side View System Implementation

The side view platformer system is implemented through a combination of components:

1. **Controller System**: `SideViewController` from the vibe-starter-3d library handles the physics-based movement of the character based on keyboard inputs, implementing platformer mechanics like jumping and gravity with a fixed camera angle that provides the side view perspective.

2. **Input Management**: Keyboard inputs are captured through React Three Fiber's `useKeyboardControls` hook, which maps WASD/arrow keys to movement actions (with special emphasis on jump controls essential for platformer gameplay).

3. **State Management**: `useControllerState` hook provides shared state between components, allowing different parts of the application to access and modify the character's state. Additionally, `playerStore` manages physics body references.

4. **Animation Management**: `Player` component determines appropriate animations based on movement and action states, with special attention to jump, fall, and landing animations essential for platformer games.

5. **Platform Generation**: Procedurally generated platforms create the game environment, with varying heights and distances to create challenging platforming gameplay.

6. **Asset Management**: `PreloadScene` component ensures all 3D models, textures, and other assets are preloaded before gameplay begins, providing a smooth user experience with a visual loading indicator.
