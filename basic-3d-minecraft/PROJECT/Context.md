# Context — basic-3d-minecraft

## Project Overview

React Three Fiber voxel game skeleton. A seeded 80 × 80 world of 1 m
blocks (heights 5–15: grass on top, 3 dirt, stone below, a visual water
plane at 10.5) is drawn in 10 × 10 chunks around the player. The verse8 base
character walks, runs and jumps on it; a 3rd-person orbit camera follows and
pulls in in front of blocks. A crosshair picks the block under it within
15 m of the player: click mines it, right-click places the selected block
against the face. Keyboard + mouse on desktop; joystick, MINE / PLACE /
JUMP and a block bar on touch devices.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: three, @react-three/fiber, @react-three/drei
- **Terrain noise**: simplex-noise, seeded by the template's LCG
- **Physics (lazy, optional)**: @react-three/rapier — only via `src/physics/`
- **Framework / Build**: React, Vite, TypeScript, Tailwind CSS
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

- World rules are pure (`src/game/voxel.ts`): string seed
  `'minecraft123-cubemap'` → LCG → simplex, column height
  `floor((n + 1) × 5) + 5`; block (x, y, z) fills [x, x+1) × [y, y+1) × [z, z+1).
- Player movement is the kinematic step (`src/game/player.ts`) against the
  blocks near the player (`collidersNear`), not rapier. One block (1 m) is
  higher than `stepHeight` (0.35 m): jump to climb it.
- Edits mark only the touched chunks dirty; `Terrain` rebuilds those meshes.
- Per-frame state is mutable (`src/game/state.ts`), never React state.
- Dynamic bodies (things that roll, tip over or get pushed) go in the lazy
  rapier chunk under `src/physics/`, never hand-written physics.
