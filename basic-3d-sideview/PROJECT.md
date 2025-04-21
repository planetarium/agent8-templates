# 3D Side-View Platform Game

## Project Overview

This project is a 3D side-view platform game using Three.js and React. It implements a game where characters jump and move through Mario-style platforms. Players can control characters using keyboard inputs and enjoy various animations and interactions throughout the game.

## Implementation Strategy

This game uses a **3D Three.js-based approach**:

- 3D character models with physics-based environment
- Efficient 3D rendering through Three.js
- React component integration via React Three Fiber
- Character and camera controls through vibe-starter-3d library

Key technologies:

- Three.js: 3D rendering
- React Three Fiber: React integration
- @react-three/rapier: Physics simulation
- vibe-starter-3d: Character control and rendering
- Zustand: State management
- Tailwind CSS: UI composition

## Implemented Features

- 3D character model rendering
- Character animations (idle, walk, run, jump, attack)
- Side-view camera controls
- Keyboard-based character control
- Physics-based collision detection
- Seed-based random platform generation
- Character state system (idle, walk, run, jump, punch, hit, die)
- Separation of scene rendering and UI

## File Structure Overview

### src/main.tsx

- Entry point for the application
- Sets up React rendering

### src/App.tsx

- Main application component
- Game rendering and UI composition
- Container for R3F and UI components

### src/assets.json

- Defines game assets (character models, animations)
- Maps animation types to resource URLs

### src/constants/character.ts

- Defines character states (idle, walk, run, etc.)
- Provides enum values for animation system

### src/constants/controls.ts

- Defines keyboard control mappings
- Sets up input configuration for player movement

### src/components/R3F.tsx

- Wrapper component for Three.js renderer
- Sets up 3D environment

### src/components/UI.tsx

- Wrapper component for game UI elements
- Displays overlay information

### src/components/r3f/GameScene.tsx

- Main game scene component
- Sets up Canvas and Experience components

### src/components/r3f/Experience.tsx

- Sets up 3D environment (physics, lighting, camera)
- Configures core game elements
- Connects side-view controller with player character

### src/components/r3f/Player.tsx

- Player character control logic
- Handles animations, movement, and state transitions
- Processes user input and changes character state

### src/components/r3f/Floor.tsx

- Platform with physics properties
- Seed-based random platform generation
- Provides ground for character movement
