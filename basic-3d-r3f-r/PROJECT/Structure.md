# Structure — basic-3d-r3f-r

## `src/config.ts`

Tuning tables `PLAYER` (size, speeds, ecctrl jump velocity and float height)
and `CAMERA`.

## `src/App.tsx`

`<Canvas>` with `Level`, `<Physics>` (`World` + `Player`), `CameraRig`, a hint
label, and `MobileControls`. Binds the keyboard.

## `src/game/`

- `input.ts` — keyboard set, joystick axes; `moveAxis()`, `wantsRun()`.
- `world.ts` — `BOXES`, `RAMPS`, `PLATFORM` (shared with the K variant).
- `anim.ts` — shared animation state and `retarget()` for mixamo clip GLBs.
- `state.ts` — the shared `player` position.

## `src/components/`

- `Player.tsx` — `<Ecctrl>` + `EcctrlAnimationStateController`; feeds input
  with `setMovement()`, maps ecctrl animation states, respawns below `killY`.
- `Character.tsx` — verse8 base character (capsule until loaded), clip cross-fade.
- `CameraRig.tsx` — `EcctrlCameraControls` following the player.
- `Level.tsx` — sky, fog, lights, boxes, ramps; `PlatformMesh`.
- `MobileControls.tsx` — ecctrl `Joystick` + `VirtualButton`, shown on touch devices up front.

## `src/physics/`

- `World.tsx` — fixed colliders for boxes and ramps, kinematic moving platform.

## Extension points

- New obstacle/platform: add to `BOXES` / `RAMPS` (and mirror in the K variant).
- New action: key in `input.ts` + a `VirtualButton` in `MobileControls.tsx`,
  read it in `Player.tsx`.
