# Structure — basic-3d-freeview-multiplay

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` wires `@agent8/gameserver` via `useGameServer`, drives the screen state machine (nickname → room manager → lobby → game), feeds the active server into `networkSyncStore`, and subscribes to room + room-my-state to track `gameStarted`, `isReady`, and selected character.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives, fonts).

## `src/assets.json`

Asset manifest — character model URLs (15 presets) and animation URLs (idle, walk, run, jump, punch, melee_attack, aim, shoot, aim_run, hit, die).

## `src/constants/`

- **`character.ts`** — `CharacterState` animation-state ids (IDLE, WALK, RUN, JUMP, PUNCH, HIT, DIE) and `DEFAULT_HEIGHT` (1.6).
- **`controls.ts`** — `keyboardMap` for `KeyboardControls` (WASD/arrows, Space jump, Shift run, 1–4 actions, E magic).

## `src/types/`

- **`user.ts`** — `UserState` (account, nickname, isReady, character, position, rotation, state, stats) shared with the server.
- **`player.ts`** — `PlayerInputs` (movement/action booleans) and `PlayerRef` (exposes `boundingBox`).
- **`effect.ts`** — `EffectType` enum and effect message shapes (declared, not yet used in runtime code).
- **`index.ts`** — barrel re-exports.

## `src/hooks/`

- **`useNetworkSync.ts`** — standalone RTT ping hook. Present but unused; `App.tsx` uses `networkSyncStore` instead.

## `src/stores/` (Zustand)

- **`networkSyncStore.ts`** — holds the `GameServer` reference, runs the periodic `handlePing` loop (3 s interval, 5-sample rolling average with high/low trimmed), exposes `rtt` for the HUD.
- **`playerStore.ts`** — registry of local rigid-body refs keyed by account (`registerPlayerRef` / `unregisterPlayerRef` / `getPlayerRef`).

## `src/components/r3f/` (inside `Canvas`)

- **`Experience.tsx`** — scene content: ambient light, `FollowLight`, sunset `Environment`, `Floor`, and the local `Player` wrapped in `FreeViewController` at `targetHeight = 1.6`.
- **`Player.tsx`** — local player. Reads keyboard inputs, runs a `usePlayerStates` transition function, animates via `CharacterRenderer` + `AnimationConfigMap`, and throttles `server.remoteFunction('updateMyState', …)` to 100 ms with position (0.01 m) / rotation (0.01 rad) dirty-check thresholds.
- **`RemotePlayer.tsx`** — remote player. Built on `NetworkObject` with a `CapsuleCollider`; exposes a `RemotePlayerHandle` whose `syncState` is called imperatively by `NetworkContainer` to drive position/rotation/animation. Renders a billboarded nickname label.
- **`NetworkContainer.tsx`** — subscribes to `subscribeRoomState` and `subscribeRoomAllUserStates`; maintains the map of ready remote users, owns one ref per remote account, and mounts a `RemotePlayer` per entry.
- **`CharacterPreview.tsx`** — IDLE-only preview renderer for the lobby character-selection modal.
- **`Floor.tsx`** — fixed-body trimesh ground plane (100 × 100).

## `src/components/scene/`

- **`GameScene.tsx`** — in-game layout. Renders the Leave/RoomID/RTT HUD, the R3F `Canvas` (pointer-lock on click), `KeyboardControls`, `Physics`, then `Experience` + `NetworkContainer` under `Suspense`. Also mounts `StatsGl` for debugging.
- **`NicknameSetup.tsx`** — first-screen form for entering a nickname.
- **`RoomManager.tsx`** — create-room / join-by-id UI after nickname is set.
- **`LobbyRoom.tsx`** — in-room screen: character list, `CharacterPreview` modal, ready toggle, participant list. Calls `setCharacter` and `toggleReady` remote functions.

## `src/components/ui/` (DOM overlay)

- **`RTT.tsx`** — displays rolling-average ping pulled from `networkSyncStore`.
</content>
</invoke>