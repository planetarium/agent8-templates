# 3D Point-to-Move Game

## Project Summary

This project is a 3D game where players control a character through a point-and-click movement system from a quarter view perspective. The game features character animations, physics-based movement, and a 3D environment. Players can click on the ground to move their character and use keyboard inputs to perform various actions (walking, running, jumping, attacking, etc.). This project is intended for single-player gameplay with an emphasis on intuitive mouse-based navigation.

## Implementation Strategy

This game uses a **Three.js-based 3D approach**:

- React Three Fiber for 3D rendering in a React environment
- @react-three/rapier for physics simulation
- vibe-starter-3d library for character rendering and animation
- Quarter view camera setup providing an angled top-down view of the game world
- Raycasting system for converting screen clicks to world positions

Key technologies:

- Three.js - 3D rendering
- React Three Fiber - React integration
- @react-three/rapier - Physics simulation
- @react-three/drei - Useful Three.js helpers
- vibe-starter-3d (v0.4.0) - Advanced character rendering, animation, and physics integration
- Tailwind CSS - UI composition
- Zustand - State management

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

## Core Features

- **Point-and-Click Movement**: Interactive movement system with ground targeting and visual feedback
- **Advanced Character System**: Comprehensive character rendering with physics-based rigid body integration
- **Animation Management**: Complete animation system supporting idle, run, sprint, jump, punch, kick, normal_attack, cast, and other character states
- **Physics Integration**: Full physics simulation with collision detection and rigid body object type definitions
- **Quarter View Camera**: Orthographic camera perspective optimized for point-to-move gameplay
- **Interactive Controls**: Mouse-based navigation with keyboard action controls (QWER for various actions)
- **Visual Feedback System**: Click effect animations and targeting indicators for enhanced user experience
- **Asset Management**: Comprehensive preloading system with progress indication for smooth gameplay
- **3D Environment**: Interactive ground plane with environmental collision detection
- **State Management**: Robust character state transitions and player reference tracking for multiplayer readiness

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

- Directory containing state management stores using Zustand.
  - **`localPlayerStore.ts`**: Store that manages the local player's state, such as position tracking.
  - **`multiPlayerStore.ts`**: Store that manages multiple connected players' rigid body references for multiplayer functionality, including registration, unregistration, and retrieval of player references.

### `src/constants/`

- Directory defining constant values used throughout the application.
  - **`controls.ts`**: Defines settings that map keyboard inputs (WASD, arrow keys, etc.) to corresponding actions (movement, jump, etc.).
  - **`character.ts`**: Defines character-related constants (animation states, speed, etc.).
  - **`rigidBodyObjectType.ts`**: Defines physics object types for collision detection and interaction systems.

### Components

### `src/components/`

- Directory managing React components categorized by function.

  - **`r3f/`**: Contains 3D components related to React Three Fiber.

    - **`Experience.tsx`**: Main component responsible for the primary 3D scene configuration. Includes lighting `ambientLight`, environmental elements `Environment`, the `Player` component, and the floor `Floor`. It renders the core visual and interactive elements within the physics simulation configured in `GameScene.tsx`.
    - **`Floor.tsx`**: Component defining and visually representing the ground plane in the 3D space. Has physical properties.
    - **`Player.tsx`**: Advanced player component integrating RigidBodyPlayer with CharacterRenderer for comprehensive character management, physics interactions, and animation state management with collision detection capabilities.
    - **`PointingSystem.tsx`**: Core component for the point-and-click movement mechanics. Implements raycasting to convert screen clicks to world positions. Creates visual feedback when clicking on the ground (click effect).

  - **`scene/`**: Contains components related to 3D scene setup.

    - **`GameScene.tsx`**: Sets up the React Three Fiber `Canvas` component, utilizes `KeyboardControls` for handling keyboard inputs, configures the physics simulation using the `Physics` component from `@react-three/rapier`, integrates `PointToMoveController`, `FollowLight`, and `PointingSystem` within the physics context, and loads the `Experience` component with `Suspense` to initialize the 3D rendering environment.
    - **`PreloadScene.tsx`**: Manages asset preloading before the game starts. Loads all assets defined in assets.json (models, textures, etc.) and displays a loading progress bar. Ensures all assets are loaded before the game begins.

  - **`ui/`**: Directory containing components related to the user interface (UI). (Currently empty)

### Key Libraries & Components from External Sources

- **`vibe-starter-3d`**: A library providing foundational 3D game components and utilities.
  - **`PointToMoveController`**: Wraps the player character and manages point-to-move navigation by implementing a character controller with physics. It handles character movement, rotation, and camera following.
  - **`CharacterRenderer`**: Renders 3D character models with animations from glTF/GLB files. Manages animation states and transitions.
  - **`useControllerState`**: A React hook that provides control state management for the character, including:
    - `setEnableInput`: Function to enable/disable player input controls
    - `setMoveToPoint`: Function to set the destination point for character movement
    - `isPointMoving`: Function that returns whether the character is currently moving toward a point
    - `rigidBody`: Reference to the physics body for the character

### Point-to-Move System Implementation

The point-to-move system is implemented through a combination of components:

1. **Click Detection**: `PointingSystem` component uses raycasting to convert mouse clicks to 3D world positions, providing visual feedback at the clicked location.

2. **Movement Control**: `PointToMoveController` from the vibe-starter-3d library handles the physics-based movement of the character toward the destination point with orthographic camera integration.

3. **State Management**: `useControllerState` hook provides shared state between components, allowing the pointing system to set movement targets that the controller can read. Additionally, `playerStore` manages physics body references for multiplayer support.

4. **Animation Management**: `Player` component with `RigidBodyPlayer` integration determines appropriate animations based on movement state, using the `isPointMoving()` function to detect when the character should be in a movement animation state, with full collision detection capabilities.

5. **Asset Management**: `PreloadScene` component ensures all 3D models, textures, and other assets are preloaded before gameplay begins, providing a smooth user experience with a visual loading indicator.
