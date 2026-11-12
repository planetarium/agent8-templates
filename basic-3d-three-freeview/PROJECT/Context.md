# Context — basic-3d-three-freeview

## Project Overview

Thin plain three.js game skeleton, freeview. The verse8 base character
walks, runs and jumps on an empty stage (floor, sky, fog, sun); a
3rd-person orbit camera follows it from just behind and above (preset
'follow': 4.5 m, ≈ 10° down, eye height 1.3 m), stays out of walls and
swings behind the direction of motion. Courses run from the spawn toward
−z (the camera's front). Keyboard + mouse on desktop, joystick +
JUMP button on touch devices. The game's map is built in
`src/game/world.ts`: obstacles in `BOXES` / `RAMPS`, terrain as a
`HeightField` in `FIELDS`, moving platforms as AABBs that record `moved`.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: three (imperative, `src/three/`)
- **HUD**: React (hint label, touch controls)
- **Physics (lazy, optional)**: @dimforge/rapier3d-compat — only via `src/physics/`
- **Build**: Vite, TypeScript, Tailwind CSS
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

- One frame loop (`src/three/engine.ts`); per-frame work is a system
  `{ update(dt) }` in its list.
- Player movement is a kinematic step (`src/game/player.ts`) against AABBs,
  ramps and height fields from `src/game/world.ts`, not rapier. Grounded = landed on, or
  stepped up onto, a box top, a ramp or a height field this step.
- Jump feel: coyote 0.12 s, buffer 0.1 s from the press, consumed on jump.
- Per-frame state is mutable (`src/game/state.ts`), never React state.
- Dynamic bodies (things that roll, tip over or get pushed) go in the lazy
  rapier chunk under `src/physics/`, never hand-written physics.
