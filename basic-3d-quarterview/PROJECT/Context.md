# Context — basic-3d-quarterview

## Project Overview

Three.js + React Three Fiber scaffold with a physics-based character controller and a fixed quarter-view camera (angled top-down) that follows the player. Player runs on `RigidBodyPlayer` with a humanoid animation set and a combat-action layer (punch, kick, melee, cast); camera follows via `QuarterViewController`; map physics are gated by a raycast-based ready check. Asset preloading runs before the scene mounts. Zustand stores are pre-split for multiplayer, and `@agent8/gameserver` is installed but no networking is wired.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Character framework**: `vibe-starter-3d` (`QuarterViewController`, `RigidBodyPlayer`, `CharacterRenderer`, `FollowLight`)
- **Multiplayer (unwired)**: `@agent8/gameserver`
- **State**: Zustand
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- Player must be built on `RigidBodyPlayer` and camera on `QuarterViewController` with `followCharacter={true}`; the physics bootstrap depends on this pipeline.
- Physics stay paused until `gameStore.isMapPhysicsReady` is `true`. `MapPhysicsReadyChecker` releases it via a downward raycast — new map geometry must be reachable by it.
- `App.tsx` gates the scene behind `PreloadScene`; every asset referenced from gameplay must be listed in `src/assets.json` so it is fetched before `GameScene` mounts.
- Handle player collisions via `RigidBodyPlayer.onTriggerEnter` / `onTriggerExit`, switching on `RigidBodyObjectType` tags.
- Combat actions (punch, kick, meleeAttack, cast) flow through `playerActionStore`; the `Player` component locks controls during action animations and releases them on `onAnimationComplete`.
