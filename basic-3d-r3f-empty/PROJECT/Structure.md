# Structure — basic-3d-r3f-empty

## `src/config.ts`

`PHYSICS_DEMO`, `STAGE` (ground size, grid cell size and count) and `CAMERA`
(start position, FOV, zoom range, lowest angle).

## `src/App.tsx`

`<Canvas>` with `Stage`, drei `OrbitControls` (and `LazyPhysics` when
enabled), and a hint label.

## `src/game/`

- `grid.ts` — pure `cellAt()` (world point → cell or null) and
  `cellCenter()` (cell → world point).
- `grid.test.ts` — `bun test` for both, odd and even grids.
- `imports.test.ts` — `bun test` that `config.ts` stays a leaf (loads no game
  module or package), so game modules can import `config` safely.
- `anim.ts` — `AnimState` and `retarget()` for mixamo clip GLBs, used by
  `components/models/AnimatedModel.tsx` (see "Model parts").

## `src/components/`

- `Stage.tsx` — sky, fog, lights, ground (click → `cellAt` → marker cell),
  grid lines, marker cube.

## `src/physics/`

Rapier (`@react-three/rapier`) is installed but lazy: import it only from
files under `src/physics/` that are reached through `React.lazy`
(`LazyPhysics.tsx`). A static import anywhere else puts ~2 MB of wasm into the
first load. Dynamic bodies (balls, pins, stackable crates — anything that
should roll, tip over or be pushed): switch on the lazy rapier path in
`src/physics/` (mount `LazyPhysics` / `PhysicsDemo`, the `?physics` chunk) and
build those bodies there with `@react-three/rapier`. Do not hand-write their
physics.

- `LazyPhysics.tsx` — `React.lazy(() => import('./PhysicsDemo'))`.
- `PhysicsDemo.tsx` — `<Physics>` with a floor collider and falling crates.

## Model parts (putting models in)

Shared by every R3F template (`npm run 3d:sync` keeps them identical) and
imported by no scene yet — import them when the game needs a model; don't
rewrite them. Library models come at any scale (a mixamo rig is often a
0.01 Armature); these measure the bounding box after `updateMatrixWorld`,
scale to metres and stand the lowest point on y = 0. Model URLs go in
`src/assets.json` `models`.

| path | for | required |
| --- | --- | --- |
| `src/game/fitModel.ts` | `fitModel(object, { height })` → `{ unit, lift }`: draw with `scale={unit}`, `position-y={lift}` | `object`, `height` (m) |
| `src/components/models/Props.tsx` | `<Props>`: a static model (crate, barrel, rock, house) at every `Placement` (`{ x, y, z, rotY, scale }`), instanced past 30 copies | `url`, `height` (m), `at` |
| `src/components/models/AnimatedModel.tsx` | `<AnimatedModel>`: a rigged enemy / NPC, feet at its origin, facing +z; plays its own named clips, a mixamorig rig without them borrows idle / walk / run (`assets.json` `animations`, `game/anim.ts` `retarget`); `source={{ state }}` picks the clip; each clip it can play stands on its own lowest skinned point (`game/groundClips.ts`, sampled once per model URL), the lift easing over the cross-fade | `url`, `height` (m) |
| `src/game/groundClips.ts` | `clipGroundOffsets(root, clips)` → per clip, the offset that puts the lowest skinned point of 9 samples on y = 0 (model units; `AnimatedModel` multiplies by `unit`) | `root`, `clips` |

## Extension points

- New pieces / buildings / tiles: meshes in `Stage.tsx` (or new components),
  placed with `cellCenter()`.
- New rules (turns, resources, waves): pure modules in `src/game/` + tests.
- New dynamic bodies: in `PhysicsDemo.tsx` (or another file under
  `src/physics/` reached through `LazyPhysics`), mounted by default by setting
  `PHYSICS_DEMO = true`.
