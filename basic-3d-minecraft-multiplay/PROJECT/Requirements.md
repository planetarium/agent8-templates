# Requirements — basic-3d-minecraft-multiplay

## Coding Patterns

- Zustand stores are concern-split: `cubeStore` (world blocks + selected tile), `effectStore` (VFX queue), `networkSyncStore` (server handle + RTT). Do not cross-write.
- R3F components go under `components/r3f/`, scene/lobby DOM screens under `components/scene/`, HUD overlays (`Crosshair`, `TileSelector`) directly under `components/`. `GameScene.tsx` composes them and must keep DOM overlays outside the `Canvas`.
- Block mutations must go through the server: left-click → `useCubeRaycaster` → `server.remoteFunction('addCube', …)`; the local `cubeStore` is updated on the round-trip via `NetworkContainer`'s `subscribeRoomState` diff.
- Terrain generation lives in `utils/terrainGenerator.ts` and is invoked exactly once per room, gated by `terrainInitializedRef` inside `NetworkContainer`. Seed must be `verse${roomId}` for determinism across clients.
- All block ids come from `TILE_TYPES` in `terrainGenerator.ts`; all animation ids from `constants/character.ts`; all key bindings from `constants/controls.ts` (`keyboardMap`). No string literals for these.
- Remote player transforms are applied via `RemotePlayerHandle.syncState` on refs kept in `NetworkContainer`, not by re-rendering on every state update.

## Known Issues / Constraints

- `InstancedCubes` disables its `TrimeshCollider` / per-cube `CuboidCollider` (commented out). Chunks create `RigidBody`s but no active colliders, so the player falls through stacked cubes and stands on `Floor` only. Re-enabling physics requires un-commenting and sizing the trimesh or cuboid colliders.
- `Experience.tsx` renders `<Floor />` twice (inside and outside `KeyboardControls`). One of them is redundant.
- `GameScene.tsx` mounts `<Physics debug={true}>`; the green debug wireframes are visible in-game.
- `networkSyncStore.startSync`'s `sendPing` returns immediately (`return;` at the top), so RTT history never populates through this path. `useNetworkSync` is the working alternative but is not mounted.
- `server.remoteFunction('addCube', …)` in `useCubeRaycaster` runs without a null check on `server`; clicking before the game-server context resolves will throw.
- Seed falls back to the literal `'minecraft123'` when `VITE_AGENT8_VERSE` is unset — in that case all rooms on that deployment share identical terrain unless a verse id is provided.
- `dotenv` is declared as a runtime dependency but Vite reads `.env` natively; the dependency is effectively unused at runtime.
