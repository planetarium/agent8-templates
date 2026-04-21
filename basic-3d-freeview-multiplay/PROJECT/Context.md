# Context — basic-3d-freeview-multiplay

## Project Overview

Three.js + React Three Fiber scaffold for a third-person multiplayer sandbox wired to `@agent8/gameserver`. Nickname setup, room create/join, lobby character selection, and in-game networking (state sync, RTT ping, remote player interpolation) are all implemented. The local player runs on `FreeViewController` + `CharacterRenderer` and throttles transform updates to the server; `NetworkContainer` spawns a `RemotePlayer` per ready remote user and applies incoming state to a `NetworkObject` ref.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`
- **Character framework**: `vibe-starter-3d` (`FreeViewController`, `CharacterRenderer`, `NetworkObject`, `FollowLight`)
- **Multiplayer**: `@agent8/gameserver`
- **State**: Zustand
- **Utilities**: `lodash` (throttle for network sync)
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- The app flow is a state machine in `App.tsx`: connect → `NicknameSetup` → `RoomManager` → `LobbyRoom` → `GameScene`. `GameScene` mounts only when `roomState.gameStarted` and the local user's `isReady` are both true.
- `networkSyncStore.setServer(server)` must run whenever the connection toggles; it owns the periodic `handlePing` loop and exposes `rtt` to `RTT.tsx`.
- Local player transform is sent via `server.remoteFunction('updateMyState', …)` throttled to 100 ms with position/rotation dirty checks (see `Player.tsx`). Do not bypass the throttle.
- `NetworkContainer` drives remote players imperatively: it creates a `React.RefObject<RemotePlayerHandle>` per remote account and calls `syncState(state, position, rotation)` on each `subscribeRoomAllUserStates` update — remote transforms must not be driven through React props.
- Server-side remote functions relied on by the client: `joinRoom`, `leaveRoom`, `setCharacter`, `toggleReady`, `updateMyState`, `handlePing`.
- Character model and animation URLs are loaded via the `src/assets.json` manifest.
</content>
</invoke>