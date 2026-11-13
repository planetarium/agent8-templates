# basic-3d-firstpersonview

React Three Fiber first-person skeleton: the camera is the player's eyes; it
walks, runs and jumps on an empty stage (floor, sky, fog, sun; build the map
in `src/game/world.ts`, examples in `PROJECT/Structure.md`).
Pointer-lock mouse look (drag fallback), no visible player body. The player
is the template's own kinematic controller (`src/game/player.ts`, tested
with `bun test`); rapier is only loaded for dynamic bodies.

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
| `index-*.js` (first load) | 1,160.57 kB |
| `PhysicsDemo-*.js` (rapier + inlined wasm) | 2,258.80 kB, fetched only when `LazyPhysics` mounts |

## Controls

| | |
| --- | --- |
| Desktop | click to lock the mouse (Esc frees it), mouse to look, WASD / arrows move, Shift run, Space jump |
| Touch | stick (bottom-left, push to the rim to run), JUMP (bottom-right), drag the scene to look |
