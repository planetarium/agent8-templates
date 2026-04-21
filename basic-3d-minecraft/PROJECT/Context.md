# Context — basic-3d-minecraft

## Project Overview

Three.js + React Three Fiber scaffold for a voxel block world with first-person controls and physics. The world is rendered as a single `InstancedMesh` driven by a seeded `simplex-noise` height-map; active chunks around the camera are given per-chunk `TrimeshCollider` bodies for collision. A face-color custom shader replaces textures, and a screen-center raycaster produces a synced preview cube for placement. The player runs on `RigidBodyPlayer` + `FirstPersonViewController` with a full humanoid animation set. Asset preloading is handled by a dedicated `PreloadScene` before `GameScene` mounts. `@agent8/gameserver` is imported for `account` identity only — no networking is wired.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Character framework**: `vibe-starter-3d` (`FirstPersonViewController`, `RigidBodyPlayer`, `CharacterRenderer`, `FollowLight`)
- **Terrain**: `simplex-noise` (seeded 2D/3D), `lodash` (throttle)
- **Multiplayer (identity only)**: `@agent8/gameserver`
- **State**: Zustand
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS
- **Mobile input**: `nipplejs`

## Critical Memory

- Blocks are rendered via a single `InstancedMesh` with a custom shader that reads six per-face color attributes (`colorTop/Bottom/Front/Back/Left/Right`). Do not switch to textures unless explicitly requested — color data lives in `ALL_CUBE_COLORS` in `utils/colorUtils.ts`.
- Cube positions are integer-coordinate and centered on the origin; `CubePreview`, `useCubeRaycaster`, and `InstancedCube.handleCubeClick` must share the same `hit + normal` coordinate math, or preview and placement will desync.
- Collision is chunk-based: the world is partitioned into `CHUNK_SIZE = 10` (X/Z only); only chunks within `ACTIVE_CHUNKS_RADIUS = 3` and capped at `MAX_ACTIVE_CHUNKS = 27` get a `TrimeshCollider` built from visible-face merging. New map geometry must fall inside this active set to be collidable.
- Physics stay paused until `gameStore.isMapPhysicsReady` is `true`. `MapPhysicsReadyChecker` raycasts down from `(0, 50, 0)`; the world's surface must be reachable from there before the 180-frame timeout.
- `Player` must be built on `RigidBodyPlayer` and the camera on `FirstPersonViewController`; the physics/animation pipeline depends on this pair.
- Character model and animation URLs come from `src/assets.json` and are preloaded by `PreloadScene` before `GameScene` mounts.
