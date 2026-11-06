# Context — basic-3d-r3f-skeleton

## Project Overview

Thin React Three Fiber game skeleton. A capsule player runs and jumps on a
box level; the camera is a 3rd-person orbit (freeview) or a side-scroller
(sideview), picked by `VIEW_MODE` in `src/config.ts`. Keyboard + mouse on
desktop, joystick + JUMP button on touch devices.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: three, @react-three/fiber, @react-three/drei
- **Physics (lazy, optional)**: @react-three/rapier — only via `src/physics/`
- **Framework / Build**: React, Vite, TypeScript, Tailwind CSS
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

- Player movement is a kinematic step (`src/game/player.ts`) against AABBs
  from `src/game/world.ts`, not rapier. Grounded = landed on a box top this step.
- Jump feel: coyote 0.12 s, buffer 0.1 s from the press, consumed on jump.
- Per-frame state is mutable (`src/game/state.ts`), never React state.
