# 3D Side View Game

## Project Summary

This project is a 3D platformer game with a side-scrolling perspective, similar to classic 2D platformers but with 3D graphics. Players control a character that can run, jump, and perform various actions while navigating through a procedurally generated terrain of platforms. The game features character animations, physics-based movement, and jump mechanics that are essential for platformer gameplay. This project is intended for single-player gameplay with an emphasis on platform jumping and character control.

## Implementation Strategy

This game uses a **Three.js-based 3D approach**:

- React Three Fiber for 3D rendering in a React environment
- @react-three/rapier for physics simulation and collision detection
- vibe-starter-3d library for character rendering and animation
- Side view camera setup providing a classic platformer perspective
- Seed-based procedural generation for platform layouts

Key technologies:

- Three.js - 3D rendering
- React Three Fiber - React integration
- @react-three/rapier - Physics simulation
- @react-three/drei - Useful Three.js helpers
- vibe-starter-3d - Character rendering and animation
- Tailwind CSS - UI composition

## Implemented Features

- Character animations (idle, walk, run, jump, attack, etc.)
- Various character state management (IDLE, WALK, RUN, JUMP, PUNCH, KICK, etc.)
- Physics-based character movement with gravity
- Side view camera perspective (fixed orientation)
- Platformer-style jumping mechanics
- Procedurally generated platforms using seed-based randomization
- Environmental collision detection
- Keyboard controls for character movement and actions
- 3D model rendering with animations
- Variable platform heights and gaps for challenging gameplay
- Animation system with support for looping and one-shot animations
- Character bounding box calculations
- Keyboard controls for movement (WASD/arrow keys), skills (Q/E/R/F), and mouse click for interactions

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

- Defines character states (idle, walk, run, jump, etc.)
- Provides enum values for animation system

#### `src/constants/controls.ts`

- Defines keyboard control mappings
- Sets up input configuration for player movement and actions

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
- Uses SideViewController for side-scrolling camera perspective
- Links the player character with the controller

##### `src/components/r3f/Player.tsx`

- Player character with control logic
- Handles animations, movement, and state transitions
- Implements character controller and input handling
- Configures various character actions and animations
- Manages character bounding box calculations
- Handles jumping mechanics and platform interactions

##### `src/components/r3f/Floor.tsx`

- Procedurally generates platform terrain using seed-based randomization
- Creates varying platform heights, widths and gaps for platformer gameplay
- Implements physics colliders for player interaction
- Ensures platforms are properly spaced for jump distances
- Generates initial platform at origin for character starting position
