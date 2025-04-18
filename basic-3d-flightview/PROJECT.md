# Basic 3D Flight View

## Project Summary

This project is a single-player game where you can control and fly an airplane in a 3D space. It is built using Three.js and React Three Fiber.

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
- Tailwind CSS for styling

## Implemented Features

- Keyboard-controlled character movement (WASD/Arrow keys)
- Free view camera that follows the character
- Physics-based character movement with collision detection
- 3D environment with grid floor
- Directional and ambient lighting
- Pointer lock for immersive control

## File Structure Overview

### `src/main.tsx`

- Entry point for the application.
- Sets up React rendering and mounts the `App` component.

### `src/App.tsx`

- Main application component.
- Configures the overall layout and includes the `GameScene` and UI component (`StatusDisplay`).

### `src/App.css`

- Defines the main styles for the `App` component and its child UI elements.

### `src/index.css`

- Defines global base styles, Tailwind CSS directives, fonts, etc., applied throughout the application.

### `src/assets.json`

- File for managing asset metadata. (Currently empty)

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, firing, etc.).

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Airplane.tsx`**: Component handling the logic related to the player-controlled airplane model (movement, rotation, bullet firing).
    - **`Bullet.tsx`**: Component defining the visual representation and behavior of bullets fired from the airplane.
    - **`BulletManager.tsx`**: Component managing the entire bullet system, including creation, state updates, and recycling (Object Pooling).
    - **`Experience.tsx`**: Main component responsible for the primary 3D scene configuration. Includes lighting, environmental elements, player (`Airplane`), floor (`Ground`), floating shapes (`FloatingShapes`), bullet management (`BulletManager`), and manages physics engine settings.
    - **`FloatingShapes.tsx`**: Component generating and managing various 3D shapes floating randomly in the scene.
    - **`Ground.tsx`**: Component defining and visually representing the ground plane in the 3D space. Has physical properties.
    - **`MotionBlur.tsx`**: Post-processing component applying a motion blur effect to the screen.

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component, implements the Pointer Lock feature, and loads the `Experience` component with `Suspense` to initialize the 3D rendering environment.

  - **`ui/`**: Contains components related to the user interface (UI).
    - **`StatusDisplay.tsx`**: UI component displaying game state information (e.g., airplane speed, altitude) on the screen.
