# Requirements — basic-3d-firstpersonview (Incanto)

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

- Left click (Mouse0, KeyF aliased for the button) FIRES: BulletGun spawns
  an emissive 0.05×0.05×0.15 tracer 1.5u ahead, 200 u/s, visible after
  150ms, gone at 500ms or floor hit — the original's exact numbers. No
  explosion particles (documented divergence).
- The character model is meter-scale; `targetHeight` fit logs a warning and
  keeps authored scale (skinned rigs defeat bbox measurement) — expected.
- Camera collision (pull-in when geometry blocks the view) is not
  implemented; nothing in this scene can block the camera.
- Shadows are not enabled in this template yet (FollowLight tracks position
  only).
