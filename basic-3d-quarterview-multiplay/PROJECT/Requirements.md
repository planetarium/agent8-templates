# Requirements — basic-3d-quarterview-multiplay

## Coding Patterns

- Stores are concern-split (Zustand): `gameStore` (physics gate), `playerStore` (rigid-body registry), `networkSyncStore` (server handle + RTT) — do not cross-write.
- R3F goes under `components/r3f/`; DOM goes under `components/ui/`; screen-level flow components live in `components/scene/`. `GameScene.tsx` stitches DOM + `Canvas` and must not render flow screens itself.
- Extend `Player.tsx` by adding animation states and inputs; keep server calls inside the existing throttled `syncToNetwork` path.
- Route all remote-player rendering through `NetworkContainer` — do not instantiate `RemotePlayer` elsewhere.
- Use `networkSyncStore.setServer(server)` only in `App.tsx`; other components should consume the store.
- No magic values — animation ids in `constants/character.ts`, rigid-body types in `constants/rigidBodyObjectType.ts`, keyboard bindings in `constants/controls.ts`.
- Server methods (`joinRoom`, `leaveRoom`, `setCharacter`, `toggleReady`, `updateMyState`, `revive`, `handlePing`, `applyDamage`) are the only allowed entry points — extend `server.js` rather than inventing ad-hoc channels.

## Known Issues / Constraints

- `Experience.tsx` imports `FirstPersonViewController` from `vibe-starter-3d` but never uses it; the active camera is `QuarterViewController` mounted in `GameScene.tsx`.
- `MapPhysicsReadyChecker` has a 180-frame raycast timeout — very slow map loads may expire it and force-release physics early.
- Local player network sync is capped at ~10 Hz (`INTERVAL_MS: 100`) with position threshold 0.01 m and rotation threshold 0.01 rad; tightening these raises server load, loosening them causes visible lag on remote clients.
- `RemotePlayer.syncState` is driven by `subscribeRoomAllUserStates`; the capsule collider uses `KINEMATIC_KINEMATIC` active collision types, so solid collisions against remote players are not simulated.
- `LobbyRoom` falls back to `Assets.characters['avatarsample_d_darkness.vrm']` if a selected key is missing — that key is not in `assets.json`, so the fallback will crash. Always pick from the listed keys.
- Ready flow is one-way: `toggleReady` also starts the room's `gameStarted` flag the first time any user readies up; there is no separate "start game" host action.
</content>
</invoke>