# 3D Simulation Environment

## Project Summary

This project is a 3D simulation environment where players can navigate in an open 3D space with a free camera perspective. The game features an interactive object selection system, character animations, physics-based movement, and a 3D environment. Players can control the character using keyboard to move around and use mouse to select various objects in the scene. Selected objects are highlighted with a circular outline effect. This project is intended for demonstrating interactive 3D simulations with an emphasis on object selection and free camera control.

## Implementation Strategy

This game uses a **Three.js-based 3D approach**:

- React Three Fiber for 3D rendering in a React environment
- @react-three/rapier for physics simulation
- vibe-starter-3d library for character rendering and animation
- Free camera controller with simulation view
- Object selection system with visual feedback

Key technologies:

- Three.js - 3D rendering
- React Three Fiber - React integration
- @react-three/rapier - Physics simulation
- @react-three/drei - Useful Three.js helpers
- vibe-starter-3d - Character rendering and animation
- Tailwind CSS - UI composition
- Zustand - State management

## ⚠️ CRITICAL DEVELOPMENT GUIDELINES ⚠️

### RigidBodyObject Usage - MANDATORY REQUIREMENT

**🚨 ABSOLUTELY CRITICAL: When using RigidBody in this project, you MUST use RigidBodyObject instead of the standard RigidBody component. This is a non-negotiable requirement.**

**Why RigidBodyObject is mandatory:**

- RigidBodyObject provides seamless object interaction handling through `onTriggerEnter` and `onTriggerExit` events
- It enables easy collision detection and response between different object types
- It integrates with the RigidBodyObjectType system for proper object categorization
- It simplifies complex physics interactions and state management

**DO NOT:**

- Use standard RigidBody components directly
- Remove or modify this guideline
- Ignore this requirement when adding new physics objects

**ALWAYS:**

- Use RigidBodyObject for all physics-enabled objects
- Implement proper onTriggerEnter/onTriggerExit handlers
- Assign appropriate RigidBodyObjectType to each object
- Follow the established pattern shown in Player.tsx and other components

**This guideline must never be removed or modified. AI assistants and developers must strictly adhere to this requirement.**

## Implemented Features

- Object selection system with visual highlighting (circular outline effect)
- Character animations (idle, run, sprint, jump, punch, kick, normal_attack, cast etc.)
- Various character state management (IDLE, RUN, SPRINT, JUMP, PUNCH, KICK, NORMAL_ATTACK, CAST, etc.)
- Physics-based character movement
- Free camera perspective with simulation controls
- Environmental collision detection
- Keyboard controls for character movement
- Mouse controls for object selection
- 3D model rendering with animations
- Interactive geometric objects (boxes, spheres, cone)
- Animation system with support for looping and one-shot animations
- Character bounding box calculations
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
  - **`selectStore.js`**: Manages object selection state, including selected object UUID, selection and deselection functionality.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, jump, etc.).
  - **`character.ts`**: Defines character-related constants (animation states, speed, etc.).

### Components

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Experience.tsx`**: Main component responsible for the primary 3D scene configuration. Includes lighting (`ambientLight`), environmental elements (`Environment`), debugging grid (`Grid`), and the `Floor` component. It also provides the `SimulationViewController` for camera control and `FollowLight` component for character lighting. Contains logic to clear object selection when clicking on the floor, and renders the visual and interactive elements within the physics simulation configured in `GameScene.tsx`. The inclusion of both `SimulationViewController` and `FollowLight` is essential for the proper functioning of the simulation environment.
    - **`Floor.tsx`**: Component defining and visually representing the ground plane in the 3D space. Has physical properties.
    - **`Player.tsx`**: Component handling the logic related to the player character model (movement, rotation, animation state management).
    - **`Selectable.tsx`**: Component that wraps 3D objects to make them selectable. Handles click events and adds visual feedback when objects are selected.

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component (implementing the Pointer Lock feature), utilizes `KeyboardControls` for handling keyboard inputs, configures the physics simulation using the `Physics` component from `@react-three/rapier`, and loads the `Experience` component with `Suspense` to initialize the 3D rendering environment.
    - **`PreloadScene.tsx`**: Manages asset preloading before the game starts. Loads all assets defined in assets.json (models, textures, etc.) and displays a loading progress bar. Ensures all assets are loaded before the game begins.

  - **`custom/`**: Contains custom utility components.

    - **`CircularOutline.tsx`**: Creates a pulsating circular outline effect that appears on the ground under selected objects, providing visual feedback for the selection system.

  - **`ui/`**: Directory containing components related to the user interface (UI). (Currently empty)

### Key Libraries & Components from External Sources

- **`vibe-starter-3d`**: A library providing foundational 3D game components and utilities.
  - **`SimulationViewController`**: Wraps the player character and manages simulation view navigation by implementing a character controller with physics. It handles character movement, rotation, and camera control with a free perspective.
  - **`CharacterRenderer`**: Renders 3D character models with animations from glTF/GLB files. Manages animation states and transitions based on player actions.
  - **`useControllerState`**: A React hook that provides control state management for the character, including:
    - `setEnableInput`: Function to enable/disable player input controls
    - `rigidBody`: Reference to the physics body for the character
  - **`FollowLight`**: A directional light that follows the character to ensure consistent lighting.

### Simulation System Implementation

The simulation system is implemented through a combination of components:

1. **Controller System**: `SimulationViewController` from the vibe-starter-3d library handles the physics-based movement of the character based on keyboard inputs, maintaining a free camera that can be controlled by the player.

2. **Selection System**: `Selectable` component and `useSelectStore` hook work together to manage object selection. When a user clicks on a selectable object, it becomes highlighted with a `CircularOutline` effect.

3. **State Management**: `useControllerState` hook provides shared state between components, allowing different parts of the application to access and modify the character's state. Additionally, `playerStore` manages physics body references, and `selectStore` manages object selection state.

4. **Animation Management**: `Player` component determines appropriate animations based on movement and action states, transitioning between idle, walking, running, and action animations as needed.

5. **Visual Feedback**: `CircularOutline` component creates a pulsating circular effect on the ground under selected objects, providing clear visual feedback to the user.

6. **Asset Management**: `PreloadScene` component ensures all 3D models, textures, and other assets are preloaded before gameplay begins, providing a smooth user experience with a visual loading indicator.
