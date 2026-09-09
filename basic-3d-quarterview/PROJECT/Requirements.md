# Requirements — basic-3d-quarterview (Incanto)

## Coding Patterns

- STRUCTURE in `src/game.scene.json`; LOGIC in behaviors registered in
  `src/App.tsx`. The controller node handles movement/camera — don't
  reimplement it in behaviors; tune its props (maxSpeed, jumpVelocity,
  camDistance…) in JSON instead.
- New animations: declare the GLB as an `animation` asset, extend
  `STATE_CLIPS` in `behaviors.ts` (or set `skin.animation = '$key'` directly
  for one-shots).
- New world objects: StaticBody3D + box/sphere/capsule collider + a
  MeshInstance3D/ModelInstance3D skin child. The character collides with
  anything that has a collider — no registration step.
- The on-screen JUMP/ATTACK buttons inject key codes through
  `engine.input.handleKey` — wire new buttons the same way.
- uids: `newUid()` from 'incanto'.

## Known Issues / Constraints

- ATTACK renders for visual parity but fires no gameplay (the original's
  left-click shoots a bullet system we did not port to this template).
- The character model is meter-scale; `targetHeight` fit logs a warning and
  keeps authored scale (skinned rigs defeat bbox measurement) — expected.
- Shadows ARE on here (sun castShadow, mapSize 4096, ±75 frustum).
