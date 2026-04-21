# Requirements — basic-3d-minecraft

## Coding Patterns

- Stores are concern-split (Zustand): `gameStore`, `localPlayerStore`, `multiPlayerStore`, `cubeStore` — do not cross-write. `playerActionStore` is a module-singleton transient-flag object; treat it as write-on-press / read-in-frame only.
- R3F goes under `components/r3f/`, DOM under `components/ui/`; `GameScene.tsx` stitches them and must not render 3D directly or hold React state (see the in-file warning — any re-render here re-renders the entire `Canvas`).
- Extend `Player.tsx` by adding animation states to `animationConfigMap` and action transitions in `updatePlayerState` / `handleAnimationComplete`, not by forking the component.
- No magic values: animation ids in `constants/character.ts`, rigid-body types in `constants/rigidBodyObjectType.ts`, block ids in `constants/tiles.ts`, groupings in `constants/themes.ts`.
- All cube colors live in `ALL_CUBE_COLORS` (`utils/colorUtils.ts`) and are consumed by both `InstancedCube` (per-face buffer attributes) and `SingleCube` (per-face materials). Add a tile by adding an entry here and to `TILE_TYPES`, not by branching renderers.
- Preview and placement share coordinate math: the `round(hit − normal·0.5) + round(normal)` recipe in `useCubeRaycaster` must stay in lockstep with `InstancedCube.handleCubeClick`'s neighbor-direction table.
- Raycasts and scene traversals in `useFrame` should be throttled (`useCubeRaycaster` uses `lodash/throttle` at 150ms) — do not run them every frame.
- New block meshes must expose `userData.isCube = true` (or `userData.isFloor = true` for ground) so the raycaster picks them up.
- Input is centralized in `components/ui/InputController.tsx`; route new bindings through `CONTROL_KEY_MAPPING` / `ACTION_KEY_MAPPING` rather than adding ad-hoc listeners.
- Terrain generation belongs in `utils/cubeMapGenerator.ts`; the `TODO`-marked scaffolds (`BIOMES`, `BIOME_MODIFIERS`, `STRUCTURES`, `generateCaves`, `postProcessCubeMap`) are the designated extension points.

## Known Issues / Constraints

- `InputController` maps `removeCube` to `KeyG` / `Mouse2` and `cubeStore` exposes `removeCube`, but `playerActionStore` has no `removeCube` flag and `useCubeRaycaster` never calls it — block removal is not wired end-to-end.
- `@agent8/gameserver` is imported only for `account` identity in `Player.tsx`; there is no session, room, or state-sync code. `multiPlayerStore` stays local-only.
- `@react-three/postprocessing` is installed but not imported anywhere — no effect pipeline ships.
- `MAX_ACTIVE_CHUNKS = 27` caps physics chunks; cubes in farther chunks render but are not collidable. Placing cubes into unloaded chunks yields render-only blocks until the camera gets closer.
- `Water` is a visual plane only (no collider). The player can pass through it.
- `MapPhysicsReadyChecker` has a 180-frame raycast timeout fired from `(0, 50, 0)` — terrain whose surface is below `y ≈ -50` or outside that ray will only be released by the timeout fallback.
- `InstancedCube` rebuilds chunk meshes and uploads six color buffer attributes for all cubes whenever `cubes` changes; very large worlds or rapid placements can spike CPU.
- Pointer lock is desktop-only (guarded by `IS_MOBILE`).
