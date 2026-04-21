# Status — basic-3d-flightview

## Implemented

- Flight camera and controller (`FlightViewController`) with throttle (W/S), yaw (A/D), pitch (Arrow Up/Down), roll (Arrow Left/Right)
- Kinematic player (`RigidBodyPlayer` + manual `CuboidCollider`) wrapping a procedural `Aircraft` mesh with wingtip `Trail`s and speed-reactive propeller
- Physics-ready bootstrap (`MapPhysicsReadyChecker` + `LoadingScreen`) gating Rapier `Physics`
- Bullet / explosion pipeline via `effectStore` → `EffectContainer` (`Bullet`, `BulletEffectController`, `MuzzleFlash`, `Explosion`); `Space` fires with a 200 ms cooldown, hits spawn an explosion at the contact point
- Player reset on `R` (edge-triggered) via `useControllerState`
- Local position + 5-frame averaged speed streaming into `localPlayerStore`
- Multi-player rigid-body registry (`multiPlayerStore`) keyed by `@agent8/gameserver` account
- HUD `StatusDisplay` showing player count, HP%, speed (km/h), altitude (m), and controls
- World: `SEA` plane, grass `FLOOR`, runway with 100 lane markings, 500 scattered decor meshes, 150 `FloatingShapes` (balloon / bird / plane) with oscillate / circle / drift motion
- Lighting and sky: ambient + `FollowLight` + drei `Sky`
- Desktop pointer lock requested on canvas `pointerdown`

## Installed but not wired

- `@react-three/postprocessing` — no effect composer mounted
- `lucide-react` — no icons referenced
- `src/constants/controls.ts` — `KeyboardControlsEntry[]` exported but unused; flight keys live inline in `GameSceneCanvas`
- Several `RigidBodyObjectType` tags (`ENEMY`, `MONSTER`, `WALL`, `OBSTACLE`, `ITEM`, `PLOTTING_BOARD`) and aircraft `DIE` state — defined but no behavior attached
