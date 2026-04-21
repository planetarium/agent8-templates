# Status — basic-3d-sideview-multiplay

## Implemented

- End-to-end flow: nickname entry → room create/join → lobby (character select + ready) → in-game scene
- `@agent8/gameserver` integration (`server.js` remote functions) with room / per-user / room-message subscriptions
- Local character on `SideViewController` with orthographic camera; animation state machine (idle, walk, run, jump, punch, hit, die)
- Throttled transform/state sync to server (100ms, 0.01m / 0.01rad dirty check)
- Remote player rendering via `NetworkContainer` + `RemotePlayer` (`NetworkObject` + capsule collider + nickname billboard)
- Effect system: local fireball cast (E key) → server broadcast → remote mirroring; fireball collision spawns local explosion with self-hit filtering
- RTT ping/pong via `networkSyncStore` (3s interval, trimmed average) rendered by `RTT` overlay
- Seed-based random platform floor driven by `roomId` so all clients in a room see the same layout
- Lobby character preview via in-panel `CharacterPreview` `Canvas`

## Installed but not wired

- `@react-three/postprocessing` — no effect pipeline
- `useNetworkSync` hook — superseded by `networkSyncStore`
- `server.js` `sendFireballEffect` (legacy) / `applyDamage` / `sendMessage` — not called by the current client
