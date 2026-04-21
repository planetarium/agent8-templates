# Context — basic-3d-firstpersonview

## Project Overview

Three.js + React Three Fiber scaffold with a physics-based first-person character controller, pointer-lock aiming, and an effect pipeline wired for shooting. Player runs on `RigidBodyPlayer` with `CharacterRenderer` rendered invisible (FPV); camera follows via `FirstPersonViewController`; left-click fires bullets spawned at the camera along its forward vector, routed through a Zustand-backed effect store. Zustand stores are pre-split for multiplayer, and `@agent8/gameserver` is installed but no networking is wired.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Character framework**: `vibe-starter-3d` (`FirstPersonViewController`, `RigidBodyPlayer`, `CharacterRenderer`, `RigidBodyObject`, `FollowLight`)
- **Multiplayer (unwired)**: `@agent8/gameserver`
- **State**: Zustand
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- Player must be built on `RigidBodyPlayer` and camera on `FirstPersonViewController`; the physics bootstrap depends on this pipeline.
- `CharacterRenderer` on the local player must stay `visible={false}` — the FPV camera sits inside the character.
- Physics stay paused until `gameStore.isMapPhysicsReady` is `true`. `MapPhysicsReadyChecker` releases it via a downward raycast — new map geometry must be reachable by it.
- Shooting flows through `effectStore.addEffect` → `EffectContainer` → `BulletEffectController`; do not spawn bullets as ad-hoc R3F children.
- Bullet hit detection is via `RigidBodyObject` sensor triggers; the firer is excluded by passing the player `RigidBody` as `owner`.
- Handle player collisions via `RigidBodyPlayer.onTriggerEnter` / `onTriggerExit`, switching on `RigidBodyObjectType` tags.
- Character model and animation URLs are loaded via the `src/assets.json` manifest.
