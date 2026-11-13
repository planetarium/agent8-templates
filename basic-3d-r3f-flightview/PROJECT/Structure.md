# Structure — basic-3d-r3f-flightview

## `src/config.ts`

`PHYSICS_DEMO`, and the tuning tables `FLIGHT` (speeds, rates, ground
authority, rest height), `GUN` (bullet speed, life, cooldown), `CAMERA`
(chase offset, slerp, follow rate, FOV) and `WORLD` (grass / sea size,
runway, decor seed and counts).

## `src/App.tsx`

`<Canvas>` with `World`, `Airplane`, `Bullets`, `ChaseCamera` (and
`LazyPhysics` when enabled), a hint label, the `Hud` and `MobileControls`.
Binds the keyboard.

## `src/game/`

- `flight.ts` — pure flight step: `createFlight()`, `stepFlight(state,
  input, dt, groundAt?)`, `resetFlight()`, `authority()`, `altitude()`,
  `measuredSpeed()`; the gun: `createGun()`, `fire()`, `stepBullets()`; small
  quaternion helpers (`quatMul`, `quatAxisAngle`, `rotate`, `forwardOf`).
- `decor.ts` — pure seeded scenery: `makeDecor(seed, ground, sky)` and
  `skyPosition(decor, t)`.
- `flight.test.ts` — `bun test` for throttle, attitude, ground clamp,
  take-off, reset, gun and decor.
- `imports.test.ts` — `bun test` that `config.ts` stays a leaf (loads no game
  module or package), so game modules can import `config` safely.
- `input.ts` — keyboard set, joystick, touch throttle / fire; `readFlight()`
  turns them into a `FlightInput`, `wantsFire()`.
- `state.ts` — the shared `plane` and `gun`.
- `anim.ts` — `AnimState` and `retarget()` for mixamo clip GLBs, used by
  `components/models/AnimatedModel.tsx` (see "Model parts").

## `src/components/`

- `Airplane.tsx` — runs the flight step, fires and moves bullets every frame
  (before the camera), draws the plane (`Model`, primitives); `Bullets` draws
  live bullets as one instanced mesh.
- `ChaseCamera.tsx` — chase camera with a lagging copy of the plane's
  attitude; banks with the plane.
- `World.tsx` — sky, fog, sun following the plane, sea, grass, runway,
  instanced stripes and scenery.
- `Hud.tsx` — speed and altitude, written to the DOM every 100 ms.
- `MobileControls.tsx` — joystick (pitch / roll), throttle rocker, FIRE;
  shown on touch devices up front.

## `src/physics/`

Rapier (`@react-three/rapier`) is installed but lazy: import it only from
files under `src/physics/` that are reached through `React.lazy`
(`LazyPhysics.tsx`). A static import anywhere else puts ~2 MB of wasm into the
first load. Dynamic bodies (balls, pins, stackable crates — anything that
should roll, tip over or be pushed): switch on the lazy rapier path in
`src/physics/` (mount `LazyPhysics` / `PhysicsDemo`, the `?physics` chunk) and
build those bodies there with `@react-three/rapier`. Do not hand-write their
physics.

- `LazyPhysics.tsx` — `React.lazy(() => import('./PhysicsDemo'))`.
- `PhysicsDemo.tsx` — `<Physics>` with a floor collider (top at y = 0, the
  grass level) and falling crates.

## Controls

| | |
| --- | --- |
| Shift / Ctrl | speed up / slow down |
| W / S, ↑ / ↓ | nose down / nose up |
| A / D, ← / → | roll left / right |
| Q / E | yaw left / right |
| Space | fire |
| R | back to the runway |
| Touch | stick = pitch & roll (up = nose down), ▲ / ▼ = throttle, FIRE |

## Model parts (putting models in)

Shared by every R3F template (`npm run 3d:sync` keeps them identical) and
imported by no scene yet — import them when the game needs a model; don't
rewrite them. Library models come at any scale (a mixamo rig is often a
0.01 Armature); these measure the bounding box after `updateMatrixWorld`,
scale to metres and stand the lowest point on y = 0. Model URLs go in
`src/assets.json` `models`.

| path | for | required |
| --- | --- | --- |
| `src/game/fitModel.ts` | `fitModel(object, { height })` → `{ unit, lift }`: draw with `scale={unit}`, `position-y={lift}` | `object`, `height` (m) |
| `src/components/models/Props.tsx` | `<Props>`: a static model (crate, barrel, rock, house) at every `Placement` (`{ x, y, z, rotY, scale }`), instanced past 30 copies | `url`, `height` (m), `at` |
| `src/components/models/AnimatedModel.tsx` | `<AnimatedModel>`: a rigged enemy / NPC, feet at its origin, facing +z; plays its own named clips, a mixamorig rig without them borrows idle / walk / run (`assets.json` `animations`, `game/anim.ts` `retarget`); `source={{ state }}` picks the clip | `url`, `height` (m) |

## Extension points

- A model for the plane: replace `Model` in `Airplane.tsx` with a
  `useGLTF` scene in `<Suspense>`, URL in `src/assets.json`, nose toward
  −z, wheels 0.3 m (`FLIGHT.restHeight`) below the origin.
- Targets: keep their positions in a mutable list, test bullet hits in a
  pure function next to `stepBullets`, draw them instanced.
- Terrain: pass `groundAt(x, z)` to `stepFlight` / `stepBullets` and draw the
  same height in `World.tsx`.
- New action: key in `input.ts` + button in `MobileControls.tsx`.
- New dynamic bodies: in `PhysicsDemo.tsx` (or another file under
  `src/physics/` reached through `LazyPhysics`), mounted by default by setting
  `PHYSICS_DEMO = true`.
