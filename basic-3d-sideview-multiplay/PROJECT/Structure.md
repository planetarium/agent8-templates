# Structure — basic-3d-sideview-multiplay

## `src/main.tsx`, `src/App.tsx`

Entry point and root. `App` drives the full client flow: it reads `useGameServer()`, wires `networkSyncStore.setServer`, subscribes to `subscribeRoomState` (for `gameStarted`) and `subscribeRoomMyState` (for `character` + `isReady`), and switches between `NicknameSetup` → `RoomManager` → `LobbyRoom` → `GameScene`. `joinRoom` / `leaveRoom` are invoked as `server.remoteFunction` calls.

## `src/App.css`, `src/index.css`

Component styles and global Tailwind base.

## `src/assets.json`

Asset manifest — character `.glb` URLs (keyed by character name) and animation URLs used by `CharacterRenderer`.

## `src/constants/`

- **`character.ts`** — `CharacterState` map (idle, walk, run, jump, punch, hit, die) and `DEFAULT_HEIGHT`.
- **`controls.ts`** — `keyboardMap` for `@react-three/drei` `KeyboardControls` (up/down/left/right, jump, run, action1–4, magic).

## `src/types/`

- **`user.ts`** — `UserState` (account, nickname, isReady, character, transform, state, stats).
- **`player.ts`** — `PlayerInputs` (movement/action flags) and `PlayerRef` (bounding box handle).
- **`effect.ts`** — `EffectType` enum (FIREBALL, EXPLOSION), `EffectData`, `ActiveEffect`, `EffectEventMessage`.
- **`index.ts`** — barrel export.

## `src/store/` (Zustand)

- **`networkSyncStore.ts`** — holds `GameServer` handle and drives ping/pong RTT (`handlePing` remote function, 3s interval, rolling 5-sample average with min/max trimmed).
- **`effectStore.ts`** — `activeEffects` list + `effectKeyCounter`; `addEffect(type, sender, config)` / `removeEffect(key)`.

## `src/hooks/`

- **`useNetworkSync.ts`** — standalone RTT hook (not wired in current flow; `networkSyncStore` is used instead).

## `src/components/scene/` (flow screens + 3D host)

- **`NicknameSetup.tsx`** — nickname entry form; calls `onNicknameSet`.
- **`RoomManager.tsx`** — create / join room UI; delegates to `onJoinRoom(roomId?)`.
- **`LobbyRoom.tsx`** — character list from `Assets.characters`, per-user ready list via `useRoomAllUserStates`, inline `Canvas` preview using `CharacterPreview`; calls `setCharacter` / `toggleReady` remote functions.
- **`GameScene.tsx`** — mounts R3F `Canvas` with `Physics`, hosts `Experience` + `NetworkContainer` + `EffectContainer`, and overlays the leave button, `RTT`, and room id.

## `src/components/r3f/` (inside `Canvas`)

- **`Experience.tsx`** — wraps `KeyboardControls` (from `controls.ts`), `Environment` preset, `SideViewController` (orthographic camera + follow light), the local `Player`, and `Floor`. Owns `spawnEffect` which adds locally via `useEffectStore` and broadcasts via `sendEffectEvent`. Writes `account` onto the local rigid-body's `userData` for self-hit filtering.
- **`Player.tsx`** — local character: reads `useKeyboardControls`, runs state machine via `usePlayerStates` / `usePlayerAnimations`, drives `CharacterRenderer`, and throttles `updatePlayerTransform` (100ms + position/rotation/state dirty check). Magic key (`E`) triggers `FIREBALL` spawn via `spawnEffect`.
- **`RemotePlayer.tsx`** — forwardRef exposing `RemotePlayerHandle.syncState`; renders `NetworkObject` + `CapsuleCollider` + `CharacterRenderer` + nickname `Billboard`. Collision groups set for kinematic-kinematic interaction.
- **`NetworkContainer.tsx`** — subscribes to `subscribeRoomState` (prunes leavers) and `subscribeRoomAllUserStates` (adds newcomers and calls `syncState` every update). Only renders users that are ready and have a `transform` + `character`.
- **`EffectContainer.tsx`** — reads `useActiveEffects`, renders `FireBallEffectController` / `Explosion`; subscribes to `onRoomMessage('effect-event', ...)` to mirror remote effects. Fireball self-hit is filtered by `rigidBody.userData.account`; a hit spawns a local `EXPLOSION` via `createExplosionEffectConfig`.
- **`CharacterPreview.tsx`** — IDLE-only `CharacterRenderer` used by `LobbyRoom` for the selected-character thumbnail.
- **`Floor.tsx`** — seeded random platform chain (15 blocks) driven by `roomId`; uses `RigidBody type="fixed"` + `CuboidCollider`.
- **`effects/`** — `FireBall.tsx` (kinematic sensor with additive-blend mesh + trail flicker), `FireBallEffectController.tsx` (config builder + spawn gate), `Explosion.tsx` (instanced particle burst with fade).

## `src/components/ui/` (DOM overlay)

- **`RTT.tsx`** — reads `networkSyncStore.rtt` and renders the ping badge used inside `GameScene`'s overlay.

## `server.js` (agent8 gameserver)

Remote functions: `joinRoom`, `leaveRoom`, `setCharacter`, `toggleReady`, `updatePlayerTransform`, `sendMessage`, `sendEffectEvent`, `sendFireballEffect` (legacy), `handlePing`, `applyDamage`. `toggleReady` flips `roomState.gameStarted` on first ready; `$roomTick` is a stub.
