# Structure — basic-3d-minecraft-multiplay

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` owns the connection state machine: not-connected spinner → `NicknameSetup` → `RoomManager` → `LobbyRoom` → `GameScene`. It bridges the `@agent8/gameserver` client into `networkSyncStore` and subscribes to `roomState.gameStarted` to decide when to enter the 3D scene.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives).

## `src/assets.json`

Asset manifest — character GLBs, mixamorig animations, and the `minecraft` sprite sheet (80×80 px, 16 px cells) used for block textures.

## `src/constants/`

- **`character.ts`** — animation state ids (`IDLE`, `WALK`, `RUN`, `JUMP`, `PUNCH`, `HIT`, `DIE`) and `DEFAULT_HEIGHT = 1.6`.
- **`controls.ts`** — `keyboardMap` for `KeyboardControls` (WASD/arrows, `Space`, `Shift`, `1`–`4`, `KeyE` for magic).

## `src/types/`

- **`user.ts`** — `UserState` (nickname, character, transform, state, stats).
- **`room.ts`** — `RoomState` (`gameStarted`, `cubes: Record<string, CubeInfo>`).
- **`player.ts`** — `PlayerInputs`, `PlayerRef`.
- **`effect.ts`** — `EffectType` enum (`FIREBALL`, `EXPLOSION`), `EffectData`, `ActiveEffect`.
- **`index.ts`** — barrel re-export of `user` / `player` / `effect`.

## `src/hooks/`

- **`useCubeRaycaster.tsx`** — throttled (150 ms) screen-center raycast against the scene; filters for cubes / floor / chunk colliders; emits `previewPosition` and on left-click calls `server.remoteFunction('addCube', …)`.
- **`useNetworkSync.ts`** — periodic `handlePing` RTT sampler with a rolling 3-value average. Installed but not currently mounted by any component.

## `src/utils/`

- **`terrainGenerator.ts`** — `simplex-noise` + Alea PRNG. Exports `TILE_TYPES` (25 block ids), `generateTerrain(seed, width, depth)` that builds height map, water plane, surface tiles, sub-surface dirt/stone, and rare trees.
- **`tileTextureLoader.ts`** — sprite-sheet-backed `TextureLoader` with per-tile UV cache; exposes `getSpriteInfo`, `getTileCoordinates`, `getTileTexture`, `getTotalTileCount`.

## `src/store/` (Zustand)

- **`cubeStore.ts`** — `cubes: CubeInfo[]`, `selectedTile`, `TERRAIN_CONFIG` (80×80), `DEFAULT_SEED` (from `VITE_AGENT8_VERSE`). CRUD actions `addCube` / `removeCube` / `updateCubes` / `regenerateTerrain`.
- **`effectStore.ts`** — `activeEffects` list + `addEffect` / `removeEffect` with an auto-incrementing key.
- **`networkSyncStore.ts`** — holds the `GameServer` reference and maintains a ping-based RTT rolling average (ping loop is currently inert — `sendPing` returns early).

## `src/components/` (DOM overlay)

- **`Crosshair.tsx`** — fixed-center DOM crosshair for aiming block placement.
- **`TileSelector.tsx`** — bottom-center 7-tile carousel backed by the sprite sheet; `Q`/`E` cycle selection and write to `cubeStore.selectedTile`.

## `src/components/scene/`

- **`NicknameSetup.tsx`** — nickname entry form.
- **`RoomManager.tsx`** — create-new-room / join-by-id form.
- **`LobbyRoom.tsx`** — character picker, ready toggle, participants list, and a side `Canvas` running `CharacterPreview` for the chosen model.
- **`GameScene.tsx`** — active-game shell: full-viewport `Canvas` with `<Physics debug>`, `<Suspense>` wrapping `Experience` + `NetworkContainer` + `EffectContainer`; overlays `TileSelector`, `Crosshair`, leave button, and `StatsGl`. Requests pointer lock on `pointerdown`.

## `src/components/r3f/` (inside `Canvas`)

- **`Experience.tsx`** — local player stack. Mounts `KeyboardControls`, `Environment` (sunset), `FirstPersonViewController` wrapping `Player`, `Floor`, and the `CubePreview` anchored to `useCubeRaycaster().previewPosition`.
- **`Player.tsx`** — local-player logic: keyboard polling, state-machine for `CharacterState`, throttled `updatePlayerTransform` sync, magic cast trigger (`KeyE` → `FIREBALL`), `CharacterRenderer` rendered invisibly (first-person).
- **`Floor.tsx`** — wide `boxGeometry` ground plane with the dirt texture, `RigidBody type="fixed" colliders="cuboid"`, tagged `userData.isFloor = true` for the raycaster.
- **`NetworkContainer.tsx`** — subscribes to `subscribeRoomAllUserStates` / `subscribeRoomState`; manages per-account `RemotePlayer` refs, bootstraps terrain on first empty-room load (`generateTerrain` → `initializeCubes`), and diffs `room.cubes` against `prevCubesRef` to reconcile `cubeStore`. Also mounts `InstancedCubes`.
- **`RemotePlayer.tsx`** — `NetworkObject`-based remote character with capsule collider, animation map, and a billboarded nickname label. Exposes `syncState(state, position, rotation)` via ref.
- **`InstancedCubes.tsx`** — the world. Camera-chunk tracker splits cubes into 10³ chunks, activates up to 27 chunks in a sphere of radius 3 around the camera, generates per-chunk trimesh/face data, and renders a single `InstancedMesh` with a custom `uvOffsetScale` shader against the sprite sheet. `onClick` adds a cube on the hit face (client-side fallback).
- **`CubePreview.tsx`** — semi-transparent preview mesh positioned at `useCubeRaycaster`'s `previewPosition`; textured from the currently selected tile.
- **`CharacterPreview.tsx`** — idle-only `CharacterRenderer` used by `LobbyRoom` for the character picker.
- **`EffectContainer.tsx`** — renders `activeEffects` from `effectStore`; subscribes to `effect-event` room messages to mirror remote casts; handles fireball hits into `EXPLOSION` spawns.
- **`effects/FireBallEffectController.tsx`**, **`effects/FireBall.tsx`**, **`effects/Explosion.tsx`** — projectile + impact VFX with lifetime + hit callbacks.

## `server.js`

Verse room server: `joinRoom`, `leaveRoom`, `toggleReady`, `setCharacter`, `updatePlayerTransform`, `addCube`, `initializeCubes`, `sendEffectEvent`, `handlePing`.
