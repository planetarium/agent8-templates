# Structure — basic-3d-quarterview

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` holds an `isLoading` flag that renders `PreloadScene` until assets finish loading, then swaps in `GameScene`.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives, fonts).

## `src/assets.json`

Asset manifest — character model and animation URLs. Consumed by both `PreloadScene` (for preloading) and `Player.tsx` (for `CharacterRenderer` + `animationConfigMap`).

## `src/constants/`

- **`character.ts`** — animation state ids (idle, idle_01, walk, run, fast_run, jump, punch, punch_01, kick, kick_01, kick_02, melee_attack, cast, hit, die).
- **`rigidBodyObjectType.ts`** — rigid-body category enum (local_player, enemy, monster, wall, obstacle, item, bullet, floor, plotting_board).

> Keyboard and joystick bindings live inside `components/ui/InputController.tsx`; no `controls.ts` ships.

## `src/stores/` (Zustand)

- **`gameStore.ts`** — global lifecycle; holds `isMapPhysicsReady`.
- **`localPlayerStore.ts`** — local-player state (position, speed).
- **`multiPlayerStore.ts`** — registry of remote-player rigid-body refs.
- **`playerActionStore.ts`** — combat action flags (punch, kick, meleeAttack, cast). Plain object exposed via `usePlayerActionStore()` (not a Zustand store despite the filename).

## `src/components/r3f/` (inside `Canvas`)

- **`GameSceneCanvas.tsx`** — R3F `Canvas` root. Hosts Rapier `Physics` (paused until `isMapPhysicsReady`), `QuarterViewController` with `followCharacter`, `FollowLight`, and mounts `MapPhysicsReadyChecker` (only while not ready) plus `Experience`.
- **`Experience.tsx`** — scene contents: ambient light, sunset `Environment`, `Player`, `Floor`.
- **`MapPhysicsReadyChecker.tsx`** — raycasts downward each frame to detect map geometry; flips `isMapPhysicsReady` on hit or after a 180-frame timeout. Ignores capsules and sensor colliders.
- **`Player.tsx`** — wraps `RigidBodyPlayer` + `CharacterRenderer`. Drives animation state from `useControllerStore` movement + `playerActionStore` combat flags, locks controls during action animations, and resolves back to idle via `onAnimationComplete`. Registers its rigid body into `multiPlayerStore` and streams position (threshold-gated) into `localPlayerStore`.
- **`Floor.tsx`** — flat 100x100 ground plane with a fixed cuboid collider.

## `src/components/scene/`

- **`GameScene.tsx`** — layout shell stitching `GameSceneCanvas` (3D) and `GameSceneUI` (DOM overlay). Contains performance-critical warnings against mixing concerns.
- **`PreloadScene.tsx`** — walks every category in `assets.json`, loads each URL with the right loader (GLTF / texture / audio / video / fetch) via a shared `THREE.LoadingManager`, renders a progress bar, and calls `onComplete` when done.

## `src/components/ui/` (DOM overlay)

- **`GameSceneUI.tsx`** — UI overlay container; mounts `InputController` and shows `LoadingScreen` while `isMapPhysicsReady` is `false`.
- **`LoadingScreen.tsx`** — fullscreen spinner; auto-wraps in `<Html>` if rendered inside the Canvas.
- **`InputController.tsx`** — keyboard + mouse + touch input. Keyboard map (WASD/Arrows, Space, Shift) and action map (F/Mouse0 punch, G/Mouse2 kick, Q/C melee, E/Mouse1 cast) are declared inline. On mobile (`IS_MOBILE`) it injects a `nipplejs` virtual joystick on the left half of the screen plus on-screen Attack / Jump buttons; feeds `useInputStore` (vibe-starter-3d) and `playerActionStore`.
