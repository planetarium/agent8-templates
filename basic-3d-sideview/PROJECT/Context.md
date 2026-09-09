# Context — basic-3d-sideview (Incanto)

## Project Overview

The SIDE-VIEW platformer (Mario-style ribbon) on the Incanto engine: a procedural ribbon of 21 dark-gray
platform blocks (the original's seed-12345 RNG, baked into the scene JSON), one animated character
(base-model.glb + mixamo clips), a FIXED side-on camera at +z 10 (fov 60, lerp 5), A/D or arrows to run
along x, Shift sprint, Space to jump gaps, F/left-click to punch (one-shot
animation with input lock).
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
  `fixedRotation: true`, friction 0) with a `CharacterController3D` child (`view: "side"`, camDistance 10, eyeHeight 1,
camLerp 5) — movement locked to ±x with automatic z-rail correction —
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
- NO mouse look (fixed camera). Mouse0 = punch. Falling into a gap falls
  FOREVER — original parity (death/respawn is stubbed off there too).
- The 21 platform blocks are BAKED from the original's seeded RNG
  (seed 12345, frac(sin(seed++)·10000)) — do not regenerate by hand; the
  layout IS the parity.
- uids are engine-generated (`newUid()` from 'incanto') — never hand-write.
- `window.game` exposes the `createGame3D` Game handle in the console
  (`game.engine`, `game.scene`, `game.dispose()`).
