# Structure — basic-3d-flightview-multiplay

## `src/main.tsx`, `src/App.tsx`

Entry point and root flow controller. `App` uses `useGameServer` from `@agent8/gameserver`, wires `networkSyncStore.setServer`, and switches between `NicknameSetup`, `RoomManager`, `LobbyRoom`, and `GameScene` based on connection / nickname / room / `roomStarted` / `isReady` state. Exposes `joinRoom`, `leaveRoom` remote-function calls and subscribes to `subscribeRoomState` + `subscribeRoomMyState`.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives).

## `src/assets.json`

Asset manifest — character / animation URLs. Not used by the current aircraft scene but shipped for future extension.

## `src/constants/`

- **`aircraft.ts`** — `AircraftState` enum (`ACTIVE`, `DIE`), `DEFAULT_BODY_LENGTH`, `HIT_BODY_SIZE`.
- **`controls.ts`** — keyboard map for `KeyboardControls`: forward/back, yawLeft/yawRight, pitchUp/pitchDown, rollLeft/rollRight, attack (Space), action1–4.

## `src/stores/` (Zustand)

- **`playerStore.ts`** — `usePlayerStore`: registry of local + remote player `RigidBody` refs keyed by account.
- **`effectStore.ts`** — `useEffectStore`: `activeEffects` list with `addEffect` / `removeEffect` and monotonic `effectKeyCounter`.
- **`networkSyncStore.ts`** — `networkSyncStore`: holds `GameServer`, drives a 3 s ping loop against `handlePing`, keeps last 5 RTT samples and an outlier-trimmed average.

## `src/types/`

- **`user.ts`** — `UserState` (account, nickname, isReady, position, rotation, state, stats with `maxHp` / `currentHp`).
- **`player.ts`** — `PlayerInputs` flags (isRevive, isDying, isHit, isMoving).
- **`effect.ts`** — `EffectType` (`BULLET`, `EXPLOSION`), `EffectData`, `ActiveEffect`, `EffectEventMessage`.
- **`index.ts`** — barrel exports.

## `src/utils/effectUtils.ts`

`createBulletEffectConfig` and `createExplosionEffectConfig` — serialize `THREE.Vector3` into plain arrays so effect configs can travel over the wire.

## `src/components/r3f/` (inside `Canvas`)

- **`Experience.tsx`** — 3D scene root. Ambient light + `FollowLight` + `Sky`, wraps `<Player>` in `<FlightViewController minSpeed={0} maxSpeed={120} hitBodySize=[1, 0.6, 3]>`, and mounts `Ground` and `FloatingShapes`.
- **`Player.tsx`** — local-player logic. Pulls transform via `useControllerState`, registers the ref in `usePlayerStore`, subscribes to `subscribeRoomMyState` to toggle `AircraftState.DIE` / revive, throttle-syncs transform via `updateMyState`, fires bullets on `attack` input (200 ms cooldown) through `useEffectStore.addEffect` + `sendEffectEvent`. Renders `<Aircraft localPlayer>` when alive.
- **`Aircraft.tsx`** — visual-only aircraft model (body, cockpit, wings, tail, propeller, twin `Trail`s). Propeller spin rate tracks `userData.speed` for the local player.
- **`RemotePlayer.tsx`** — `forwardRef` wrapper around `NetworkObject` + `CuboidCollider` + `<Aircraft>` + nickname `Billboard`. Exposes `syncState(state, position, rotation)` via `useImperativeHandle` so `NetworkContainer` can push transforms imperatively.
- **`NetworkContainer.tsx`** — subscribes to `subscribeRoomState` (user leave cleanup) and `subscribeRoomAllUserStates`, maintains a `RemotePlayerHandle` ref map keyed by account, and drives `syncState` on every update. Skips self and non-ready players.
- **`EffectContainer.tsx`** — Zustand-driven renderer for `activeEffects`. Routes `BULLET` to `BulletEffectController` and `EXPLOSION` to `Explosion`. Listens to room `effect-event` messages, adds incoming effects locally, and on local bullet hits calls `applyDamage` + spawns an explosion.
- **`Ground.tsx`** — fixed sea plane (`RigidBody` "SEA"), visual ground, runway stripes, 500 procedurally-scattered decoration meshes.
- **`FloatingShapes.tsx`** — 150 kinematic balloons / birds / planes with oscillate / circle / drift motion profiles driven in `useFrame`.

### `src/components/r3f/effects/`

- **`Bullet.tsx`** — ray-cast projectile. Uses `useRapier`'s `world.castRay` each frame, calls `onHit(pos, rigidBody, collider)` and `onComplete` on impact or timeout.
- **`BulletEffectController.tsx`** — parses effect config, offsets the start position, renders `<Bullet>` + optional `<MuzzleFlash>`.
- **`MuzzleFlash.tsx`** — short-lived additive-blended petal / inner-glow cone group with opacity fade.
- **`Explosion.tsx`** — two groups of `instancedMesh` particles (`white`, `grey`) that drift outward and fade over 500 ms.

## `src/components/scene/`

- **`GameScene.tsx`** — in-game shell. Renders a Leave button + `RTT` + room-id banner, mounts `StatusDisplay`, then a `KeyboardControls` + `Canvas` (pointer-lock on pointerdown) containing `Physics` → `Suspense` → `Experience` + `NetworkContainer` + `EffectContainer`.
- **`RoomManager.tsx`** — create-new-room / join-by-id form shown after nickname setup.
- **`LobbyRoom.tsx`** — pre-game lobby. Lists all users via `useRoomAllUserStates`, toggles `isReady` through `server.remoteFunction('toggleReady', [])`.
- **`NicknameSetup.tsx`** — nickname entry form; surfaces loading + error state from `App`.

## `src/components/ui/` (DOM overlay)

- **`StatusDisplay.tsx`** — reads `useControllerState` for speed / altitude, `subscribeRoomState` for player count, `subscribeRoomMyState` for HP. Renders control hints.
- **`RTT.tsx`** — subscribes to `networkSyncStore.rtt` and shows ping in ms.
