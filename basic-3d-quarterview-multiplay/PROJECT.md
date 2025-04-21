# League-style Top-Down Game

## Project Summary

This project is a League of Legends style top-down multiplayer game where players control characters from above. The game features click-to-move navigation and ability-based combat, similar to popular MOBA games. Players can join or create rooms, select characters, and interact with other players in real-time 3D environment.

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
- @agent8/gameserver for multiplayer functionality
- Zustand for state management
- Tailwind CSS for UI composition

## Implemented Features

- User authentication with nickname setting
- Room creation and management system
- Character selection from various 3D models
- Click-to-move navigation system
- Real-time player position and state synchronization
- Character animations (idle, walk, run, jump, attack)
- Fireball casting and effect system
- Network latency measurement
- Top-down camera perspective
- Collision detection between characters and effects
- Damage system with health management

## File Structure Overview

### src/main.tsx

- Entry point for the application
- Sets up React rendering

### src/App.tsx

- Main application component
- Handles game flow, user authentication, room management
- Contains view transitions between screens

### src/assets.json

- Defines game assets including character models and animations
- Maps animation types to resource URLs

### src/types/

- Contains TypeScript definitions for game entities
- Includes player.ts, user.ts, and effect.ts for type safety

### src/constants/character.ts

- Defines character states (idle, walk, run, etc.)
- Provides enum values for animation system

### src/constants/controls.ts

- Defines keyboard and mouse control mappings
- Sets up input configuration for player movement

### src/hooks/useNetworkSync.ts

- Custom hook for network synchronization
- Handles player data transmission between clients

### src/store/networkSyncStore.ts

- Zustand store for network state management
- Tracks player positions and states across the network

### src/store/effectStore.ts

- Manages game effects like fireballs
- Controls effect lifecycle and collision detection

### src/components/scene/NicknameSetup.tsx

- Component for setting user nickname
- First screen in the game flow

### src/components/scene/RoomManager.tsx

- Interface for creating and joining game rooms
- Displays available rooms and allows creation of new ones

### src/components/scene/LobbyRoom.tsx

- Pre-game lobby with character selection
- Allows players to prepare before starting the game

### src/components/scene/GameScene.tsx

- Main game scene component
- Sets up 3D environment with physics and controls

### src/components/r3f/Experience.tsx

- Sets up the 3D world environment
- Configures lighting, camera, and scene objects

### src/components/r3f/Player.tsx

- Local player character with control logic
- Handles animations, movement, and state transitions

### src/components/r3f/RemotePlayer.tsx

- Representation of other players in the game
- Renders network-synchronized character models

### src/components/r3f/TargetingSystem.tsx

- Targeting system that operates independently from terrain
- Detects click positions and sets movement points
- Handles click effect animations
- Manages interactions through an invisible interaction layer
- !! Important: essential component. must be included

### src/components/r3f/Floor.tsx

- Ground plane with physics properties
- Provides surface for character movement

### src/components/r3f/NetworkContainer.tsx

- Manages network-synchronized entities
- Handles creation and removal of remote players

### src/components/r3f/EffectContainer.tsx

- Container for visual effects like fireballs
- Manages effect creation and lifecycle

### src/components/r3f/effects/FireBall.tsx

- Fireball projectile implementation
- Handles movement, collision, and visual effects

### src/components/ui/RTT.tsx

- Displays network round-trip time
- Provides feedback on connection quality

### server.js

- Game server implementation
- Handles room management, player synchronization, and game logic
- Processes effect events and damage calculations
