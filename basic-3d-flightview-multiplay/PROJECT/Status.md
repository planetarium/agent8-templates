# Status — basic-3d-flightview-multiplay

## Implemented

- End-to-end session flow: connect → nickname → room create/join → lobby ready → game scene (`App.tsx` + `NicknameSetup` + `RoomManager` + `LobbyRoom` + `GameScene`)
- Flight control via `FlightViewController` (WASD yaw/throttle, arrow keys pitch/roll) with propeller-speed-reactive visuals
- Multiplayer transform sync: throttled `updateMyState` outbound, `subscribeRoomAllUserStates` inbound, imperative `RemotePlayer.syncState`
- Remote player rendering through `NetworkObject` + nickname `Billboard` + cuboid hit collider
- Bullet + muzzle-flash + explosion effect pipeline, dual-pathed via `effectStore` and `sendEffectEvent` / `effect-event` room messages
- Shooter-side hit resolution calling `applyDamage`
- Death / revive loop driven by `AircraftState.DIE` in `subscribeRoomMyState`, with automatic `revive` call
- RTT ping loop via `networkSyncStore` (3 s interval, outlier-trimmed 5-sample average) and on-screen `RTT` badge
- HP / speed / altitude / player-count HUD (`StatusDisplay`)
- World dressing: sea plane with collider, runway, 500 scattered decoration meshes, 150 kinematic floating shapes (balloon / bird / plane)

## Installed but not wired

- `@react-three/postprocessing` — no effect pipeline is mounted
- `lucide-react` — imported nowhere
- `src/assets.json` — character / animation manifest not consumed (aircraft scene uses primitive geometry)
- `FlightViewController` mobile / touch input — desktop keyboard + pointer lock only
