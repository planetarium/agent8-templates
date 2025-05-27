# Basic 3D First Person View (FPV) - FPS

## Project Summary

This project is a single-player First Person View (FPV) 3D FPS game built using Three.js and React Three Fiber.

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

- Keyboard-controlled character movement (WASD/Arrow keys)
- Attack by clicking the left mouse button
- First person view camera that follows the character
- Physics-based character movement with collision detection
- 3D environment with floor
- Pointer lock for immersive control
- FPS-style crosshair overlay for targeting
- Rigid body object type system for physics collision detection

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

- File for managing asset metadata. (Currently empty)

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`character.ts`**: Defines character-related settings (e.g., movement speed, jump height).
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, firing, etc.).
  - **`rigidBodyObjectType.ts`**: Defines constant values for different types of rigid body objects in the physics simulation (e.g., LOCAL_PLAYER, ENEMY, WALL, BULLET, FLOOR, etc.).

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`EffectContainer.tsx`**: Groups and manages various visual effect components like bullets and muzzle flash.
    - **`Experience.tsx`**: Main component responsible for the primary 3D scene configuration. Sets up ambient lighting, environment preset (sunset), and includes the `Player` and `Floor` components.
    - **`Floor.tsx`**: Defines and visually represents the ground plane in the 3D space. Has physical properties.
    - **`Player.tsx`**: Component defining the player character using the `RigidBodyPlayer` component from vibe-starter-3d. Handles player state management, animation configurations, shooting mechanics, and object interactions through `onTriggerEnter` and `onTriggerExit` events. The character is set to invisible for FPS view, and includes comprehensive collision detection with other rigid body objects using the RigidBodyObjectType system.
    - **`effects/`**: Sub-directory containing components related to visual effects.
      - **`Bullet.tsx`**: Component defining the visual representation and behavior of bullets fired from the player.
      - **`BulletEffectController.tsx`**: Manages the entire bullet effect system, including creation, state updates, and recycling (Object Pooling).
      - **`Explosion.tsx`**: Component that creates and manages explosion visual effects.
      - **`MuzzleFlash.tsx`**: Component that generates and manages the flash effect occurring at the muzzle when firing a gun.

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component with shadow support and pointer lock functionality. Utilizes `KeyboardControls` for handling keyboard inputs, configures the physics simulation using the `Physics` component from `@react-three/rapier`. Inside the physics context, it includes `FollowLight`, `FirstPersonViewController`, `Experience`, and `EffectContainer` components wrapped in `Suspense`. Also renders the `Crosshair` UI component as an overlay.

  - **`ui/`**: Contains UI components for the game interface.
    - **`Crosshair.tsx`**: Renders a centered crosshair overlay for FPS-style targeting with white lines and black outline for better visibility across different backgrounds.

### `src/stores/`

- Directory containing Zustand stores for application state management.
  - **`effectStore.ts`**: Store that manages the state of visual effects like bullets (e.g., creation, active/inactive).
  - **`playerStore.ts`**: Store that manages the player's state, such as health, ammo, etc.

### `src/types/`

- Directory containing TypeScript type definitions.
  - **`effect.ts`**: Defines types related to visual effects (Effect).
  - **`index.ts`**: Exports types from within the `types` directory.

### `src/utils/`

- Directory containing utility functions used throughout the application.
  - **`effectUtils.ts`**: Provides utility functions for creating effect configurations, such as bullet and explosion effects.
