# Context — basic-3d-quarterview (Incanto)

## Project Overview

The classic QUARTER-VIEW (isometric) character on the Incanto engine: a 100×100 gray
floor under sunset image-based lighting, one animated character
(base-model.glb + mixamo clips), a FIXED isometric camera (35.264° pitch, distance 40, FOV 20 — never
rotates), world-relative WASD movement, Shift sprint, Space jump.
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
  `fixedRotation: true`, friction 0) with a `CharacterController3D` child (`view: "quarter"`, camDistance 40, mouseLook false) —
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
- There is NO mouse look: the quarter camera is hard-set (rotation.x =
  −35.264°, the atan(1/√2) isometric pitch); movement is world-relative.
- The Camera3D has `fov: 20` — the long-lens look IS the quarter-view feel.
- uids are engine-generated (`newUid()` from 'incanto') — never hand-write.
- `window.game` exposes the `createGame3D` Game handle in the console
  (`game.engine`, `game.scene`, `game.dispose()`).
