# Context — basic-3d-minecraft-multiplay

## Project Overview

Three.js + React Three Fiber scaffold for a multiplayer voxel block game. A first-person player explores a procedurally generated Minecraft-style terrain built from instanced cubes and places new blocks via a center-screen raycast. Remote players, block state, and magic effects are synchronized through `@agent8/gameserver` (`joinRoom` → nickname + character select → ready → shared game scene). Terrain is generated once per room with `simplex-noise` using a deterministic `verse{roomId}` seed.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Character framework**: `vibe-starter-3d` (`FirstPersonViewController`, `CharacterRenderer`, `NetworkObject`)
- **Multiplayer**: `@agent8/gameserver` (`useGameServer`, `useRoomState`, `useRoomAllUserStates`)
- **Procedural terrain**: `simplex-noise` with a seeded Alea PRNG
- **Post-processing**: `@react-three/postprocessing` (available; wired via `EffectContainer`)
- **State**: Zustand
- **Utilities**: `lodash` (throttle for network sync / raycast)
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- Terrain is generated client-side from seed `verse${roomId}` in `NetworkContainer`, then pushed to the server via `initializeCubes`. Once populated, `room.cubes` is the source of truth and every client diffs it against `prevCubesRef` to add/remove cubes locally.
- Local player input is throttled to the server at 100 ms via `updatePlayerTransform` (`lodash.throttle`). Position/rotation dirty checks gate the network call.
- Block placement goes through `useCubeRaycaster` (screen-center `THREE.Raycaster`, `near`/`far` clamped). On left click it calls the server's `addCube` remote function; it does not write directly to `cubeStore`.
- The InstancedMesh uses a custom shader (`uvOffsetScale` instanced attribute) to atlas-slice the Minecraft sprite sheet. Max instances = 1,000,000; chunks are 10³ with an active radius of 3.
- Seed default comes from `VITE_AGENT8_VERSE` (see `dotenv`). Without it, `cubeStore` falls back to `'minecraft123'`.
- Effects (`FIREBALL`, `EXPLOSION`) are added locally via `effectStore` and rebroadcast through `sendEffectEvent`; `EffectContainer` listens on `effect-event` room messages and replays remote casts.
