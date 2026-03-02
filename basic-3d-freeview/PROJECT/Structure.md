# Basic 3D Free View

## Project Summary

This project is a 3D character controller with free view camera, built using Three.js and React Three Fiber. It features a player character that can be controlled with keyboard inputs in a 3D environment. The character supports various animations including idle, walking, running, jumping, punching, kicking, melee attacks, casting, hit reactions, dancing, swimming, and death. The camera follows the character with a free-view perspective, allowing users to navigate through the 3D space. The project includes state management with Zustand, collision detection, and game server integration for multiplayer capabilities.

## Implementation Strategy

This project uses a **Three.js-based 3D approach** because:

- It requires real-time 3D character animation and control
- Three.js provides efficient 3D rendering in web browsers
- React Three Fiber simplifies integration with React components
- The vibe-starter-3d library provides essential character rendering and animation tools

Key technologies:

- Three.js for 3D rendering
- React Three Fiber for React integration
- @react-three/rapier for physics simulation
- @react-three/drei for useful Three.js helpers
- vibe-starter-3d for character rendering and animation
- Zustand for state management
- @agent8/gameserver for multiplayer game server integration
- Tailwind CSS for styling

## Implemented Features

- Keyboard-controlled character movement (WASD/Arrow keys)
- Extensive character animations (idle, walk, run, jump, punch, kick, melee attack, cast, hit, dance, swim, die)
- Free view camera that follows the character
- Physics-based character movement with collision detection
- Advanced character state management system with Zustand
- 3D environment with floor and environmental lighting
- Directional and ambient lighting with sunset environment preset
- Animation system with support for looping and one-shot animations
- Character bounding box calculations
- Pointer lock for immersive control
- Collision trigger system using RigidBodyPlayer's onTriggerEnter/onTriggerExit events for object interactions
- Game server integration for multiplayer support
- Player reference management system

## File Structure Overview

### `src/main.tsx`

- Entry point for the application.
- Sets up React rendering and mounts the `App` component.

### `src/App.tsx`

- Main application component.
- Configures the overall layout and includes the `GameScene` component.

### `src/App.css`

- Defines the main styles for the `App` component and its child UI elements.

### `src/index.css`

- Defines global base styles, Tailwind CSS directives, fonts, etc., applied throughout the application.

### `src/assets.json`

- File for managing asset metadata. Includes character model and animation information.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, jump, etc.).
  - **`character.ts`**: Defines character-related constants including extensive animation states (idle, walk, run, jump, punch, kick, melee attack, cast, hit, dance, swim, die).
  - **`rigidBodyObjectType.ts`**: Defines constants for different types of rigid body objects in the physics simulation (player, enemy, monster, wall, obstacle, item, bullet, floor, etc.).

### `src/stores/`

- Directory containing state management stores using Zustand.
  - **`gameStore.ts`**: Store that manages the overall game state. Tracks and controls the readiness state of the map physics system (`isMapPhysicsReady`). This state is used to determine physics simulation pause/resume and loading screen display.
  - **`localPlayerStore.ts`**: Store that manages the local player's state, such as position tracking.
  - **`multiPlayerStore.ts`**: Store that manages multiple connected players' rigid body references for multiplayer functionality, including registration, unregistration, and retrieval of player references.
- **`playerActionStore.ts`**: Store that manages player action states including combat actions (punch, kick, meleeAttack, cast) with support for setting, getting, and resetting action states.

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Experience.tsx`**: Simplified 3D scene component that focuses on core scene elements. Includes ambient lighting with 0.7 intensity, sunset environment preset (background disabled), the `Player` component, and the `Floor` component. This component has been streamlined to contain only essential scene elements.
    - **`Floor.tsx`**: Component defining and visually representing the ground plane in the 3D space. Has physical properties.
    - **`GameSceneCanvas.tsx`**: React Three Fiber Canvas component that renders the 3D game world with physics simulation and controller setup.
    - **`MapPhysicsReadyChecker.tsx`**: Component that checks if the map physics system is ready by performing raycasting from above downward to detect map geometry and ensures physics interactions are properly initialized before gameplay begins. Performs checks every frame until valid map geometry is detected, with a timeout after 180 frames to prevent infinite checking. Excludes Capsule shapes (likely characters/objects) and sensor colliders from the inspection.
    - **`Player.tsx`**: Advanced component built around the `RigidBodyPlayer` component from vibe-starter-3d for physics-based character control. Handles comprehensive player character logic including movement, rotation, extensive animation state management (idle, walk, run, jump, punch, kick, melee attack, cast, hit, dance, swim, die), collision detection, game server integration, and player reference management. Features sophisticated animation configuration mapping and state determination logic. Utilizes `RigidBodyPlayer`'s `onTriggerEnter` and `onTriggerExit` events to handle player interactions with other objects in the 3D environment, enabling collision-based gameplay mechanics. Integrates with `CharacterRenderer` for visual representation and animation playback.

  - **`scene/`**: Contains components related to scene setup.

    - **`GameScene.tsx`**: Main game scene component that serves as a layout container arranging the game UI and 3D Canvas. Contains critical performance warnings and guidelines to prevent re-rendering issues. Includes the `GameSceneCanvas` and `GameSceneUI` components in a proper layered structure where the Canvas renders the 3D world and UI components render as overlays.

  - **`ui/`**: Contains UI components for the game interface.
    - **`GameSceneUI.tsx`**: Component that manages UI overlays for the game scene.
    - **`LoadingScreen.tsx`**: Loading screen component displayed during game loading.
    - **`InputController.tsx`**: Manages all input handling including keyboard, mouse, and touch controls with virtual joystick support for mobile devices and action buttons for combat actions (punch, kick, melee attack, cast) and movement controls.
