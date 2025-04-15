# League-style Top-Down Game

## Project Summary

This project is a League of Legends style top-down game where players control a character from above. The game features click-to-move navigation and ability-based combat, similar to popular MOBA games. Players can click on the ground to move their character and use abilities for combat.

## Implementation Strategy

This game uses a **3D Three.js-based approach** because:

- It requires a top-down perspective with 3D character models
- Three.js provides efficient rendering for 3D game environments
- React Three Fiber simplifies integration with React components
- The vibe-starter-3d library provides character and camera controls

Key technologies:

- Three.js for 3D rendering
- React Three Fiber for React integration
- @react-three/rapier for physics simulation
- vibe-starter-3d for character rendering and animation
- Tailwind CSS for UI composition

## Implemented Features

- Click-to-move navigation system
- Character movement with proper rotation towards target
- Character animations (idle, walk, run, jump, attack)
- Top-down/quarter-view camera perspective
- Environmental collision detection
- Physics-based character movement
- Character state management
- Keyboard and mouse control options
- 3D model rendering with animations
- Interactive ground plane for navigation
- Independent targeting system (decoupled from terrain)

## File Structure Overview

### src/main.tsx

- Entry point for the application
- Sets up React rendering

### src/App.tsx

- Main application component
- Configures the root layout

### src/assets.json

- Defines game assets including character models and animations
- Maps animation types to resource URLs

### src/constants/character.ts

- Defines character states (idle, walk, run, etc.)
- Provides enum values for animation system

### src/constants/controls.ts

- Defines keyboard and mouse control mappings
- Sets up input configuration for player movement

### src/components/R3F.tsx

- Wrapper component for React Three Fiber
- Provides 3D environment setup

### src/components/UI.tsx

- User interface component
- Renders game UI elements

### src/components/r3f/GameScene.tsx

- Main game scene component
- Sets up physics and environment
- Integrates player and floor components

### src/components/r3f/Experience.tsx

- Sets up the 3D world environment
- Configures lighting, camera, and scene objects

### src/components/r3f/Player.tsx

- Player character with control logic
- Handles animations, movement, and state transitions
- Implements character controller and input handling

### src/components/r3f/TargetingSystem.tsx

- Targeting system that operates independently from terrain
- Detects click positions and sets movement points
- Handles click effect animations
- Manages interactions through an invisible interaction layer
- !! Important: essential component. must be included

### src/components/r3f/Floor.tsx

- Ground plane with physics properties
- Provides surface for character movement
- Handles collision detection for character
