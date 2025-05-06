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

- Keyboard-controlled character movement (WASD/Arrow keys) and attack (Spacebar)
- Free view camera that follows the character
- Pointer lock for immersive control

## File Structure Overview

### `src/main.tsx`

- Entry point for the application.
- Sets up React rendering and mounts the `App` component.

### `src/App.tsx`

- Main application component.
- Configures the overall layout and includes the `GameScene` and UI component `StatusDisplay`.

### `src/App.css`

- Defines the main styles for the `App` component and its child UI elements.

### `src/index.css`

- Defines global base styles, Tailwind CSS directives, fonts, etc., applied throughout the application.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, firing, etc.).
  - **`aircraft.ts`**: Defines constant values related to the aircraft, such as speed, rotation limits, etc.

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Aircraft.tsx`**: Component handling the logic related to the player-controlled aircraft model (movement, rotation, bullet firing trigger).
    - **`Player.tsx`**: Component representing the player character in the 3D scene, potentially encompassing the aircraft and other player-specific elements.
    - **`Experience.tsx`**: Main component responsible for the primary 3D scene configuration. It sets up the sky environment using `Sky` from `@react-three/drei` and provides basic lighting with `ambientLight`. It utilizes `FlightViewController` from `vibe-starter-3d` to wrap the `Player` component, handling flight control logic. It also includes the `Ground` and `FloatingShapes` components to complete the scene.
    - **`FloatingShapes.tsx`**: Component generating and managing various 3D shapes floating randomly in the scene.
    - **`Ground.tsx`**: Component defining and visually representing the ground plane in the 3D space. Has physical properties.
    - **`EffectContainer.tsx`**: Container component managing and rendering various visual effects like bullet firing and hit effects.
    - **`effects/`**: Directory containing specific visual effect components.
      - **`Bullet.tsx`**: Component defining the visual representation and individual behavior (movement, collision detection) of bullets fired from the airplane.
      - **`BulletEffectController.tsx`**: Controller component responsible for creating and managing bullet-related effects (e.g., firing, collision). (Potential for Object Pooling usage)
      - **`MuzzleFlash.tsx`**: Component representing the muzzle flash effect.

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component (implementing the Pointer Lock feature), utilizes `KeyboardControls` for handling keyboard inputs, configures the physics simulation using the `Physics` component from `@react-three/rapier`, includes the `EffectContainer`, and loads the `Experience` component with `Suspense` to initialize the 3D rendering environment.

  - **`ui/`**: Contains components related to the user interface (UI).
    - **`StatusDisplay.tsx`**: UI component displaying game state information (e.g., airplane speed, altitude) on the screen.

### `src/stores/`

- Directory containing state management logic (e.g., Zustand).
  - **`effectStore.ts`**: Store for managing effect-related state (e.g., bullets, explosions).
  - **`playerStore.ts`**: Store for managing player-related state (e.g., position, status).

### `src/types/`

- Directory containing TypeScript type definitions.
  - **`effect.ts`**: Defines effect-related types.
  - **`index.ts`**: Exports types from the `types` directory.

### `src/utils/`

- Directory containing utility functions used across the application.
  - **`effectUtils.ts`**: Contains utility functions specifically related to managing and calculating visual effects.
