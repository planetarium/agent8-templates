# Structure — basic-3d-freeview

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` renders `GameScene` inside a full-viewport container.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives, fonts).

## `src/assets.json`

Asset manifest — character model and animation URLs.

## `src/constants/`

- **`character.ts`** — animation state ids (idle, walk, run, jump, punch, kick, melee attack, cast, hit, dance, swim, die).
- **`rigidBodyObjectType.ts`** — rigid-body category enum (player, enemy, monster, wall, obstacle, item, bullet, floor, …).

> Keyboard bindings come from `vibe-starter-3d`'s `FreeViewController` defaults; no local `controls.ts` ships.

## `src/stores/` (Zustand)

- **`gameStore.ts`** — global lifecycle; holds `isMapPhysicsReady`.
- **`localPlayerStore.ts`** — local-player state (position etc.).
- **`multiPlayerStore.ts`** — registry of remote-player rigid-body refs.
- **`playerActionStore.ts`** — combat action transitions (punch, kick, melee, cast).

## `src/components/r3f/` (inside `Canvas`)

- **`GameSceneCanvas.tsx`** — R3F `Canvas` root. Hosts Rapier `Physics` (paused until `isMapPhysicsReady`), `FreeViewController`, lighting (ambient + `FollowLight`), sunset `Environment`, and mounts `MapPhysicsReadyChecker`, `Player`, `Floor`. Requests desktop pointer-lock on `pointerdown`.
- **`MapPhysicsReadyChecker.tsx`** — raycasts downward each frame to detect map geometry; flips `isMapPhysicsReady` on hit or after a 180-frame timeout. Ignores capsules and sensor colliders.
- **`Player.tsx`** — wraps `RigidBodyPlayer` + `CharacterRenderer`; owns animation-state determination and trigger-based collision handling.
- **`Floor.tsx`** — flat ground plane with a physics collider.

## `src/components/scene/`

- **`GameScene.tsx`** — layout shell stitching `GameSceneCanvas` (3D) and `GameSceneUI` (DOM overlay). Contains performance-critical warnings against mixing concerns.

## `src/components/ui/` (DOM overlay)

- **`GameSceneUI.tsx`** — UI overlay container.
- **`LoadingScreen.tsx`** — shown while `isMapPhysicsReady` is `false`.
- **`InputController.tsx`** — keyboard / mouse / touch input, with `nipplejs` virtual joystick and action buttons on mobile.
