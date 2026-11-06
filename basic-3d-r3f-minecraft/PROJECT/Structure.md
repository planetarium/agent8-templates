# Structure — basic-3d-r3f-minecraft

## `src/config.ts`

`PHYSICS_DEMO`, and the tuning tables `PLAYER` (speeds, gravity, jump,
coyote/buffer, `stepHeight`, `spawn` — overwritten with the terrain's spawn
point), `CAMERA.free` (orbit distance and pitch), `VOXEL` (seed, world
size and height, chunk size, active radius) and `BUILDER` (reach, click
slop).

## `src/App.tsx`

`<Canvas>` with `Terrain`, `Player`, `CameraRig`, `Builder` (and
`LazyPhysics` when enabled), the crosshair, a hint label, the `Hotbar` and
`MobileControls`. Binds the keyboard.

## `src/game/`

- `voxel.ts` — pure voxel world: `lcgRandom()`, `heightFn()`,
  `createWorld()`, `blockAt()` / `setBlock()` / `topAt()`, `spawnPoint()`;
  chunks: `chunkOf()`, `chunkKey()`, `activeChunks()`, `chunksTouching()`;
  meshing: `buildChunkMesh()` (exposed faces, grouped by `MATERIALS` slot);
  `raycast()` (voxel traversal → block + face normal); `collidersNear()`
  (blocks around the player as AABBs, out-of-world columns as walls);
  `blockHitsPlayer()`.
- `voxel.test.ts` — `bun test` for seed, heights, layers, spawn, chunks,
  meshing, raycast, the 1-block step, the world edge.
- `player.ts` — pure `stepPlayer()`: acceleration, jump (coyote + buffer),
  gravity, axis-by-axis AABB collision with step-up, respawn below `killY`.
  (Ramps, height fields and moving boxes are supported but unused here.)
- `player.test.ts` — the controller's own tests.
- `world.ts` — the `Aabb` type the controller collides with (plus box /
  ramp / height-field helpers it understands).
- `input.ts` — keyboard set, joystick axes, `jumpPressedAt`; `moveAxis()`, `wantsRun()`.
- `anim.ts` — shared animation state and `retarget()` for mixamo clip GLBs.
- `state.ts` — the shared `world`, `player`, camera `rig`, and `builder`
  (selected block, crosshair target, dirty chunks). On the dev server also
  `window.game`.

## `src/components/`

- `Terrain.tsx` — sky, fog, sun following the player, water plane, and
  `Chunks`: one mesh per active chunk, built from `buildChunkMesh`, rebuilt
  when its key is in `builder.dirty`; block materials with CDN textures.
- `Builder.tsx` — crosshair raycast every frame, block outline, click /
  right-click / 1-2-3 handling; `mineTarget()`, `placeAtTarget()`, `HOTBAR`.
- `Player.tsx` — camera-relative input → `stepPlayer` in 1/120 s substeps
  against `collidersNear`, sets the animation state, draws `Character`.
- `Character.tsx` — verse8 base character (a placeholder capsule until the
  GLB loads), clip cross-fade.
- `CameraRig.tsx` — 3rd-person orbit (drag + wheel), pulled in in front of
  the first block between the player and the camera.
- `MobileControls.tsx` — joystick, MINE / PLACE, JUMP; shown on touch
  devices up front.

## `src/physics/`

Rapier (`@react-three/rapier`) is installed but lazy: import it only from
files under `src/physics/` that are reached through `React.lazy`
(`LazyPhysics.tsx`). A static import anywhere else puts ~2 MB of wasm into the
first load. Dynamic bodies (balls, pins, stackable crates — anything that
should roll, tip over or be pushed): switch on the lazy rapier path in
`src/physics/` (mount `LazyPhysics` / `PhysicsDemo`, the `?physics` chunk) and
build those bodies there with `@react-three/rapier`. Do not hand-write their
physics. Leave the player controller (`src/game/player.ts`) as it is.

- `LazyPhysics.tsx` — `React.lazy(() => import('./PhysicsDemo'))`.
- `PhysicsDemo.tsx` — `<Physics>` with a floor collider at y = 0 (under
  the terrain) and falling crates. For bodies on the blocks, give rapier
  colliders for the blocks near them.

## Numbers

- Block 1 m; world x, z in [−40, 40), y in [0, 48); heights 5–15.
- Player radius 0.35 m, height 1.6 m, `stepHeight` 0.35 m, jump apex
  ≈ 1.56 m — a 1-block step needs a jump, a 2-block wall cannot be jumped.
- 8 × 8 chunks; radius 3 → up to 29 drawn; a chunk mesh is a few hundred
  faces.

## Extension points

- New block type: add an id in `voxel.ts`, a material slot in `MATERIALS`
  + `slotOf()`, its texture in `src/assets.json` and `Terrain.tsx`, and an
  entry in `HOTBAR` (`Builder.tsx`).
- Different terrain: change `createWorld()` (keep it deterministic for a
  seed) and its tests.
- Bigger world: `VOXEL.size` / `height`; drawing stays bounded by
  `activeRadius`.
- New action: key / mouse handling in `Builder.tsx` + a button in
  `MobileControls.tsx`.
- New dynamic bodies: in `PhysicsDemo.tsx` (or another file under
  `src/physics/` reached through `LazyPhysics`), mounted by default by setting
  `PHYSICS_DEMO = true`.
