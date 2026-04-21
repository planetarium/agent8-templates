# Requirements — basic-3d-flightview-multiplay

## Coding Patterns

- Top-level screen routing lives only in `App.tsx`. New screens extend the `renderContent()` switch and must not call `server.remoteFunction('joinRoom' | 'leaveRoom', ...)` from elsewhere.
- Local-player transform comes from `useControllerState()` (never read a ref directly). Outgoing state goes through the `throttledSyncToNetworkTransform` in `Player.tsx` — extend that path, do not open a second sync channel.
- Remote players are imperatively updated via `RemotePlayerHandle.syncState` in `NetworkContainer`. Do not move to prop-driven transforms on `RemotePlayer`.
- Effects follow the dual-path rule: `useEffectStore.addEffect(...)` locally + `server.remoteFunction('sendEffectEvent', [type, config])` outbound. Inbound `effect-event` messages replay into the same store in `EffectContainer`.
- Effect configs must be wire-safe — serialize vectors with `createBulletEffectConfig` / `createExplosionEffectConfig` in `utils/effectUtils.ts`.
- Stores are concern-split: `playerStore` (RigidBody refs), `effectStore` (effect queue), `networkSyncStore` (server + RTT). Do not cross-write.
- No magic values: aircraft states in `constants/aircraft.ts`, key bindings in `constants/controls.ts`, effect types in `types/effect.ts`.
- R3F components live under `components/r3f/`, scene/screen components under `components/scene/`, DOM overlays under `components/ui/`. `GameScene.tsx` is the only place that mixes DOM and `Canvas`.

## Known Issues / Constraints

- Server contract is implicit. The client calls remote functions `joinRoom`, `leaveRoom`, `toggleReady`, `updateMyState`, `sendEffectEvent`, `applyDamage`, `revive`, `handlePing`, and expects `UserState` shape with `stats.maxHp` / `stats.currentHp` — the server implementation must honor these.
- `subscribeRoomAllUserStates` only renders remote players that are both `isReady` and have a `position`; players without a position are silently skipped.
- Bullet hit resolution runs on the shooter's client only (`sender === account` gate in `EffectContainer`) — damage is authoritative-by-shooter, not server-validated.
- `FlightViewController` is configured with `minSpeed=0, maxSpeed=120, hitBodySize=[1, 0.6, 3]` in `Experience.tsx`; changing `HIT_BODY_SIZE` in `constants/aircraft.ts` does not propagate automatically.
- `Ground.tsx` has only the "SEA" plane as a physics body; the visible green ground is a non-collidable mesh, so aircraft can pass through it.
- Pointer lock is requested unconditionally on pointerdown in `GameScene` — no mobile / touch guard.
