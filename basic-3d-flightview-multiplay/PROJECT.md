# Basic 3D Flight View

## Project Summary

This project is a multi-player game where you can control and fly an aircraft in a 3D space. It is built using Three.js and React Three Fiber.

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

This overview details the key files and directories within the `src/` directory.

### `src/main.tsx`

- Entry point for the React application.
- Sets up React rendering and mounts the `App` component.

### `src/App.tsx`

- Main application component.
- Configures the overall layout, routing (likely using `RoomManager`), and includes UI components.

### `src/App.css`

- Styles specific to the `App` component.

### `src/index.css`

- Global styles, including Tailwind CSS directives and base styles.

### `src/assets.json`

- Metadata for assets (currently may be unused or planned for future use).

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Maps keyboard inputs to game actions (e.g., movement, firing).

### `src/store/`

- State management logic (using Zustand).
  - **`effectStore.ts`**: Manages state related to visual effects (bullets, explosions).

### `src/types/`

- TypeScript type definitions.
  - **`effect.ts`**: Defines types for effects.
  - **`index.ts`**: Exports types from the directory.

### `src/components/`

- React components categorized by function.

  - **`r3f/`**: React Three Fiber components for the 3D scene.

    - **`Airplane.tsx`**: Logic for the player-controlled airplane (movement, rotation, firing).
    - **`Experience.tsx`**: Main 3D game experience setup (lighting, environment, physics, player, objects, effects). Loaded by `GameScene.tsx`.
    - **`FloatingShapes.tsx`**: Manages floating 3D shapes in the scene.
    - **`Ground.tsx`**: Defines the ground plane with physical properties.
    - **`EffectContainer.tsx`**: Manages visual effects rendering.
    - **`effects/`**: Specific visual effect components.
      - **`Bullet.tsx`**: Visual representation and behavior of bullets.
      - **`BulletEffectController.tsx`**: Manages bullet effect creation and lifecycle (potential for object pooling).
      - **`MuzzleFlash.tsx`**: Represents the muzzle flash effect.

  - **`scene/`**: Components managing different application scenes or stages.

    - **`RoomManager.tsx`**: Likely handles routing or switching between different rooms/scenes like Lobby, Game, etc., based on game state.
    - **`LobbyRoom.tsx`**: Component representing the game lobby UI and logic (e.g., player list, room selection).
    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` for the main 3D game, implements Pointer Lock, and loads the `Experience` component.
    - **`NicknameSetup.tsx`**: Component for players to set up their nickname before entering the lobby or game.

  - **`ui/`**: General user interface components.
    - **`StatusDisplay.tsx`**: UI component displaying game state information (e.g., airplane speed, altitude) during gameplay.
