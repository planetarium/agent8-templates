# Context — basic-3d-flightview

## Project Overview

Single-player flight scaffold built on Three.js + React Three Fiber + Rapier. The player rides a kinematic `RigidBodyPlayer` that wraps a procedural `Aircraft` mesh (body, wings, cockpit, spinning propeller with `Trail`); flight motion and camera follow are handled by `vibe-starter-3d`'s `FlightViewController`. Space fires bullets through a Zustand-backed effect pipeline (bullet → explosion), R spawns a reset, and `StatusDisplay` reads speed/altitude from `localPlayerStore` and HP/player count from `@agent8/gameserver`. Map physics are gated by a downward raycast until the world is reachable.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei` (`Sky`, `Trail`, `Html`)
- **Physics**: `@react-three/rapier`, `@dimforge/rapier3d-compat`
- **Flight framework**: `vibe-starter-3d` (`FlightViewController`, `RigidBodyPlayer`, `RigidBodyObject`, `FollowLight`, `useControllerState`)
- **Multiplayer**: `@agent8/gameserver` (used by `StatusDisplay` and `Player` for account / room state)
- **State**: Zustand
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- Player must ride `RigidBodyPlayer` and camera must come from `FlightViewController`; Physics stays paused until `gameStore.isMapPhysicsReady` flips.
- `MapPhysicsReadyChecker` raycasts downward from `y = 50` and releases physics on the first non-sensor, non-Capsule hit, or after a 180-frame timeout — new map geometry must be reachable by that ray.
- `Player` is kinematic (`type="kinematicPosition"`, `gravityScale={0}`, `sensor={true}`) and uses a manual `CuboidCollider` with `autoCreateCollider={false}`; collisions are handled via `onTriggerEnter` / `onTriggerExit` keyed on `RigidBodyObjectType`.
- Bullet lifecycle flows `Player → effectStore.addEffect(BULLET) → EffectContainer → BulletEffectController → Bullet` and resolves hits back into `EffectContainer` which spawns `EXPLOSION`.
- Flight key mapping is declared inline in `GameSceneCanvas.tsx` as a `FlightControllerKeyMapping`; `src/constants/controls.ts` exports a `KeyboardControlsEntry[]` that is currently unused.
