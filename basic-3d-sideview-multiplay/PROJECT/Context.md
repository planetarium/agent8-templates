# Context — basic-3d-sideview-multiplay

## Project Overview

3D side-view platformer with multiplayer wired through `@agent8/gameserver`. Flow goes Nickname → RoomManager → LobbyRoom (character select + ready) → GameScene. Local player runs on `SideViewController` + `CharacterRenderer`; remote players render via `NetworkObject` inside `NetworkContainer`, which subscribes to per-user room state. Player transform/state is throttled to the server (100ms / 0.01m / 0.01rad dirty check); fireball/explosion effects are broadcast through a room message channel. Floor is a seed-based random platform chain driven by `roomId`.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Character framework**: `vibe-starter-3d` (`SideViewController`, `CharacterRenderer`, `NetworkObject`, `CharacterUtils`)
- **Multiplayer**: `@agent8/gameserver` (`server.js` remote functions + room state subscriptions)
- **State**: Zustand (`effectStore`, `networkSyncStore`)
- **Utils**: `lodash/throttle`
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- App flow is gated by `connected` → `nickname` → `currentRoomId` → `roomState.gameStarted && roomMyState.isReady`. `GameScene` only mounts after the ready flag flips; `LobbyRoom` handles character pick + ready toggle.
- Local player transform sync goes through `Player.tsx` → `server.remoteFunction('updatePlayerTransform', ...)`, throttled at 100ms with dirty-check thresholds (`POSITION_CHANGE_THRESHOLD` 0.01, `ROTATION_CHANGE_THRESHOLD` 0.01). Do not bypass the throttle.
- Remote players are owned by `NetworkContainer`: it keeps a `RemotePlayerHandle` ref per account and calls `syncState(state, position, rotation)` on each `subscribeRoomAllUserStates` tick. Only users with `isReady && transform` are rendered.
- Effects flow both ways: locally add via `useEffectStore.addEffect`, then `server.remoteFunction('sendEffectEvent', ...)`; incoming `onRoomMessage('effect-event', ...)` calls `addEffect` after filtering self-sender.
- `networkSyncStore.setServer(server)` must be called from `App.tsx` after `useGameServer` connects — it drives the ping/pong RTT loop used by `RTT.tsx`.
- Character model URLs come from `src/assets.json`; `characterKey` is the map key (e.g. `knight`). `LobbyRoom` writes the key via `setCharacter`, `App.tsx` reads it back through `subscribeRoomMyState` and hands it to `GameScene` → `Experience` → `Player`.
- `Floor` is deterministic per room: it seeds its RNG from `roomId`, so every client in the same room renders the same platform layout.
