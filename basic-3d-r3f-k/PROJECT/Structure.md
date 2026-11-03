# Structure — basic-3d-r3f-k

## `src/config.ts`

`PHYSICS_DEMO`, and the tuning tables `PLAYER` (speeds, gravity, jump,
coyote/buffer, `stepHeight`) and `CAMERA`.

## `src/App.tsx`

`<Canvas>` with `Level`, `Player`, `CameraRig` (and `LazyPhysics` when
enabled), a hint label, and `MobileControls`. Binds the keyboard.

## `src/game/`

- `input.ts` — keyboard set, joystick axes, `jumpPressedAt`; `moveAxis()`, `wantsRun()`.
- `player.ts` — pure `stepPlayer()`: acceleration, jump (coyote + buffer),
  gravity, axis-by-axis AABB collision with step-up, ramps, riding moving
  boxes, respawn below `killY`.
- `player.test.ts` — `bun test` for ground, coyote, buffer, consume, step-up,
  ramp, platform.
- `world.ts` — `BOXES`, `RAMPS`, `PLATFORM` (shared with the R variant).
- `anim.ts` — shared animation state and `retarget()` for mixamo clip GLBs.
- `state.ts` — the shared `player` and camera `rig` objects.

## `src/components/`

- `Player.tsx` — camera-relative input → `stepPlayer` in 1/120 s substeps,
  moves the platform AABB first, sets the animation state, draws `Character`
  and the platform.
- `Character.tsx` — verse8 base character (capsule until loaded), clip cross-fade.
- `CameraRig.tsx` — orbit (drag + wheel).
- `Level.tsx` — sky, fog, lights, boxes, ramps; `PlatformMesh`.
- `MobileControls.tsx` — joystick + JUMP, shown on touch devices up front.

## `src/physics/`

- `LazyPhysics.tsx` — `React.lazy(() => import('./PhysicsDemo'))`.
- `PhysicsDemo.tsx` — `<Physics>` with a floor collider and falling crates.

## Extension points

- New obstacle/platform: add to `BOXES` / `RAMPS` (and mirror in the R variant).
- New action: key in `input.ts` + button in `MobileControls.tsx`.
