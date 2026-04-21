# Context — basic-3d-quarterview-multiplay

## Project Overview

Three.js + React Three Fiber scaffold for a quarter-view 3D multiplayer game. A nickname + lobby flow (`NicknameSetup` → `RoomManager` → `LobbyRoom` → `GameScene`) drives users into a shared room where a local `Player` runs on `RigidBodyPlayer` and remote participants render as `RemotePlayer` via `NetworkContainer`. Camera is fixed to `QuarterViewController` with character-follow. `@agent8/gameserver` is fully wired: room join/leave, character selection, ready toggle, per-frame state sync (position/rotation/animation), HP/damage, and RTT ping. Server logic lives in `server.js`.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Character framework**: `vibe-starter-3d` (`QuarterViewController`, `RigidBodyPlayer`, `CharacterRenderer`, `NetworkObject`, `FollowLight`)
- **Multiplayer**: `@agent8/gameserver` (wired)
- **State**: Zustand
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- Local player must be built on `RigidBodyPlayer`; remote players must be built on `NetworkObject` — do not swap these.
- Physics stay paused until `gameStore.isMapPhysicsReady` is `true`. `MapPhysicsReadyChecker` releases it via a downward raycast — new map geometry must be reachable by it. `QuarterViewController` is mounted only after the gate opens.
- Server communication is centralized: `networkSyncStore.setServer(server)` is called once in `App.tsx`; do not call `remoteFunction` without going through the existing flow (`updateMyState`, `joinRoom`, `leaveRoom`, `toggleReady`, `setCharacter`, `handlePing`, `revive`, `applyDamage`).
- Local `Player` state sync is throttled (100 ms) and dirty-checked against position (0.01 m) / rotation (0.01 rad) thresholds — preserve these to avoid flooding the server.
- `RemotePlayer` transforms arrive through `ref.syncState(...)`; never bypass `NetworkContainer` and render `RemotePlayer` directly.
- Character model and animation URLs are loaded via the `src/assets.json` manifest; selected character key is stored in `UserState.character`.
</content>
</invoke>