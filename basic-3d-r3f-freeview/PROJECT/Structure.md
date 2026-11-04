# Structure — basic-3d-r3f-freeview

## `src/config.ts`

`PHYSICS_DEMO`, and the tuning tables `PLAYER` (speeds, gravity, jump,
coyote/buffer, `stepHeight`) and `CAMERA.free` (orbit distance and pitch).

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
- `world.ts` — `BOXES`, `RAMPS`, `PLATFORM`: the course along z = 0
  (stairs, ledge, platform, ramp) plus scenery behind it.
- `anim.ts` — shared animation state and `retarget()` for mixamo clip GLBs.
- `state.ts` — the shared `player` and camera `rig` (yaw, pitch, distance).

## `src/components/`

- `Player.tsx` — camera-relative input → `stepPlayer` in 1/120 s substeps,
  moves the platform AABB first, sets the animation state, draws `Character`
  and the platform.
- `Character.tsx` — verse8 base character (a placeholder capsule until the
  GLB loads), clip cross-fade.
- `CameraRig.tsx` — 3rd-person orbit around the player (drag + wheel).
- `Level.tsx` — sky, fog, lights, boxes, ramps; `PlatformMesh`.
- `MobileControls.tsx` — joystick + JUMP, shown on touch devices up front.

## `src/physics/`

Rapier (`@react-three/rapier`) is installed but lazy: import it only from
files under `src/physics/` that are reached through `React.lazy`
(`LazyPhysics.tsx`). A static import anywhere else puts ~2 MB of wasm into the
first load. Dynamic bodies (balls, pins, stackable crates — anything that
should roll, tip over or be pushed): switch on the lazy rapier path in
`src/physics/` (mount `LazyPhysics` / `PhysicsDemo`, the `?physics` chunk) and
build those bodies there with `@react-three/rapier`. Do not hand-write their
physics. Leave the player controller (`src/game/player.ts`) as it is.

- `LazyPhysics.tsx` — `React.lazy(() => import('./PhysicsDemo'))`.
- `PhysicsDemo.tsx` — `<Physics>` with a floor collider and falling crates.

## Extension points

- New obstacle/platform: add to `BOXES` / `RAMPS` in `world.ts`.
- New action: key in `input.ts` + button in `MobileControls.tsx`.
- New dynamic bodies: in `PhysicsDemo.tsx` (or another file under
  `src/physics/` reached through `LazyPhysics`), mounted by default by setting
  `PHYSICS_DEMO = true`.
