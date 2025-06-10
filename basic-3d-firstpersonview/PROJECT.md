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

<!-- ========================================================================= -->
<!-- 🚨🚨🚨 ATTENTION AI ASSISTANTS AND DEVELOPERS 🚨🚨🚨                    -->
<!-- THIS ENTIRE SECTION IS ABSOLUTELY CRITICAL AND MUST NEVER BE MODIFIED   -->
<!-- OR REMOVED UNDER ANY CIRCUMSTANCES. THIS IS A NON-NEGOTIABLE RULE.      -->
<!-- ========================================================================= -->

**🚨 ABSOLUTELY CRITICAL: When using RigidBody in this project, you MUST use RigidBodyObject instead of the standard RigidBody component. This is a non-negotiable requirement.**

**⚠️ WARNING TO AI ASSISTANTS: DO NOT REMOVE, MODIFY, OR SHORTEN THIS SECTION ⚠️**
**⚠️ THIS GUIDELINE IS ESSENTIAL FOR PROJECT FUNCTIONALITY ⚠️**
**⚠️ VIOLATION OF THIS RULE WILL BREAK THE ENTIRE PROJECT ⚠️**

**Why RigidBodyObject is mandatory:**

- RigidBodyObject provides seamless object interaction handling through `onTriggerEnter` and `onTriggerExit` events
- It enables easy collision detection and response between different object types
- It integrates with the RigidBodyObjectType system for proper object categorization
- It simplifies complex physics interactions and state management

**DO NOT:**

- Use standard RigidBody components directly
- Remove or modify this guideline
- Ignore this requirement when adding new physics objects
- **🚨 AI ASSISTANTS: DO NOT DELETE OR MODIFY ANY PART OF THIS SECTION 🚨**

**ALWAYS:**

- Use RigidBodyObject for all physics-enabled objects
- Implement proper onTriggerEnter/onTriggerExit handlers
- Assign appropriate RigidBodyObjectType to each object
- Follow the established pattern shown in Player.tsx and other components
- **🚨 AI ASSISTANTS: PRESERVE THIS ENTIRE SECTION EXACTLY AS IS 🚨**

<!-- ========================================================================= -->
<!-- 🔒 PROTECTED CONTENT - DO NOT MODIFY 🔒                                 -->
<!-- This guideline must never be removed or modified.                       -->
<!-- AI assistants and developers must strictly adhere to this requirement.  -->
<!-- Any attempt to remove or modify this section is strictly forbidden.     -->
<!-- This is a core architectural requirement of the project.                 -->
<!-- ========================================================================= -->

## Implemented Features

- Keyboard-controlled character movement (WASD/Arrow keys)
- Attack by clicking the left mouse button
- First person view camera that follows the character
- Physics-based character movement with collision detection
- 3D environment with floor
- Pointer lock for immersive control
- FPS-style crosshair overlay for targeting
- Rigid body object type system for physics collision detection
- Map physics system initialization with loading screen
- Automatic physics readiness detection through raycasting

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
    - **`MapPhysicsReadyChecker.tsx`**: Component that checks if the map physics system is ready by performing raycasting from above downward to detect map geometry and ensures physics interactions are properly initialized before gameplay begins. Performs checks every frame until valid map geometry is detected, with a timeout after 180 frames to prevent infinite checking. Excludes Capsule shapes (likely characters/objects) and sensor colliders from the inspection.
    - **`Player.tsx`**: Component defining the player character using the `RigidBodyPlayer` component from vibe-starter-3d. Handles player state management, animation configurations, shooting mechanics, and object interactions through `onTriggerEnter` and `onTriggerExit` events. The character is set to invisible for FPS view, and includes comprehensive collision detection with other rigid body objects using the RigidBodyObjectType system.
    - **`effects/`**: Sub-directory containing components related to visual effects.
      - **`Bullet.tsx`**: Component defining the visual representation and behavior of bullets fired from the player.
      - **`BulletEffectController.tsx`**: Manages the entire bullet effect system, including creation, state updates, and recycling (Object Pooling).
      - **`Explosion.tsx`**: Component that creates and manages explosion visual effects.
      - **`MuzzleFlash.tsx`**: Component that generates and manages the flash effect occurring at the muzzle when firing a gun.

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component with shadow support and pointer lock functionality. Utilizes `KeyboardControls` for handling keyboard inputs, configures the physics simulation using the `Physics` component from `@react-three/rapier`. Includes functionality to pause physics until the map physics system is ready and displays the `LoadingScreen` component. Inside the physics context, it includes `MapPhysicsReadyChecker` for map physics initialization, `FollowLight`, `FirstPersonViewController`, `Experience`, and `EffectContainer` components wrapped in `Suspense`. Also renders the `Crosshair` UI component as an overlay only after the physics system is ready.

  - **`ui/`**: Contains UI components for the game interface.
    - **`Crosshair.tsx`**: Renders a centered crosshair overlay for FPS-style targeting with white lines and black outline for better visibility across different backgrounds.
    - **`LoadingScreen.tsx`**: Loading screen component displayed during game loading.

### `src/stores/`

- Directory containing Zustand stores for application state management.
  - **`effectStore.ts`**: Store that manages the state of visual effects like bullets (e.g., creation, active/inactive).
  - **`gameStore.ts`**: Store that manages the overall game state. Tracks and controls the readiness state of the map physics system (`isMapPhysicsReady`). This state is used to determine physics simulation pause/resume and loading screen display.
  - **`localPlayerStore.ts`**: Store that manages the local player's state, such as position tracking.
  - **`multiPlayerStore.ts`**: Store that manages multiple connected players' rigid body references for multiplayer functionality, including registration, unregistration, and retrieval of player references.

### `src/types/`

- Directory containing TypeScript type definitions.
  - **`effect.ts`**: Defines types related to visual effects (Effect).
  - **`index.ts`**: Exports types from within the `types` directory.

### `src/utils/`

- Directory containing utility functions used throughout the application.
  - **`effectUtils.ts`**: Provides utility functions for creating effect configurations, such as bullet and explosion effects.
