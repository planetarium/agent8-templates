# Basic 3D Free View

## Project Summary

This project is a 3D character controller with free view camera, built using Three.js and React Three Fiber. It features a player character that can be controlled with keyboard inputs in a 3D environment. The character supports various animations including idle, walking, running, jumping, punching, and hit reactions. The camera follows the character with a free-view perspective, allowing users to navigate through the 3D space.

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

### src/main.tsx

- Entry point for the application
- Sets up React rendering

### src/App.tsx

- Main application component
- Manages the scene.

### src/assets.json

- Defines character model and animation resources
- Maps animation types to their respective URLs

### src/constants/character.ts

- Defines character states (IDLE, WALK, RUN, JUMP, PUNCH, HIT, DIE)
- Exports type definitions for character states

### src/constants/controls.ts

- Defines keyboard control mappings
- Sets up input configuration for player movement

### src/components/r3f/Experience.tsx

- Main game scene component with physics
- Sets up environment, lighting, and physics
- Includes player character with controller
- Configures grid and floor components

### src/components/r3f/Player.tsx

- Player character with control logic
- Implements character state management
- Handles animations based on player inputs
- Uses CharacterRenderer from vibe-starter-3d
- Exposes bounding box information

### src/components/r3f/Floor.tsx

- Floor plane with physics properties
- Provides surface for character movement
- Represents a generally flat floor. (It is recommended to use the settings applied to the RigidBody component as they are.)
- Critical Important: Do not modify the code in this file unless requested by the user.

### src/components/scene/GameScene.tsx

- Sets up the Canvas for rendering 3D content
- Implements pointer lock for immersive control
- Includes Experience component with Suspense
- It is recommended to use the Canvas component settings as they are without making any changes.
