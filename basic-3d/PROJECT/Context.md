# Context — basic-3d

## Project Overview

React Three Fiber empty 3D stage: an 80 × 80 ground under a sky, a
shadow-casting sun, a 21 × 21 grid of 1 m cells and a marker cube on the
origin cell. Click (or tap) a cell to move the marker there. Orbit camera
(drei `OrbitControls`). No character.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: three, @react-three/fiber, @react-three/drei
- **Physics (lazy, optional)**: @react-three/rapier — only via `src/physics/`
- **Framework / Build**: React, Vite, TypeScript, Tailwind CSS
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

- Ground top is y = 0. Grid math is pure (`src/game/grid.ts`), tested.
- Per-frame state is mutable, never React state.
- Dynamic bodies (things that roll, tip over or get pushed) go in the lazy
  rapier chunk under `src/physics/`, never hand-written physics.
