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

## Extension points

- New pieces / buildings / tiles: meshes in `Stage.tsx` (or new components),
  placed with `cellCenter()`.
- New rules (turns, resources, waves): pure modules in `src/game/` + tests.
- New dynamic bodies: in `PhysicsDemo.tsx` (or another file under
  `src/physics/` reached through `LazyPhysics`), mounted by default by setting
  `PHYSICS_DEMO = true`.
