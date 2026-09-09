# Context — basic-3d-flightview (Incanto)

## Project Overview

An airplane flight sim on the Incanto engine: a procedural box-built plane
on a 1000m runway across grass and sea, atmospheric Sky shader, 500 seeded
ground decorations + 150 drifting sky shapes, banking chase camera (FOV 30),
HUD panel, Space-fired tracers, R reset. All flight constants mirror the
original FlightViewController exactly.

## Tech Stack

- **Game engine**: `incanto`; behaviors use `three` math directly (allowed
  in GAME code — only engine core is three-free).
- Vite + TypeScript, no shell framework.

## Critical Memory

- READ THE SKILLS FIRST: `node_modules/incanto/skills/`.
- Flight is NOT the character controller: `FlightControl` is a plain
  behavior holding a quaternion attitude (the node's Euler rotation is just
  a mirror of it — never write node.rotation from elsewhere).
- Constants are parity-critical: maxSpeed 120 (HUD caps at exactly
  432.0 km/h), throttle +20/−80 per s, pitch 0.5 rad/s, roll π/2·0.5,
  yaw accel 0.3, ground authority scales below 20 m/s, camera offset
  (0,3,15) with slerp 0.08 / lerp 5, FOV 30 far 5000.
- `environment.sky {sunPosition, turbidity, rayleigh}` is the three Sky
  shader (drei <Sky> parity) — engine-rendered, not an asset.
- Decor (500 ground + 150 floating) comes from `DecorSpawner` with seed
  12345 — deterministic layout, not in the JSON (procedural decor is LOGIC).
- HUD reads `plane.behavior.measuredSpeed` — a 5-frame rolling average like
  the original, not the controller's internal speed.
- uids are engine-generated (`newUid()` from 'incanto').
- `window.game` exposes the `createGame3D` Game handle in the console
  (`game.engine`, `game.scene`, `game.dispose()`).
