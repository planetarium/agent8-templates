# basic-3d-r3f-freeview

React Three Fiber freeview skeleton: the verse8 base character walks, runs
and jumps on an empty stage (floor, sky, fog, sun), followed by a
3rd-person orbit camera. Build the map in `src/game/world.ts` (boxes, ramps,
height-field terrain; examples in `PROJECT/Structure.md`). The player is the template's own kinematic
controller (`src/game/player.ts`, tested with `bun test`); rapier is only
loaded for dynamic bodies.

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
| `index-*.js` (first load) | 1,237.34 kB |
| `PhysicsDemo-*.js` (rapier + inlined wasm) | 2,257.66 kB, fetched only when `LazyPhysics` mounts |

## Controls

| | |
| --- | --- |
| Desktop | WASD / arrows move (camera-relative), Shift run, Space jump, drag to orbit, wheel to zoom |
| Touch | stick (bottom-left, push to the rim to run), JUMP (bottom-right), drag the scene to orbit |
