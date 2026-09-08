# Context — basic-3d-freeview (Incanto)

## Project Overview

The third-person free-view character on the Incanto engine: a 100×100 gray
floor under sunset image-based lighting, one animated character
(base-model.glb + mixamo clips), an orbiting follow camera (pointer-lock
mouse look), WASD movement relative to the camera, Shift sprint, Space jump.
ALL structure is `src/game.scene.json`; the only game code is two small
behaviors (FollowLight, CharacterAnimator).

## Tech Stack

_Exact versions are in `package.json`._

- **Game engine**: `incanto` — `CharacterController3D` does the heavy lifting
- **Build / Lang**: Vite, TypeScript. No React/shell.

## Critical Memory

- READ THE SKILLS FIRST: `node_modules/incanto/skills/` — especially
  `incanto-3d-character.md` (the controller + camera rigs) and
  `incanto-building-3d-games.md` (HDRI presets, preload).
- The Player is a DYNAMIC `RigidBody3D` (capsule r0.32 h0.96,
  `fixedRotation: true`, friction 0) with a `CharacterController3D` child —
  NOT a CharacterBody3D. The controller floats the capsule on a spring and
  moves it with impulses (vibe-starter parity numbers).
- `environment.preset: "sunset"` is LIGHTING ONLY; the visible background is
  `background: "#ffffff"` (the original shows the page through a transparent
  canvas — we paint white explicitly).
- Animations are mixamo GLBs declared as `animation` assets; the
  CharacterAnimator behavior maps `movementStateChanged`
  (idle/walk/run/fastRun/airborne) to clips. The model is ALREADY meter-scale:
  targetHeight fit detects implausible skinned-rig measurements and renders
  at authored scale (console warning is expected and fine).
- `createGame3D({ pointer: true })` gives lock-on-click mouse look
  (click the canvas to lock) — yaw/pitch live on the controller node.
- uids are engine-generated (`newUid()` from 'incanto') — never hand-write.
- `window.game` exposes the `createGame3D` Game handle in the console
  (`game.engine`, `game.scene`, `game.dispose()`).
