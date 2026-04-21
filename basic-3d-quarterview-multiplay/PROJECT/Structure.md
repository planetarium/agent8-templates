# Structure — basic-3d-quarterview-multiplay

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` owns the top-level flow state (`connected`, `nickname`, `currentRoomId`, `roomStarted`, `isReady`) and switches between `NicknameSetup`, `RoomManager`, `LobbyRoom`, and `GameScene`. It subscribes to `subscribeRoomState` / `subscribeRoomMyState` and wires the `GameServer` instance into `networkSyncStore`.

## `src/App.css`, `src/index.css`

Component styles and global base (Tailwind directives, fonts).

## `src/assets.json`

Asset manifest — character model URLs (multiple selectable characters) and animation URLs.

## `src/server.js`

Agent8 gameserver methods: `joinRoom`, `leaveRoom`, `setCharacter`, `toggleReady`, `updateMyState`, `handlePing` (RTT), `applyDamage`, `sendMessage`, `sendEffectEvent`, plus `$roomTick`.

## `src/constants/`

- **`character.ts`** — animation state ids (idle, idle_01, walk, run, fast_run, jump, punch, kick, melee attack, cast, hit, die) and `DEFAULT_HEIGHT`.
- **`controls.ts`** — `KeyboardControls` map: WASD/Arrow keys, Space (jump), Shift (sprint), Q/E/R/F (actions).
- **`rigidBodyObjectType.ts`** — rigid-body category enum (local player, enemy, monster, wall, obstacle, item, bullet, floor, plotting board).

## `src/types/`

- **`user.ts`** — `UserState` (account, nickname, isReady, character, position, rotation, state, stats{maxHp, currentHp}).
- **`index.ts`** — re-exports.

## `src/stores/` (Zustand)

- **`gameStore.ts`** — global lifecycle; holds `isMapPhysicsReady`.
- **`playerStore.ts`** — registry of local + remote rigid-body refs keyed by account (`registerPlayerRef`, `unregisterPlayerRef`, `getPlayerRef`).
- **`networkSyncStore.ts`** — `GameServer` handle plus RTT sampler. `setServer(server)` starts a 3 s `handlePing` loop, keeps last 5 RTTs, and publishes the trimmed average as `rtt`.

## `src/components/r3f/` (inside `Canvas`)

- **`Player.tsx`** — local player. Wraps `RigidBodyPlayer` + `CharacterRenderer`, reads keyboard/mouse via `useKeyboardControls` + `useMouseControls`, runs `determinePlayerState` against the full `CharacterState` set, and pushes state to the server through a throttled + dirty-checked `updateMyState` call. Subscribes to `subscribeRoomMyState` to react to server-side death and auto-calls `revive`.
- **`RemotePlayer.tsx`** — `forwardRef` component for other users. Wraps `NetworkObject` + `CapsuleCollider` + `CharacterRenderer`; exposes `syncState(state, position, rotation)` via `useImperativeHandle` for interpolation. Renders a floating nickname via `@react-three/drei` `Billboard` + `Text`.
- **`NetworkContainer.tsx`** — subscribes to `subscribeRoomState` + `subscribeRoomAllUserStates`, maintains the set of ready remote players (excluding self), creates a `RemotePlayerHandle` ref per account, and drives `ref.syncState(...)` on every update.
- **`Experience.tsx`** — 3D scene contents mounted inside `GameScene`'s `Canvas`: `ambientLight`, `FollowLight`, sunset `Environment`, local `Player`, and `Floor`.
- **`MapPhysicsReadyChecker.tsx`** — raycasts downward each frame to detect map geometry; flips `isMapPhysicsReady` on hit or after a 180-frame timeout. Ignores capsules and sensor colliders.
- **`Floor.tsx`** — flat ground plane with a fixed physics collider.
- **`CharacterPreview.tsx`** — static IDLE-only `CharacterRenderer` used by the lobby preview `Canvas`.

## `src/components/scene/`

- **`GameScene.tsx`** — in-game screen. Renders a header (Leave Game, `RTT`, Room ID) plus a `Canvas` with `KeyboardControls`, Rapier `Physics`, `MapPhysicsReadyChecker`, an extra `FollowLight`, `QuarterViewController` (gated on `isMapPhysicsReady`), `Experience`, and `NetworkContainer`. Resets `isMapPhysicsReady` on unmount.
- **`RoomManager.tsx`** — pre-room screen: "Create New Room" and "Join Existing Room" (by ID) with a back-to-nickname button.
- **`LobbyRoom.tsx`** — in-room waiting screen. Uses `useRoomAllUserStates`, lets the user pick from `Assets.characters`, calls `setCharacter` / `toggleReady`, shows participant list with ready badges, and renders a corner character preview `Canvas` (`CharacterPreview` + `OrbitControls`).
- **`NicknameSetup.tsx`** — initial nickname entry form.

## `src/components/ui/` (DOM overlay)

- **`RTT.tsx`** — reads `networkSyncStore.rtt` and renders current ping in the `GameScene` header.
</content>
</invoke>