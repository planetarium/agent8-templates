# Basic 3D Free View

## Project Summary

This project is a 3D character controller with free view camera, built using Three.js and React Three Fiber. It features a player character that can be controlled with keyboard inputs in a 3D environment. The character supports various animations including idle, walking, running, jumping, punching, and hit reactions. The camera follows the character with a free-view perspective, allowing users to navigate through the 3D space. This project is intended for multi-player gameplay.

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
- Character animations (idle, walk, run, jump, punch, hit, die)
- Free view camera that follows the character
- Physics-based character movement with collision detection
- Character state management system
- 3D environment with grid floor
- Directional and ambient lighting
- Animation system with support for looping and one-shot animations
- Character bounding box calculations
- Pointer lock for immersive control

## File Structure Overview

### `src/main.tsx`

- Entry point for the application.
- Sets up React rendering and mounts the `App` component.

### `src/App.tsx`

- Main application component.
- Sets up the Colyseus client and manages the room state (`RoomManager`) and the game scene (`GameScene`).
- Handles routing or state-based rendering between nickname setup, lobby screen, and game screen.

### `src/App.css`

- Defines the main styles for the `App` component and its child UI elements.

### `src/index.css`

- Defines global base styles, Tailwind CSS directives, fonts, etc., applied throughout the application.

### `src/assets.json`

- File for managing asset metadata. Includes character model and animation information.

### `src/vite-env.d.ts`

- Type definition file related to Vite.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, jump, etc.).
  - **`character.ts`**: Defines character-related constants (animation states, speed, etc.).

### `src/types/`

- Directory defining TypeScript types used in the application (e.g., `PlayerState`, `PlayerInput`).

### `src/hooks/`

- Directory defining reusable React hooks (e.g., `useKeyboardControls`).

### `src/stores/`

- Directory containing state management logic (e.g., Zustand).
  - **`playerStore.ts`**: Manages player-related state (nickname, selected character, etc.).
  - **`roomStore.ts`**: Manages Colyseus Room related state (room info, player list, etc.).

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Experience.tsx`**: Main component responsible for the primary 3D scene configuration. Includes lighting, environmental elements, the local player (`Player`), remote players (`NetworkContainer`), the floor (`Floor`), and manages physics engine settings.
    - **`Floor.tsx`**: Component defining and visually representing the ground plane in the 3D space. Has physical properties.
    - **`Player.tsx`**: Component handling the logic related to the local player character model (movement, rotation, animation state management, input processing, and sending to the server).
    - **`RemotePlayer.tsx`**: Component rendering remote player character models, animations, positions, etc., based on the state received from the server.
    - **`NetworkContainer.tsx`**: Manages all remote player states received from the server and renders a `RemotePlayer` component for each remote player.
    - **`CharacterPreview.tsx`**: Component for previewing character models, e.g., on the character selection screen.
    - **`EffectContainer.tsx`**: Component managing and applying postprocessing effects (e.g., Bloom, SSR).
    - **`effects/`**: Directory containing individual visual effect components (specific effect files can be added).

  - **`scene/`**: Contains components related to 3D scene setup and game state.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component (implementing the Pointer Lock feature), utilizes `KeyboardControls` for handling keyboard inputs, and loads the `Experience` component with `Suspense` to initialize the 3D rendering environment.
    - **`NicknameSetup.tsx`**: UI component where the user enters their nickname and selects a character.
    - **`LobbyRoom.tsx`**: Component that joins the Colyseus lobby room, displays the list of available game rooms, and provides UI for creating/joining rooms.
    - **`RoomManager.tsx`**: Component responsible for Colyseus Room connection and state management. Conditionally renders `NicknameSetup`, `LobbyRoom`, `GameScene`, etc., based on the connection status with the server.

  - **`ui/`**: Directory containing components related to the user interface (UI). (Currently empty)
