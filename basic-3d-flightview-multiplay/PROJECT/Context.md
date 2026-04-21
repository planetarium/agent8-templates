# Context — basic-3d-flightview-multiplay

## Project Overview

Three.js + React Three Fiber scaffold for a multiplayer flight game. Aircraft control is driven by `FlightViewController` from `vibe-starter-3d`, and `@agent8/gameserver` is fully wired for networking — nickname setup, room lobby, ready/start flow, transform sync, bullet/explosion effect events, and RTT measurement are all connected. Remote players are rendered via `NetworkObject`-wrapped `Aircraft` clones and synchronized through server state subscriptions.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Flight framework**: `vibe-starter-3d` (`FlightViewController`, `NetworkObject`, `FollowLight`, `useControllerState`)
- **Multiplayer**: `@agent8/gameserver`
- **State**: Zustand
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- `App.tsx` drives the top-level flow: connect → `NicknameSetup` → `RoomManager` → `LobbyRoom` (ready toggle) → `GameScene`. Do not bypass this sequence when adding screens.
- Local player must stay wrapped in `<FlightViewController>` inside `Experience.tsx`; `Player.tsx` reads transforms through `useControllerState()`, not directly from refs.
- Network transform sync in `Player.tsx` is throttle-gated by `NETWORK_CONSTANTS.SYNC` (100 ms interval, position/rotation thresholds). Remote `Aircraft` rendering goes through `NetworkContainer` → `RemotePlayer` → `NetworkObject.syncTransform`.
- Effects are dual-pathed: add locally via `useEffectStore.addEffect` and broadcast via `server.remoteFunction('sendEffectEvent', ...)`. Incoming `effect-event` room messages are replayed through the same store in `EffectContainer`.
- RTT is owned by `networkSyncStore` — `App.tsx` sets the server reference, which auto-starts the ping loop; do not start it manually elsewhere.
