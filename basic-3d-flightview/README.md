# basic-3d-flightview

React Three Fiber flight skeleton: a primitive airplane takes off from a
1000 m runway over grass and sea, followed by a banking chase camera. Space
fires tracers; seeded scenery is instanced on the ground and in the sky; a
HUD shows speed and altitude. The plane is the template's own kinematic
flight step (`src/game/flight.ts`, tested with `bun test`); rapier is only
loaded for dynamic bodies.

Stack: React 19, three, @react-three/fiber 9, @react-three/drei 10,
@react-three/rapier 2 (lazy, not in the first load), Vite, Tailwind.

## Run

```bash
bun install
bun run dev          # http://localhost:5173  (?touch=1 shows touch controls, ?physics=1 mounts the rapier demo)
bun test             # flight tests
bun run build && bun run preview
```

## First load (vite build)

| chunk | size |
| --- | --- |
| `index-*.js` (first load) | 1,165.17 kB |
| `PhysicsDemo-*.js` (rapier + inlined wasm) | 2,258.80 kB, fetched only when `LazyPhysics` mounts |

## Controls

| | |
| --- | --- |
| Desktop | Shift / Ctrl speed up / down, W / S nose down / up, A / D roll, Q / E yaw, Space fire, R reset |
| Touch | stick (bottom-left) pitch & roll, ▲ / ▼ throttle and FIRE (bottom-right) |

Take off: hold Shift about 4 s (≈ 290 km/h), then S to lift the nose.
