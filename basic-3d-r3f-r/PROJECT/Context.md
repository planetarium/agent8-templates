# Context — basic-3d-r3f-r

## Project Overview

Thin React Three Fiber game skeleton, variant R. The verse8 base character
walks, runs and jumps on a level with boxes, 0.3 m stairs, a ramp and a moving
platform; 3rd-person orbit camera. Keyboard + mouse on desktop, joystick +
JUMP button on touch devices. Twin of `basic-3d-r3f-k` (kinematic controller).

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: three, @react-three/fiber, @react-three/drei
- **Physics**: @react-three/rapier (always mounted), ecctrl 2 character
- **Framework / Build**: React, Vite, TypeScript, Tailwind CSS
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

- The player is `<Ecctrl>` (a floating dynamic capsule); input goes in via
  `setMovement()` each frame, position comes out of `currPos` into
  `src/game/state.ts`.
- Per-frame state is mutable (`src/game/state.ts`), never React state.
- `world.ts`, `anim.ts`, `input.ts`, `Character.tsx`, `Level.tsx` are shared
  with `basic-3d-r3f-k`; keep them identical.
