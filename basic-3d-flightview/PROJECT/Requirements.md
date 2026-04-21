# Requirements — basic-3d-flightview

## Coding Patterns

- Stores are concern-split (Zustand): `gameStore`, `localPlayerStore`, `multiPlayerStore`, `effectStore` — do not cross-write.
- R3F goes under `components/r3f/`, DOM under `components/ui/`; `GameScene.tsx` stitches them and must not render 3D directly or hold state.
- Extend behavior on `Player.tsx`; keep `Aircraft.tsx` as a pure visual/mesh component driven by props and `localPlayerStore`.
- New visual effects: add an `EffectType` in `types/effect.ts`, a controller under `components/r3f/effects/`, and a `switch` case in `EffectContainer.tsx`. Spawn them via `effectStore.addEffect`, never by direct mount.
- No magic values for categories — aircraft ids in `constants/aircraft.ts`, rigid-body tags in `constants/rigidBodyObjectType.ts`.
- Local player speed is stored in m/s; convert with `× 3.6` at the UI boundary.

## Known Issues / Constraints

- Flight key bindings are declared inline in `GameSceneCanvas.tsx` (`FlightControllerKeyMapping`); `src/constants/controls.ts` is currently unused and must be wired manually if you want a single source of truth.
- `MapPhysicsReadyChecker` has a 180-frame timeout and only fires a single ray straight down from `(0, 50, 0)` — maps whose geometry does not intersect that ray will fall through to the timeout path.
- `Player` is a kinematic sensor with `gravityScale={0}` and `enabledRotations=[false,false,false]` — gravity, impulses, and dynamic rotations do not apply; motion and attitude are driven by `FlightViewController` via `useControllerState`.
- Pointer lock is requested unconditionally on `pointerdown`; there is no mobile guard and no touch/joystick UI.
- The bullet pipeline freezes a bullet for up to 3 frames after a hit to wait for `onTriggerEnter`; overlapping sensors may defer explosion spawn by that window.
- `@react-three/postprocessing` is installed but no effect composer is mounted.
