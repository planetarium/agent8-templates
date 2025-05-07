# 3D Quarter View Game

## Project Summary

This project is a 3D game where players control a character from a quarter view perspective. The game features character animations, physics-based movement, and a 3D environment. Players can control the character using keyboard to perform various actions (idle, running, jumping, attacking, etc.). This project is intended for single-player gameplay with an emphasis on character control and animation.

## Implementation Strategy

This game uses a **Three.js-based 3D approach**:

- React Three Fiber for 3D rendering in a React environment
- @react-three/rapier for physics simulation
- vibe-starter-3d library for character rendering and animation
- Quarter view camera setup providing an angled top-down view of the game world

Key technologies:

- Three.js - 3D rendering
- React Three Fiber - React integration
- @react-three/rapier - Physics simulation
- @react-three/drei - Useful Three.js helpers
- vibe-starter-3d - Character rendering and animation
- Tailwind CSS - UI composition

## Implemented Features

- Character animations (idle, run, sprint, jump, punch, kick, normal_attack, cast etc.)
- Various character state management (IDLE, RUN, SPRINT, JUMP, PUNCH, KICK, NORMAL_ATTACK, CAST, etc.)
- Physics-based character movement
- Quarter view camera perspective
- Environmental collision detection
- Keyboard controls (WASD for moving, QERF for actions)
- 3D model rendering with animations
- Interactive ground plane
- Animation system with support for looping and one-shot animations
- Character bounding box calculations
- Keyboard controls for movement (WASD/arrow keys), skills (Q/E/R/F), and mouse click for interactions

## File Structure Overview

#### `src/main.tsx`

- Entry point for the application.
- Sets up React rendering and mounts the `App` component.

#### `src/App.tsx`

- Main application component.
- Configures the overall layout and includes the `GameScene` component.

### `src/App.css`

- Defines the main styles for the `App` component and its child UI elements.

### `src/index.css`

- Defines global base styles, Tailwind CSS directives, fonts, etc., applied throughout the application.

#### `src/assets.json`

- File for managing asset metadata. Includes character model and animation information.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, jump, etc.).
  - **`character.ts`**: Defines character-related constants (animation states, speed, etc.).

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Experience.tsx`**: Main component responsible for the primary 3D scene configuration. Includes lighting `ambientLight`, environmental elements `Environment`, the `Player` component wrapped in `QuarterViewController`, and the floor `Floor`. It renders the core visual and interactive elements within the physics simulation configured in `GameScene.tsx`.
    - **`Floor.tsx`**: Component defining and visually representing the ground plane in the 3D space. Has physical properties.
    - **`Player.tsx`**: Component handling the logic related to the player character model (movement, rotation, animation state management).

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component (implementing the Pointer Lock feature), utilizes `KeyboardControls` for handling keyboard inputs, configures the physics simulation using the `Physics` component from `@react-three/rapier`, and loads the `Experience` component with `Suspense` to initialize the 3D rendering environment.

  - **`ui/`**: Directory containing components related to the user interface (UI). (Currently empty)

### Key Libraries & Components from External Sources

- **`vibe-starter-3d`**: A library providing foundational 3D game components and utilities.
  - **`QuarterViewController`**: Wraps the player character and manages quarter view navigation by implementing a character controller with physics. It handles character movement, rotation, and camera following with a fixed quarter-view perspective.
  - **`CharacterRenderer`**: Renders 3D character models with animations from glTF/GLB files. Manages animation states and transitions based on player actions.
  - **`useControllerState`**: A React hook that provides control state management for the character, including:
    - `setEnableInput`: Function to enable/disable player input controls
    - `rigidBody`: Reference to the physics body for the character
  - **`useMouseControls`**: A React hook that provides access to mouse input state (left/right buttons and positions).

### Quarter View System Implementation

The quarter view control system is implemented through a combination of components:

1. **Controller System**: `QuarterViewController` from the vibe-starter-3d library handles the physics-based movement of the character based on keyboard inputs, maintaining a fixed camera angle that provides the quarter view perspective.

2. **Input Management**: Keyboard inputs are captured through React Three Fiber's `useKeyboardControls` hook, which maps WASD/arrow keys to movement, and additional keys (Q/E/R/F) to character actions.

3. **State Management**: `useControllerState` hook provides shared state between components, allowing different parts of the application to access and modify the character's state.

4. **Animation Management**: `Player` component determines appropriate animations based on movement and action states, transitioning between idle, walking, running, and action animations as needed.
