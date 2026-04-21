# Structure — basic-3d-flightview

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` renders `GameScene` inside a full-viewport container.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives, fonts).

## `src/constants/`

- **`aircraft.ts`** — aircraft state ids (`ACTIVE`, `DIE`), `DEFAULT_BODY_LENGTH`, `HIT_BODY_SIZE`.
- **`controls.ts`** — `KeyboardControlsEntry[]` list (forward, yaw, pitch, roll, attack, reset, action1–4). Not currently wired; flight keys live inside `GameSceneCanvas`.
- **`rigidBodyObjectType.ts`** — rigid-body category enum (`LOCAL_PLAYER`, `ENEMY`, `MONSTER`, `WALL`, `OBSTACLE`, `ITEM`, `BULLET`, `FLOOR`, `SEA`, `PLOTTING_BOARD`).

## `src/types/`

- **`effect.ts`** — `EffectType` enum (`BULLET`, `EXPLOSION`), `EffectData`, `ActiveEffect`, `EffectEventMessage`.
- **`index.ts`** — re-exports from `./effect`.

## `src/utils/`

- **`effectUtils.ts`** — `createBulletEffectConfig` and `createExplosionEffectConfig`; serialize `THREE.Vector3` into array form for the effect store.

## `src/stores/` (Zustand)

- **`gameStore.ts`** — global lifecycle; holds `isMapPhysicsReady`.
- **`localPlayerStore.ts`** — local player position and speed (m/s; multiply by 3.6 for km/h).
- **`multiPlayerStore.ts`** — registry of remote-player `RigidBody` refs.
- **`effectStore.ts`** — queue of active effects (`activeEffects`) keyed by an incrementing counter; `addEffect` / `removeEffect`.

## `src/components/r3f/` (inside `Canvas`)

- **`GameSceneCanvas.tsx`** — R3F `Canvas` root. Declares `FlightControllerKeyMapping` (W/S throttle, A/D yaw, Arrows pitch/roll), hosts Rapier `Physics` (paused until `isMapPhysicsReady`), `FlightViewController`, `Sky`, ambient + `FollowLight`, and mounts `MapPhysicsReadyChecker`, `EffectContainer`, `Player`, `FloatingShapes`, `Ground`. Requests pointer lock on `pointerdown`.
- **`MapPhysicsReadyChecker.tsx`** — downward raycast from `(0, 50, 0)` each frame; flips `isMapPhysicsReady` on the first non-sensor, non-Capsule hit or after 180 frames.
- **`Player.tsx`** — wraps `RigidBodyPlayer` + `Aircraft`. Kinematic (no gravity, sensor), uses a manual `CuboidCollider`. Registers into `multiPlayerStore`, streams position and 5-frame averaged speed into `localPlayerStore`, fires bullets on `Space` with a 200 ms cooldown via `effectStore`, and resets pose on `R` (edge-triggered).
- **`Aircraft.tsx`** — procedural plane mesh (body, wings, cockpit, tail, nose cone, propeller). Spins the propeller each frame (scaled by `localPlayerStore.state.speed` when `localPlayer` is true, otherwise fixed) and renders two `Trail`s off the wingtip targets.
- **`FloatingShapes.tsx`** — spawns 150 kinematic `RigidBodyObject`s (balloon / bird / plane) across a 3000×3000 area between `y ≈ 100–400`, each with one of three motion types: `oscillate`, `circle`, `drift`.
- **`Ground.tsx`** — world geometry and decor: a `SEA`-tagged plane (10000×10000), a `FLOOR`-tagged grass plane (1000×1000), a 6×1000 runway with 100 lane markings, and 500 randomly scattered decorative meshes (box / sphere / cone) that avoid the runway corridor.
- **`EffectContainer.tsx`** — renders effects from `effectStore`. Dispatches `BULLET` to `BulletEffectController` (wires `owner` via `multiPlayerStore.getConnectedPlayerRef`) and `EXPLOSION` to `Explosion`; on bullet hit, spawns an explosion at the contact point (skipping self-hits).

## `src/components/r3f/effects/`

- **`Bullet.tsx`** — kinematic-velocity `RigidBodyObject` with a `BULLET` tag. Moves via `castRay` per frame for accurate fast-body hit detection, freezes for up to 3 frames on hit to let `onTriggerEnter` resolve, and fires `onHit` / `onComplete`.
- **`BulletEffectController.tsx`** — deserializes config, offsets the start position forward by 1 unit, renders `Bullet` and an optional `MuzzleFlash`.
- **`MuzzleFlash.tsx`** — short-lived cone-petal + inner-glow flash oriented along the fire direction; fades out over `duration`.
- **`Explosion.tsx`** — two instanced particle clouds (white + grey) that expand from the hit point and fade out over 500 ms.

## `src/components/scene/`

- **`GameScene.tsx`** — layout shell stitching `GameSceneCanvas` (3D) and `GameSceneUI` (DOM overlay). Contains performance warnings against holding state in this node.

## `src/components/ui/` (DOM overlay)

- **`GameSceneUI.tsx`** — shows `LoadingScreen` while `isMapPhysicsReady` is `false`, otherwise `StatusDisplay`.
- **`LoadingScreen.tsx`** — full-screen spinner; auto-wraps in `<Html center>` when rendered inside `Canvas`.
- **`StatusDisplay.tsx`** — HUD overlay. Reads speed (km/h) and altitude (m) from `localPlayerStore` via `requestAnimationFrame`, HP and player count from `@agent8/gameserver` (`subscribeRoomMyState`, `subscribeRoomState`), and lists the control scheme.
