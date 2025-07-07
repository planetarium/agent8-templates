# Basic 3D Flight View

## Project Summary

This project is a single-player game where you can control and fly an aircraft in a 3D space. It is built using Three.js and React Three Fiber.

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
- @agent8/gameserver for multiplayer functionality
- Zustand for state management
- Tailwind CSS for styling

## Implemented Features

- Keyboard-controlled aircraft movement (WASD/Arrow keys) and attack (Spacebar)
- Free view camera that follows the aircraft
- Pointer lock for immersive control

## File Structure Overview

### `src/main.tsx`

- Entry point for the application.
- Sets up React rendering and mounts the `App` component.

### `src/App.tsx`

- Main application component and entry point.
- Sets up a full-screen container and renders the `GameScene` component, which handles all 3D scene setup and UI elements.

### `src/App.css`

- Defines the main styles for the `App` component and its child UI elements.

### `src/index.css`

- Defines global base styles, Tailwind CSS directives, fonts, etc., applied throughout the application.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, firing, etc.).
  - **`aircraft.ts`**: Defines constant values related to the aircraft, such as speed, rotation limits, etc.
  - **`rigidBodyObjectType.ts`**: Defines constant values for different types of rigid body objects used in physics simulation (player, enemy, wall, floor, sea, etc.).

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Aircraft.tsx`**: Component handling the logic related to the player-controlled aircraft model (movement, rotation, bullet firing trigger).
    - **`MapPhysicsReadyChecker.tsx`**: Component that checks if the map physics system is ready by performing raycasting from above downward to detect map geometry and ensures physics interactions are properly initialized before gameplay begins. Performs checks every frame until valid map geometry is detected, with a timeout after 180 frames to prevent infinite checking. Excludes Capsule shapes (likely characters/objects) and sensor colliders from the inspection.
    - **`Player.tsx`**: Main player component that uses `RigidBodyPlayer` from `vibe-starter-3d` for physics-based player control. It handles player registration, bullet firing with cooldown, position tracking, and reset functionality. **Key feature**: Uses `onTriggerEnter` and `onTriggerExit` events to handle player interactions with other objects in the scene (collision detection, area triggers, etc.). The component includes a custom `CuboidCollider` for precise collision detection and wraps the `Aircraft` component for visual representation.
    - **`Experience.tsx`**: Component that sets up the core 3D scene elements. Includes ambient lighting, Sky environment, Player, Ground, and FloatingShapes components.
    - **`FloatingShapes.tsx`**: Component generating and managing various 3D shapes floating randomly in the scene.
    - **`GameSceneCanvas.tsx`**: React Three Fiber Canvas component that renders the 3D game world with physics simulation and controller setup.
    - **`Ground.tsx`**: Component defining and visually representing the ground plane, runway, and scattered objects in the 3D space. It includes a sea plane, grass ground, runway with markings, and randomly generated objects (boxes, spheres, cones) scattered across the terrain. Has physical properties for collision detection.
    - **`EffectContainer.tsx`**: Container component managing and rendering various visual effects like bullet firing and hit effects.
    - **`effects/`**: Directory containing specific visual effect components.
      - **`Bullet.tsx`**: Component defining the visual representation and individual behavior (movement, collision detection) of bullets fired from the airplane.
      - **`BulletEffectController.tsx`**: Controller component responsible for creating and managing bullet-related effects (e.g., firing, collision). (Potential for Object Pooling usage)
      - **`MuzzleFlash.tsx`**: Component representing the muzzle flash effect.
      - **`Explosion.tsx`**: Component creating explosion and smoke particle effects when bullets hit targets or objects.

  - **`scene/`**: Contains components related to scene setup.

    - **`GameScene.tsx`**: Main game scene component that serves as a layout container arranging the game UI and 3D Canvas. Contains critical performance warnings and guidelines to prevent re-rendering issues. Includes the `GameSceneCanvas` and `GameSceneUI` components in a proper layered structure where the Canvas renders the 3D world and UI components render as overlays.

  - **`ui/`**: Contains UI components for the game interface.
    - **`GameSceneUI.tsx`**: Component that manages UI overlays for the game scene.
    - **`StatusDisplay.tsx`**: UI component displaying game state information (e.g., airplane speed, altitude) on the screen.
    - **`LoadingScreen.tsx`**: Loading screen component displayed during game loading.

### `src/stores/`

- Directory containing state management logic (e.g., Zustand).
  - **`effectStore.ts`**: Store for managing effect-related state (e.g., bullets, explosions).
  - **`gameStore.ts`**: Store that manages the overall game state. Tracks and controls the readiness state of the map physics system (`isMapPhysicsReady`). This state is used to determine physics simulation pause/resume and loading screen display.
  - **`localPlayerStore.ts`**: Store that manages the local player's state, such as position tracking and speed tracking.
  - **`multiPlayerStore.ts`**: Store that manages multiple connected players' rigid body references for multiplayer functionality, including registration, unregistration, and retrieval of player references.

### `src/types/`

- Directory containing TypeScript type definitions.
  - **`effect.ts`**: Defines effect-related types.
  - **`index.ts`**: Exports types from the `types` directory.

### `src/utils/`

- Directory containing utility functions used across the application.
  - **`effectUtils.ts`**: Contains utility functions specifically related to managing and calculating visual effects.
