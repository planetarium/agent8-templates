# Structure — basic-3d-r3f-skeleton

## `src/config.ts`

`VIEW_MODE` (the freeview/sideview switch), `PHYSICS_DEMO`, and the tuning
tables `PLAYER` (speed, gravity, jump, coyote/buffer) and `CAMERA`.

## `src/App.tsx`

`<Canvas>` with `Level`, `Player`, `CameraRig` (and `LazyPhysics` when
enabled), a hint label, and `MobileControls`. Binds the keyboard.

## `src/game/`

- `input.ts` — keyboard set, joystick axes, `jumpPressedAt`; `moveAxis()`.
- `player.ts` — pure `stepPlayer()`: acceleration, jump (coyote + buffer),
  gravity, axis-by-axis AABB collision, respawn below `killY`.
- `player.test.ts` — `bun test` for ground detection, coyote, buffer, consume.
- `world.ts` — `BOXES` (drawn) → `COLLIDERS` (collided).
- `state.ts` — the shared `player` and camera `rig` objects.

## `src/components/`

- `Player.tsx` — converts input to world direction (camera-relative in
  freeview, x-only in sideview), runs `stepPlayer` in 1/120 s substeps,
  draws the placeholder capsule. Swap `Body` for a GLTF character.
- `CameraRig.tsx` — `mode` prop: orbit (drag + wheel) or side follow.
- `Level.tsx` — sky, fog, hemisphere + shadowed sun following the player, boxes.
- `MobileControls.tsx` — joystick + JUMP, shown on touch devices up front.

## `src/physics/`

- `LazyPhysics.tsx` — `React.lazy(() => import('./PhysicsDemo'))`.
- `PhysicsDemo.tsx` — `<Physics>` with a floor collider and falling crates.

## Extension points

- New obstacle/platform: add to `BOXES`.
- Character model: register in `assets.json`, `useGLTF` in `Player.tsx` `Body`.
- Pushable/dynamic objects: put them under `src/physics/`; to make the player
  a rapier body, replace `stepPlayer` with a `KinematicCharacterController`
  inside the lazy physics tree (keep the coyote/buffer rules from `player.ts`).
- New action: key in `input.ts` + button in `MobileControls.tsx`.
