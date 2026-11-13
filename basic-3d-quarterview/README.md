# basic-3d-quarterview

React Three Fiber quarterview skeleton: the verse8 base character walks,
runs and jumps on an empty stage (floor, sky, fog, sun; build the map in
`src/game/world.ts`, examples in `PROJECT/Structure.md`), seen from a fixed
45° camera with a narrow FOV (isometric feel) that follows without
rotating. Movement is along the world axes. The player is the template's own
kinematic controller (`src/game/player.ts`, tested with `bun test`); rapier
is only loaded for dynamic bodies.

Stack: React 19, three, @react-three/fiber 9, @react-three/drei 10,
@react-three/rapier 2 (lazy, not in the first load), Vite, Tailwind.

## Run

```bash
bun install
bun run dev          # http://localhost:5173  (?touch=1 shows touch controls, ?physics=1 mounts the rapier demo)
bun test             # controller tests
bun run build && bun run preview
```

## First load (vite build)

| chunk | size |
| --- | --- |
| `index-*.js` (first load) | 1,237.10 kB |
| `PhysicsDemo-*.js` (rapier + inlined wasm) | 2,257.66 kB, fetched only when `LazyPhysics` mounts |

## Controls

| | |
| --- | --- |
| Desktop | WASD / arrows move (W = up the screen = −z), Shift run, Space jump, wheel to zoom |
| Touch | stick (bottom-left, push to the rim to run), JUMP (bottom-right) |
