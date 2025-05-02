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
- vibe-starter-3d - Character rendering and animation
- Tailwind CSS - UI composition

## Implemented Features

- Point-and-click movement system (click on the ground to move character)
- Targeting system with visual feedback (click effect animations)
- Character animations (idle, walk, run, jump, attack, etc.)
- Various character state management (IDLE, WALK, RUN, JUMP, PUNCH, KICK, etc.)
- Physics-based character movement with automatic pathfinding
- Quarter view camera perspective
- Environmental collision detection
- Keyboard and mouse control options
- 3D model rendering with animations
- Interactive ground plane
- Animation system with support for looping and one-shot animations
- Character bounding box calculations
- Raycasting for precise mouse interaction with the 3D environment

## File Structure Overview

### Core Files

#### `src/main.tsx`

- Entry point for the application
- Sets up React rendering

#### `src/App.tsx`

- Main application component
- Configures the root layout

#### `src/assets.json`

- Defines game assets including character models and animations
- Maps animation types to resource URLs

### Constants

#### `src/constants/character.ts`

- Defines character states (idle, walk, run, etc.)
- Provides enum values for animation system

#### `src/constants/controls.ts`

- Defines keyboard and mouse control mappings
- Sets up input configuration for player movement

### Components

#### 3D Components (`src/components/r3f/`)

##### `src/components/r3f/GameScene.tsx`

- Main game scene component
- Sets up physics and environment
- Integrates player and floor components
- Configures keyboard controls

##### `src/components/r3f/Experience.tsx`

- Sets up the 3D world environment
- Configures lighting, camera, and scene objects
- Activates physics engine
- Uses PointToMoveController for character movement
- Integrates the targeting system for click-to-move functionality

##### `src/components/r3f/Player.tsx`

- Player character with control logic
- Handles animations, movement, and state transitions
- Implements character controller and input handling
- Configures various character actions and animations
- Manages character bounding box calculations
- Responds to movement points set by the targeting system

##### `src/components/r3f/TargetingSystem.tsx`

- Core component for the point-and-click movement mechanics
- Implements raycasting to convert screen clicks to world positions
- Creates visual feedback when clicking on the ground (click effect)
- Communicates with the controller to set movement targets
- Works independently from terrain to ensure reliable targeting
- Handles edge cases for click detection on various surfaces

##### `src/components/r3f/Floor.tsx`

- Ground plane with physics properties
- Provides surface for character movement
- Includes collision detection
- Serves as the primary target for mouse click raycasting
