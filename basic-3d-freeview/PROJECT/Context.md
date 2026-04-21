# Context — basic-3d-freeview

## Project Overview

Three.js + React Three Fiber scaffold with a physics-based third-person character controller and a free-orbit camera. Player runs on `RigidBodyPlayer` with a full humanoid animation set; camera follows via `FreeViewController`; map physics are gated by a raycast-based ready check. Zustand stores are pre-split for multiplayer, and `@agent8/gameserver` is installed but no networking is wired.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Character framework**: `vibe-starter-3d` (`FreeViewController`, `RigidBodyPlayer`, `CharacterRenderer`, `FollowLight`)
- **Multiplayer (unwired)**: `@agent8/gameserver`
- **State**: Zustand
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- Player must be built on `RigidBodyPlayer` and camera on `FreeViewController`; the physics bootstrap depends on this pipeline.
- Physics stay paused until `gameStore.isMapPhysicsReady` is `true`. `MapPhysicsReadyChecker` releases it via a downward raycast — new map geometry must be reachable by it.
- Handle player collisions via `RigidBodyPlayer.onTriggerEnter` / `onTriggerExit`, switching on `RigidBodyObjectType` tags.
- Character model and animation URLs are loaded via the `src/assets.json` manifest.
