# Structure — basic-3d-firstpersonview-multiplay

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` owns the session state machine: it reads `useGameServer`, wires the server into `networkSyncStore`, subscribes to room state (`gameStarted`) and my-state (`isReady`, `character`), and conditionally renders `NicknameSetup` → `RoomManager` → `LobbyRoom` → `GameScene`. Room actions (`joinRoom`, `leaveRoom`) are called via `server.remoteFunction`.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives).

## `src/assets.json`

Asset manifest — character model URLs (15 entries) and animation URLs (idle, walk, run, jump, punch, melee_attack, aim, shoot, aim_run, hit, die).

## `src/constants/`

- **`character.ts`** — `CharacterState` animation ids (IDLE, WALK, RUN, JUMP, PUNCH, HIT, DIE) and `DEFAULT_HEIGHT = 1.6`.
- **`controls.ts`** — `keyboardMap` for `@react-three/drei`'s `KeyboardControls` (WASD/arrows, jump, run, action1–4).

## `src/stores/` (Zustand)

- **`networkSyncStore.ts`** — holds the `GameServer` instance and runs a 3 s ping loop via `handlePing` remote function, maintaining a 5-sample RTT history with min/max trimming.
- **`playerStore.ts`** — registry mapping account → `RigidBody` ref for both local and remote players (used by effect hit tests).
- **`effectStore.ts`** — local queue of active effects (`BULLET`, `EXPLOSION`) with incrementing keys.

## `src/types/`

- **`user.ts`** — `UserState` (account, nickname, isReady, character, position/rotation/state, stats).
- **`player.ts`** — `PlayerInputs` (derived input flags), `PlayerRef` (boundingBox accessor).
- **`effect.ts`** — `EffectType` enum, `EffectData`, `ActiveEffect`, `EffectEventMessage`.
- **`index.ts`** — barrel re-exports.

## `src/utils/`

- **`effectUtils.ts`** — builders for bullet / explosion effect configs (serializes Vector3 → arrays for network transport).

## `src/components/scene/` (flow + DOM overlays)

- **`NicknameSetup.tsx`** — nickname entry form, submits back to `App`.
- **`RoomManager.tsx`** — create / join room form; delegates to `App`'s `onJoinRoom(roomId?)`.
- **`LobbyRoom.tsx`** — subscribes via `useRoomAllUserStates`, lets the user pick a character (calls `setCharacter` remote function) and toggle ready (`toggleReady`). Renders a mini R3F `Canvas` with `CharacterPreview` + `OrbitControls` for the selected character.
- **`GameScene.tsx`** — in-game shell. Mounts `KeyboardControls`, the R3F `Canvas` (with pointer-lock on `pointerdown`), `Physics`, `Experience`, `NetworkContainer`, `EffectContainer`. Renders the HTML crosshair, a "Leave Game" button, `RTT`, and room id.

## `src/components/r3f/` (inside `Canvas`)

- **`Experience.tsx`** — ambient light + `FollowLight` + sunset `Environment`, wraps `Player` in `FirstPersonViewController` (`targetHeight = 1.6`), mounts `Floor`.
- **`Player.tsx`** — local FPV character. Reads keyboard via `useKeyboardControls`, mouse via `useMouseControls`, transform via `useControllerState`. Determines `CharacterState` each frame, throttles `updateMyState` (100 ms + dirty threshold), fires bullets on left-click with a 200 ms cooldown using the camera's world direction, and subscribes to `subscribeRoomMyState` to react to server-driven DIE / revive transitions. `CharacterRenderer` is rendered with `visible={false}`.
- **`RemotePlayer.tsx`** — other players. `forwardRef` exposing `syncState(state, position, rotation)`, which forwards to `NetworkObject.syncTransform`. Registers its rigid body in `playerStore` and stamps `userData.account` for hit attribution. Renders the nickname as a billboarded `Text`.
- **`NetworkContainer.tsx`** — subscribes to `subscribeRoomState` (removal on user leave) and `subscribeRoomAllUserStates` (add/remove by `isReady`, forward transforms through refs). Creates / destroys `RemotePlayer` refs keyed by account.
- **`CharacterPreview.tsx`** — IDLE-only `CharacterRenderer` used inside `LobbyRoom`'s preview canvas.
- **`Floor.tsx`** — 100 × 100 fixed `RigidBody` ground plane.
- **`EffectContainer.tsx`** — renders active effects from `effectStore`. Subscribes to the `'effect-event'` room channel to mirror remote bullets, calls `applyDamage` remote function on local-owned hits, and spawns a follow-up `EXPLOSION` effect at impact.

## `src/components/r3f/effects/`

- **`Bullet.tsx`** — ray-cast projectile (`world.castRay` each frame), fires `onHit` with collider + rigid body, auto-removes on duration timeout.
- **`BulletEffectController.tsx`** — parses serialized config, composes `Bullet` + `MuzzleFlash`.
- **`MuzzleFlash.tsx`** — short-lived flame-petal flash at the spawn position.
- **`Explosion.tsx`** — particle burst spawned on bullet impact.

## `src/components/ui/`

- **`RTT.tsx`** — reads `networkSyncStore.rtt` and shows current ping.
</content>
