# Context — basic-3d-firstpersonview-multiplay

## Project Overview

Three.js + React Three Fiber scaffold for a multiplayer first-person shooter. Networking is wired end-to-end through `@agent8/gameserver`: `App.tsx` orchestrates nickname → room → lobby → in-game flow, `NetworkContainer` subscribes to room user states and spawns `RemotePlayer` instances, and `Player` throttles its own transform and animation state up to the server. First-person camera, pointer lock, and crosshair are driven by `vibe-starter-3d`'s `FirstPersonViewController`, and bullets fired by the local player are broadcast and reconciled through `effectStore` with damage reported via a `applyDamage` remote function.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics**: `@react-three/rapier`, `@dimforge/rapier3d-compat`
- **Character framework**: `vibe-starter-3d` (`FirstPersonViewController`, `CharacterRenderer`, `NetworkObject`, `FollowLight`, `useControllerState`, `useMouseControls`)
- **Multiplayer**: `@agent8/gameserver` (`useGameServer`, `useRoomState`, `useRoomAllUserStates`, `remoteFunction`, room/state subscriptions)
- **State**: Zustand
- **Utilities**: `lodash/throttle`, `lucide-react`
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- The local `Player` renders with `visible={false}` — FPV requires the own character mesh to be hidden. Do not flip this.
- Local transform + animation state is broadcast via `server.remoteFunction('updateMyState', ...)` throttled to 100 ms (`NETWORK_CONSTANTS.SYNC.INTERVAL_MS`) with dirty-checking thresholds. Remote players receive updates through `subscribeRoomAllUserStates` and apply them via `RemotePlayer.syncState` → `NetworkObject.syncTransform`.
- Session flow is gated by two booleans from `subscribeRoomMyState`: `isReady` (set in lobby) and room-level `gameStarted` — only when both are true does `GameScene` mount.
- Bullets are spawned locally through `effectStore.addEffect` and broadcast on the `'effect-event'` room channel; hits call the `applyDamage` remote function. Self-hits are filtered by comparing `sender` against the collider's `userData.account`.
- Character model and animation URLs live in `src/assets.json`; `setCharacter` remote function persists the selection to the user state before the game starts.
</content>
</invoke>