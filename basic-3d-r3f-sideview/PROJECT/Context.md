# Context — basic-3d-r3f-sideview

## Project Overview

Thin React Three Fiber game skeleton, sideview (a side-scroller in 3D). The
verse8 base character runs left / right and jumps along the z = 0 plane on
an empty stage (floor, sky, fog, sun); a fixed side camera on +z tracks it
with a little look-ahead. Keyboard on desktop, joystick + JUMP button on
touch devices. The game's map is built in `src/game/world.ts`: obstacles in
`BOXES` / `RAMPS`, terrain as a `HeightField` in `FIELDS`, moving platforms
as AABBs that record `moved` — all overlapping z = 0.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: three, @react-three/fiber, @react-three/drei
- **Physics (lazy, optional)**: @react-three/rapier — only via `src/physics/`
- **Framework / Build**: React, Vite, TypeScript, Tailwind CSS
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

- Player movement is a kinematic step (`src/game/player.ts`) against AABBs,
  ramps and height fields from `src/game/world.ts`, not rapier, with `lockZ = true`: the
  player never leaves z = 0. Grounded = landed on, or stepped up onto, a box
  top, a ramp or a height field this step.
- Jump feel: coyote 0.12 s, buffer 0.1 s from the press, consumed on jump.
- Per-frame state is mutable (`src/game/state.ts`), never React state.
- The camera does not rotate; there is no mouse look.
- Dynamic bodies (things that roll, tip over or get pushed) go in the lazy
  rapier chunk under `src/physics/`, never hand-written physics.
