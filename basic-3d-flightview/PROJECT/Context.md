# Context — basic-3d-flightview

## Project Overview

React Three Fiber flight game skeleton. A primitive airplane sits on a
1000 m runway (100 centerline stripes) in a 1000 × 1000 m grass field inside
a 10 km sea, under a sky shader with fog. Throttle up, pull back, take off;
a chase camera follows and banks with the plane. Space fires tracers.
Seeded scenery: 500 boxes / spheres / cylinders on the grass, 150 bright
shapes drifting in circles 100–400 m up. HUD: speed (km/h) and altitude.
Keyboard on desktop, joystick + throttle rocker + FIRE on touch devices.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: three, @react-three/fiber, @react-three/drei
- **Physics (lazy, optional)**: @react-three/rapier — only via `src/physics/`
- **Framework / Build**: React, Vite, TypeScript, Tailwind CSS
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

- The plane is a kinematic step (`src/game/flight.ts`), not a physics body:
  speed along the nose, attitude as a quaternion, clamped above the ground.
- Flight constants (`FLIGHT` in `config.ts`) come from the previous version
  of this template: max 120 m/s (432 km/h), +20 / −80 m/s²,
  pitch 0.5 rad/s, roll π/2 × 0.5 rad/s, yaw accel 0.3, full authority from
  20 m/s, airborne above 1 m.
- Per-frame state is mutable (`src/game/state.ts`), never React state.
- Dynamic bodies (things that roll, tip over or get pushed) go in the lazy
  rapier chunk under `src/physics/`, never hand-written physics.
