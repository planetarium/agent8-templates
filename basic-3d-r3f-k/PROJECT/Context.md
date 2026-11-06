# Context — basic-3d-r3f-k

## Project Overview

Thin React Three Fiber game skeleton, variant K. The verse8 base character
walks, runs and jumps on a level with boxes, 0.3 m stairs, a ramp and a moving
platform; 3rd-person orbit camera. Keyboard + mouse on desktop, joystick +
JUMP button on touch devices. Twin of `basic-3d-r3f-r` (ecctrl + rapier).

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: three, @react-three/fiber, @react-three/drei
- **Physics (lazy, optional)**: @react-three/rapier — only via `src/physics/`
- **Framework / Build**: React, Vite, TypeScript, Tailwind CSS
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

- Player movement is a kinematic step (`src/game/player.ts`) against AABBs
  and ramps from `src/game/world.ts`, not rapier. Grounded = landed on, or
  stepped up onto, a box top or a ramp this step.
- Jump feel: coyote 0.12 s, buffer 0.1 s from the press, consumed on jump.
- Per-frame state is mutable (`src/game/state.ts`), never React state.
- `world.ts`, `anim.ts`, `input.ts`, `Character.tsx`, `Level.tsx` are shared
  with `basic-3d-r3f-r`; keep them identical.
