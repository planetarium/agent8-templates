# 3D Side-View Platform Game with Multiplayer

## Project Overview

This project extends the basic 3D side-view platform game by adding robust multiplayer functionality. Players can now create or join rooms, select characters, and play together in the same 3D environment. The game features real-time synchronization of player positions, states, and actions, allowing for collaborative gameplay. It maintains the core Mario-style platforming mechanics while adding social interaction elements.

## Implementation Strategy

This game uses a **3D Three.js-based approach with Network Synchronization**:

- 3D character models with physics-based environment
- Efficient 3D rendering through Three.js
- React component integration via React Three Fiber
- Character and camera controls through vibe-starter-3d library
- Real-time multiplayer using @agent8/gameserver
- Network state synchronization with optimized data transfer

Key technologies:

- Three.js: 3D rendering
- React Three Fiber: React integration
- @react-three/rapier: Physics simulation
- vibe-starter-3d: Character control and rendering
- @agent8/gameserver: Multiplayer functionality
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
- User authentication with nickname
- Room creation and management
- Character selection system
- Real-time player synchronization
- Network latency measurement (RTT)
- Health and damage system
- Chat messaging between players
- Special effect sharing (fireballs)

## File Structure Overview

### server.js

- Game server implementation
- Handles room management, player synchronization, and game logic
- Implements remote functions for client-server communication
- Manages player states, transform data, and effects

### src/main.tsx

- Entry point for the application
- Sets up React rendering

### src/App.tsx

- Main application component
- Manages application flow between screens
- Handles user authentication, room joining, and game state

### src/assets.json

- Defines game assets (character models, animations)
- Maps animation types to resource URLs

### src/types/

- Contains TypeScript definitions for game entities
- Includes player.ts, user.ts, and effect.ts for type safety

### src/constants/character.ts

- Defines character states (idle, walk, run, etc.)
- Provides enum values for animation system

### src/constants/controls.ts

- Defines keyboard control mappings
- Sets up input configuration for player movement

### src/store/networkSyncStore.ts

- Zustand store for network state management
- Handles RTT (Round Trip Time) calculation
- Maintains connection with game server

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
- Sets up Canvas, Network and Experience components

### src/components/r3f/Experience.tsx

- Sets up 3D environment (physics, lighting, camera)
- Configures core game elements
- Connects side-view controller with player character

### src/components/r3f/Player.tsx

- Local player character with control logic
- Handles animations, movement, and state transitions
- Integrates network synchronization for remote players

### src/components/r3f/RemotePlayer.tsx

- Representation of other players in the game
- Renders network-synchronized character models

### src/components/r3f/NetworkContainer.tsx

- Manages network-synchronized entities
- Handles creation and removal of remote players
- Subscribes to room state changes

### src/components/r3f/Floor.tsx

- Platform with physics properties
- Seed-based random platform generation
- Provides ground for character movement

### src/components/r3f/EffectContainer.tsx

- Container for visual effects like fireballs
- Manages effect creation and lifecycle
- Shares effects between players

### src/components/ui/RTT.tsx

- Displays network round-trip time
- Provides feedback on connection quality
