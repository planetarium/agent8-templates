# basic-3d-sideview

React Three Fiber sideview skeleton (a side-scroller in 3D): the verse8 base
character runs left / right and jumps along the z = 0 plane on an empty
stage (floor, sky, fog, sun); a fixed side camera tracks it. Build the map in
`src/game/world.ts` (boxes, ramps, height-field terrain; examples in
`PROJECT/Structure.md`). The
player is the template's own kinematic controller (`src/game/player.ts`,
`lockZ`, tested with `bun test`); rapier is only loaded for dynamic bodies.

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
| `index-*.js` (first load) | 1,237.52 kB |
| `PhysicsDemo-*.js` (rapier + inlined wasm) | 2,257.66 kB, fetched only when `LazyPhysics` mounts |

## Controls

| | |
| --- | --- |
| Desktop | A / D or ← / → move, Shift run, Space jump |
| Touch | stick left / right (bottom-left, push to the rim to run), JUMP (bottom-right) |
