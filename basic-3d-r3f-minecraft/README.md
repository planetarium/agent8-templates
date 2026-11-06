# basic-3d-r3f-minecraft

React Three Fiber voxel skeleton: the verse8 base character walks, runs and
jumps across a seeded 80 × 80 block world, followed by a 3rd-person orbit
camera. Aim with the crosshair: click mines a block, right-click places the
selected one (1 / 2 / 3: grass, dirt, stone). The world is chunked (10 × 10,
only chunks near the player are drawn, an edit rebuilds only the chunks it
touches); world rules live in `src/game/voxel.ts` and the player is the
template's own kinematic controller (`src/game/player.ts`), both tested
with `bun test`. Rapier is only loaded for dynamic bodies.

Stack: React 19, three, @react-three/fiber 9, @react-three/drei 10,
@react-three/rapier 2 (lazy, not in the first load), simplex-noise, Vite,
Tailwind.

## Run

```bash
bun install
bun run dev          # http://localhost:5173  (?touch=1 shows touch controls, ?physics=1 mounts the rapier demo)
bun test             # voxel + controller tests
bun run build && bun run preview
```

## First load (vite build)

| chunk | size |
| --- | --- |
| `index-*.js` (first load) | 1,247.39 kB |
| `PhysicsDemo-*.js` (rapier + inlined wasm) | 2,257.66 kB, fetched only when `LazyPhysics` mounts |

## Controls

| | |
| --- | --- |
| Desktop | WASD / arrows move (camera-relative), Shift run, Space jump, click mine, right-click place, 1 / 2 / 3 pick a block, drag to orbit, wheel to zoom |
| Touch | stick (bottom-left), MINE / PLACE / JUMP (bottom-right), tap a block in the bar on top, drag the scene to orbit |
