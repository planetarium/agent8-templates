# Requirements — basic-3d-sideview-multiplay

## Coding Patterns

- Keep the flow states in `App.tsx` (`nickname` / `currentRoomId` / `roomStarted` / `isReady`); screen components stay presentational and take callbacks.
- Never write user/room state directly from the client — go through `server.remoteFunction` (`joinRoom`, `leaveRoom`, `setCharacter`, `toggleReady`, `updatePlayerTransform`, `sendEffectEvent`, `applyDamage`).
- Local player transform sync lives in `Player.tsx` only; reuse its throttle + dirty-check thresholds (`NETWORK_CONSTANTS.SYNC`) rather than spawning new sync paths.
- Remote players are driven via `RemotePlayerHandle.syncState` from `NetworkContainer`; do not mount `RemotePlayer` directly elsewhere.
- Effects are spawned through `useEffectStore.addEffect` then broadcast via `sendEffectEvent`; incoming `effect-event` messages call `addEffect` again — filter self-sender to avoid duplicates.
- Stores are concern-split: `networkSyncStore` (server handle + RTT), `effectStore` (active effects). Do not cross-write.
- R3F components under `components/r3f/`, DOM flow screens under `components/scene/`, DOM overlays under `components/ui/`. `GameScene.tsx` is the only place that mounts the `Canvas`.
- No magic values: animation ids in `constants/character.ts`, keyboard bindings in `constants/controls.ts`, effect types in `types/effect.ts`, asset URLs in `assets.json`.
- Self-hit filtering in `EffectContainer` depends on `rigidBody.userData.account`; preserve the `userData` write in `Experience.tsx` and `RemotePlayer.tsx`.

## Known Issues / Constraints

- `useNetworkSync.ts` hook ships but is not wired — RTT is driven by `networkSyncStore`. Pick one before adding new ping logic.
- `server.js` `sendEffectEvent` validates a legacy shape (`startPosition` / `direction` / `targetPosition`) that does not match the current client payload (`type` + `config`); effect broadcasts still work because validation failures are caught, but the validator needs updating if stricter checks are desired.
- `@react-three/postprocessing` is installed but no effect pipeline is mounted.
- `Floor` always generates 15 blocks starting at `x = -40`; platform count/range is not configurable.
- Pointer lock / mobile input layer is absent — controls assume desktop keyboard only.
- `LobbyRoom` selects character by `Assets.characters` key; renaming asset keys breaks saved `character` values in existing rooms.
