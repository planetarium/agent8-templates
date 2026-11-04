# Context — basic-3d-r3f-firstpersonview

## Project Overview

Thin React Three Fiber game skeleton, first-person view. The camera sits at
the player's eyes (1.5 m); the player walks, runs and jumps on a level with
0.3 m stairs, a ledge, a ramp and a moving platform. Desktop: click to lock
the mouse, mouse to look, WASD to move. Touch: joystick + JUMP, drag the
scene to look. The local player is not drawn; a crosshair marks the center.

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
- Movement follows the look yaw (`rig.yaw`, 0 = looking along −z).
- Jump feel: coyote 0.12 s, buffer 0.1 s from the press, consumed on jump.
- Per-frame state is mutable (`src/game/state.ts`), never React state.
- Dynamic bodies (things that roll, tip over or get pushed) go in the lazy
  rapier chunk under `src/physics/`, never hand-written physics.
