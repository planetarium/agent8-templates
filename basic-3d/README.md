# basic-3d

React Three Fiber empty 3D stage: ground, sky, a shadow-casting sun, a
21 × 21 grid and a marker cube on the origin under an orbit camera. No
character. Click a cell to move the marker (grid math in `src/game/grid.ts`,
tested with `bun test`); rapier is only loaded for dynamic bodies.

Stack: React 19, three, @react-three/fiber 9, @react-three/drei 10,
@react-three/rapier 2 (lazy, not in the first load), Vite, Tailwind.

## Run

```bash
bun install
bun run dev          # http://localhost:5173  (?physics=1 mounts the rapier demo)
bun test             # grid tests
bun run build && bun run preview
```

## First load (vite build)

| chunk | size |
| --- | --- |
| `index-*.js` (first load) | 1,166.90 kB |
| `PhysicsDemo-*.js` (rapier + inlined wasm) | 2,258.80 kB, fetched only when `LazyPhysics` mounts |

## Controls

| | |
| --- | --- |
| Desktop | drag to orbit, right-drag to pan, wheel to zoom, click a cell to move the marker |
| Touch | drag to orbit, two fingers to pan, pinch to zoom, tap a cell to move the marker |
