# Structure — basic-3d-sideview

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` owns a single `isLoading` flag that swaps `PreloadScene` for `GameScene` once every asset in `src/assets.json` is warm. Renders into a full-viewport container.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives, fonts).

## `src/assets.json`

Asset manifest — character model and animation URLs. Consumed by both `PreloadScene` (to warm the browser cache) and `Player` (to resolve animation URLs in the animation config map).

## `src/constants/`

- **`character.ts`** — animation state ids (idle, idle_01, walk, run, fast_run, jump, punch, punch_01, kick, kick_01, kick_02, melee_attack, cast, hit, die).
- **`rigidBodyObjectType.ts`** — rigid-body category enum (local player, enemy, monster, wall, obstacle, item, bullet, floor, plotting board).

> Keyboard/mouse/touch bindings live inline in `InputController.tsx`; no shared `controls.ts` ships.

## `src/stores/` (Zustand)

- **`gameStore.ts`** — global lifecycle; holds `isMapPhysicsReady`.
- **`localPlayerStore.ts`** — local-player state (position, speed).
- **`multiPlayerStore.ts`** — registry of remote-player rigid-body refs.
- **`playerActionStore.ts`** — combat action transitions (punch, kick, meleeAttack, cast). Implemented as a plain singleton object exposed through a hook, not `create()`.

## `src/components/r3f/` (inside `Canvas`)

- **`GameSceneCanvas.tsx`** — R3F `Canvas` root. Hosts Rapier `Physics` (paused until `isMapPhysicsReady`), `SideViewController` (`cameraMode="perspective"`, `followCharacter={true}`, `camDistance={10}`), `FollowLight`, and mounts `MapPhysicsReadyChecker` plus `Experience`.
- **`Experience.tsx`** — in-canvas scene content: ambient light, sunset `Environment` (not used as background), `Player`, `Floor`.
- **`MapPhysicsReadyChecker.tsx`** — raycasts downward each frame to detect map geometry; flips `isMapPhysicsReady` on hit or after a 180-frame timeout. Ignores capsules and sensor colliders.
- **`Player.tsx`** — wraps `RigidBodyPlayer` + `CharacterRenderer`. Owns the animation config map, derives movement state via `useControllerStore.getCharacterMovementState()`, runs combat transitions from `playerActionStore`, lock/unlock controls around one-shot actions, and streams position into `localPlayerStore` with a squared-distance threshold.
- **`Floor.tsx`** — seed-based procedural platform strip. Generates an initial wide block at the origin plus a run of fixed `RigidBody` blocks to the right and a shorter run to the left, with randomized width, depth, height, gap, and y-offset driven by a `SeededRandom` instance (default seed `12345`).

## `src/components/scene/`

- **`GameScene.tsx`** — layout shell stitching `GameSceneCanvas` (3D) and `GameSceneUI` (DOM overlay). Contains performance-critical warnings against mixing concerns.
- **`PreloadScene.tsx`** — runs before `GameScene`. Iterates every category in `assets.json`, dispatches the right loader per extension (`GLTFLoader`, `TextureLoader`, `Audio`, `<video>`, `fetch` fallback) through a shared `THREE.LoadingManager`, and shows a percentage progress bar.

## `src/components/ui/` (DOM overlay)

- **`GameSceneUI.tsx`** — UI overlay container; mounts `InputController` and the in-game `LoadingScreen` while `isMapPhysicsReady` is `false`.
- **`LoadingScreen.tsx`** — spinner + label. Self-detects whether it is mounted inside the R3F `Canvas` and wraps itself in `<Html>` if so.
- **`InputController.tsx`** — keyboard + mouse + touch. Writes movement/action into `vibe-starter-3d`'s `useInputStore` and combat transitions into `playerActionStore`. On mobile, spawns an `nipplejs` virtual joystick on the left half of the screen and renders on-screen JUMP and ATTACK buttons.
