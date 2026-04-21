# Context — basic-3d-sideview

## Project Overview

Three.js + React Three Fiber scaffold for a single-player 3D sideview scene. Camera is locked to a fixed side-on perspective via `SideViewController` (`cameraMode="perspective"`, `followCharacter={true}`, `camDistance={10}`), so movement reads as horizontal with jump/gravity even though the character and world are fully 3D. Player is built on `RigidBodyPlayer` with a humanoid animation set; the ground is a seed-based procedural strip of fixed `RigidBody` blocks with gaps for jumping. A two-phase boot (`PreloadScene` → `GameScene`) pulls every URL from `src/assets.json` before rendering, and `MapPhysicsReadyChecker` gates physics start via a downward raycast. Zustand stores are pre-split for multiplayer, and `@agent8/gameserver` is installed but no networking is wired.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Character framework**: `vibe-starter-3d` (`SideViewController`, `RigidBodyPlayer`, `CharacterRenderer`, `FollowLight`, `useCharacterAnimation`, `useControllerStore`, `useInputStore`)
- **Multiplayer (unwired)**: `@agent8/gameserver`
- **State**: Zustand
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- Player must be built on `RigidBodyPlayer` and camera on `SideViewController`; the physics bootstrap depends on this pipeline.
- Physics stay paused until `gameStore.isMapPhysicsReady` is `true`. `MapPhysicsReadyChecker` releases it via a downward raycast from `y=50` — new map geometry must be reachable by it (non-capsule, non-sensor).
- `App.tsx` gates on `PreloadScene` first; every asset must be declared in `src/assets.json` or it will not be warm in the cache when `GameScene` mounts.
- Side view is enforced by `SideViewController` parameters in `GameSceneCanvas.tsx` — do not swap it for another controller without reworking input and camera expectations.
- Handle player collisions via `RigidBodyPlayer.onTriggerEnter` / `onTriggerExit`, switching on `RigidBodyObjectType` tags.
- Character model and animation URLs are loaded via the `src/assets.json` manifest.
