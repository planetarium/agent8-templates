# Structure — basic-3d-firstpersonview

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` renders `GameScene` inside a full-viewport container.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives, fonts).

## `src/assets.json`

Asset manifest — character model and animation URLs.

## `src/constants/`

- **`character.ts`** — animation state ids (idle, walk, run, jump, hit, die and extended action states used by the animation map).
- **`rigidBodyObjectType.ts`** — rigid-body category enum (local player, enemy, monster, wall, obstacle, item, bullet, floor, …).

> Keyboard bindings and action mapping (incl. `Mouse0` → `attack`) live inline in `components/ui/InputController.tsx`; no local `controls.ts` ships.

## `src/stores/` (Zustand)

- **`gameStore.ts`** — global lifecycle; holds `isMapPhysicsReady`.
- **`localPlayerStore.ts`** — local-player state (position etc.).
- **`multiPlayerStore.ts`** — registry of remote-player rigid-body refs; consumed by `EffectContainer` to resolve effect owners.
- **`playerActionStore.ts`** — transient action flags (punch, kick, meleeAttack, cast, attack).
- **`effectStore.ts`** — active visual-effect list with key counter; `addEffect` / `removeEffect` and `useActiveEffects` selector.

## `src/types/`

- **`effect.ts`** — `EffectType` enum (`BULLET`, `EXPLOSION`), `EffectData`, `ActiveEffect`, `EffectEventMessage`.
- **`index.ts`** — re-exports.

## `src/utils/`

- **`effectUtils.ts`** — `createBulletEffectConfig`, `createExplosionEffectConfig`; serialize `THREE.Vector3` to arrays for store payloads.

## `src/components/r3f/` (inside `Canvas`)

- **`GameSceneCanvas.tsx`** — R3F `Canvas` root. Hosts Rapier `Physics` (paused until `isMapPhysicsReady`), `FirstPersonViewController`, lighting (ambient + `FollowLight`), sunset `Environment`, and mounts `MapPhysicsReadyChecker`, `EffectContainer`, `Player`, `Floor`. Requests desktop pointer-lock on `pointerdown`.
- **`MapPhysicsReadyChecker.tsx`** — raycasts downward each frame to detect map geometry; flips `isMapPhysicsReady` on hit or after a 180-frame timeout. Ignores capsules and sensor colliders.
- **`Player.tsx`** — wraps `RigidBodyPlayer` + `CharacterRenderer` (visible=false). Owns animation-state determination, trigger-based collision handling, and left-click shooting: reads `attack` from `playerActionStore`, uses camera forward to build a bullet config, calls `effectStore.addEffect(BULLET, ...)` with a cooldown.
- **`Floor.tsx`** — flat ground plane as a `RigidBodyObject` tagged `FLOOR`.
- **`EffectContainer.tsx`** — subscribes to `useActiveEffects`; renders a `BulletEffectController` or `Explosion` per entry, resolves `owner` via `multiPlayerStore`, and on bullet hit spawns an explosion at the hit point.

## `src/components/r3f/effects/`

- **`BulletEffectController.tsx`** — parses store config back to `THREE.Vector3`, offsets the start along direction, mounts `Bullet` and (optionally) `MuzzleFlash`. Defines `BulletEffectConfig`.
- **`Bullet.tsx`** — kinematic-velocity `RigidBodyObject` sensor tagged `BULLET`. Per-frame raycasts forward, freezes on hit (up to 3 frames), translates to hit point, and fires `onHit` via trigger enter; excludes its own collider and the firer `owner`. 150 ms visibility delay and lifetime-based removal.
- **`MuzzleFlash.tsx`** — short-lived additive-blended flash at the muzzle; cone petals + inner glow with opacity falloff.
- **`Explosion.tsx`** — two-group instanced particle burst with 500 ms fade; completes itself.

## `src/components/scene/`

- **`GameScene.tsx`** — layout shell stitching `GameSceneCanvas` (3D) and `GameSceneUI` (DOM overlay). Contains performance-critical warnings against mixing concerns.

## `src/components/ui/` (DOM overlay)

- **`GameSceneUI.tsx`** — UI overlay container; gates `Crosshair` on `isMapPhysicsReady` and mounts `InputController`.
- **`LoadingScreen.tsx`** — shown while `isMapPhysicsReady` is `false`.
- **`Crosshair.tsx`** — centered FPV crosshair; tracks canvas center via `resize` / `orientationchange` / `scroll`.
- **`InputController.tsx`** — keyboard + mouse + touch input. Maps WASD/arrows/space/shift to `useInputStore`, maps `Mouse0` → `attack` into `playerActionStore`. On mobile renders a `nipplejs` joystick on the left half of the screen and on-screen `ATTACK` / `JUMP` buttons.
