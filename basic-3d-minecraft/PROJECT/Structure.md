# Structure — basic-3d-minecraft

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` toggles between `PreloadScene` (while loading) and `GameScene` (after `onComplete`).

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives, fonts).

## `src/assets.json`

Asset manifest — character model, animation URLs, and sprite references. Consumed by `PreloadScene` and `Player`.

## `src/constants/`

- **`character.ts`** — animation state ids (idle, idle-01, walk, run, fast-run, jump, punch, kick, melee attack, cast, hit, die).
- **`rigidBodyObjectType.ts`** — rigid-body category enum (local player, enemy, monster, wall, obstacle, item, bullet, floor, plotting board).
- **`tiles.ts`** — `TILE_TYPES` enum of 25 block types (grass, dirt, stone, ores, wood, leaves, glass, wool, flowers, mushrooms, metal blocks, …).
- **`themes.ts`** — `THEMES` enum + tile index groupings (`ALL`, `BLUE`, `GREEN`, `BROWN`, `GRAY`, `GOLD`, `RED`) with names, descriptions, icons, and lookup helpers.

> Movement/jump/run key bindings are defined locally in `components/ui/InputController.tsx` (`CONTROL_KEY_MAPPING`); block-action bindings in `ACTION_KEY_MAPPING`.

## `src/stores/` (Zustand)

- **`gameStore.ts`** — global lifecycle; holds `isMapPhysicsReady`.
- **`localPlayerStore.ts`** — local-player position/speed (mutated in place to avoid per-frame subscriber churn).
- **`multiPlayerStore.ts`** — registry of connected-player rigid-body refs, keyed by `account`.
- **`cubeStore.ts`** — voxel world state: `cubes[]`, `seed`, `selectedTile`, `selectedTheme`, `availableTiles`, plus `addCube`, `removeCube`, `regenerateCubeMap`, theme switching. Seeds the initial world via `createInitialCubeMap` → `generateCubeMap` at 80×80.
- **`playerActionStore.ts`** — transient action flags (`punch`, `kick`, `meleeAttack`, `cast`, `addCube`). Plain module-singleton object (not a Zustand store despite the filename).

## `src/utils/`

- **`colorUtils.ts`** — `ALL_CUBE_COLORS` table (per-tile × 6 faces RGB), `FACE_INDEX` map, and `getColorByFace` / `getTileTypeFromIndex` / `getThreeColor` helpers. Central color source for both `InstancedCube` shader attributes and `SingleCube` materials.
- **`cubeMapGenerator.ts`** — seeded `simplex-noise` terrain generator. Exports `generateCubeMap`, plus scaffolds (`BIOMES`, `CUBEMAP_CONFIG`, `BIOME_MODIFIERS`, `STRUCTURES`, `getBiomeAt`, `generateStructure`, `generateCaves`, `postProcessCubeMap`) marked as `TODO` for extension.

## `src/hooks/`

- **`useCubeRaycaster.tsx`** — screen-center raycaster (throttled to 150ms via lodash) against cube / floor meshes. Computes integer preview position from hit point + face normal using the same math as `InstancedCube.handleCubeClick`. On rising edge of `playerActionStore.addCube`, places a cube at the preview.

## `src/components/r3f/` (inside `Canvas`)

- **`GameSceneCanvas.tsx`** — R3F `Canvas` root. Hosts Rapier `Physics` (paused until `isMapPhysicsReady`), `FirstPersonViewController`, `FollowLight`, and mounts `MapPhysicsReadyChecker` and `Experience`. Requests desktop pointer-lock on `pointerdown`.
- **`Experience.tsx`** — 3D scene composition: ambient + three `directionalLight`s, `Environment preset="dawn"`, `Water`, `InstancedCube`, `CubePreview` (driven by `useCubeRaycaster`), `Player`.
- **`MapPhysicsReadyChecker.tsx`** — raycasts downward from `(0, 50, 0)` each frame; flips `isMapPhysicsReady` on first non-sensor, non-capsule hit or after a 180-frame timeout.
- **`Player.tsx`** — wraps `RigidBodyPlayer` + `CharacterRenderer`; owns the full `animationConfigMap`, converts `CharacterMovementState` from `useControllerStore` to `CharacterState`, and routes action flags (`punch`/`kick`/`meleeAttack`/`cast`) through `lockControls` → `handleAnimationComplete` → `unlockControls`. Registers its rigid-body ref in `multiPlayerStore` by `account` and streams position into `localPlayerStore`.
- **`InstancedCube.tsx`** — core voxel renderer. One `InstancedMesh` (capacity 1,000,000) with a custom vertex/fragment shader that applies per-face colors and a border effect. Partitions cubes into 2D chunks (X/Z, `CHUNK_SIZE = 10`), activates chunks within `ACTIVE_CHUNKS_RADIUS = 3` sorted by distance (cap `MAX_ACTIVE_CHUNKS = 27`), and for each active chunk builds merged vertex/index buffers with internal faces culled and mounts a `TrimeshCollider`. Click handler adds a neighbor cube in the clicked face's direction.
- **`SingleCube.tsx`** — six-plane cube for UI / preview, reusing `ALL_CUBE_COLORS`. Supports `opacity < 1` translucent preview mode (basic material) and opaque mode (standard material).
- **`CubePreview.tsx`** — positions a translucent `SingleCube` at the integer preview coordinate from `useCubeRaycaster`, scaled 1.03× to avoid z-fighting.
- **`Water.tsx`** — a single 1000×1000 translucent plane at `y = 10` (semi-transparent blue); has `userData.type: 'fixed'` but no physics collider.

## `src/components/scene/`

- **`GameScene.tsx`** — layout shell stitching `GameSceneCanvas` (3D) and `GameSceneUI` (DOM overlay). Contains performance-critical warnings against mixing concerns.
- **`PreloadScene.tsx`** — iterates every category in `assets.json` and loads each URL with the appropriate loader (GLTF / texture / audio / video / fetch) through a shared `LoadingManager`; renders a progress bar and calls `onComplete` when done.

## `src/components/ui/` (DOM overlay)

- **`GameSceneUI.tsx`** — UI overlay container. Mounts `InputController`, `LoadingScreen` (while `isMapPhysicsReady` is `false`), `TileSelector`, `Crosshair`.
- **`LoadingScreen.tsx`** — in-canvas-aware overlay (uses `drei` `Html` when inside a `Canvas`, plain DOM otherwise).
- **`InputController.tsx`** — unified keyboard / mouse / touch input. Defines `CONTROL_KEY_MAPPING` (forward/backward/left/right/jump/run) and `ACTION_KEY_MAPPING` (`addCube: F/Mouse0`, `removeCube: G/Mouse2`). Drives `useInputStore` movement with analog intensity (walk / run boost / max), and `playerActionStore` for actions. Mobile: `nipplejs` joystick on the left half + on-screen `ADD CUBE` / `JUMP` buttons.
- **`Crosshair.tsx`** — fixed screen-center crosshair overlay.
- **`TileSelector.tsx`** — bottom-center tile picker with a live 3D `SingleCube` preview per slot. `Q`/`E` cycles tiles within the current theme, `T` toggles a theme picker (`Escape`/`T` to close). Regenerate button calls `cubeStore.regenerateCubeMap(seed)`.
