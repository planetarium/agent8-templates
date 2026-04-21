# Status — basic-3d-minecraft-multiplay

## Implemented

- Connection flow: connecting spinner → nickname → room create/join → lobby (character + ready) → in-game scene, all driven by `@agent8/gameserver` hooks.
- Multiplayer server bridge: `joinRoom`, `leaveRoom`, `toggleReady`, `setCharacter`, `updatePlayerTransform`, `addCube`, `initializeCubes`, `sendEffectEvent`, `handlePing` (in `server.js`).
- Remote-player sync: per-account `RemotePlayer` refs, transform/state replication via `subscribeRoomAllUserStates`, billboarded nickname labels.
- First-person controller (`FirstPersonViewController`) with humanoid animation set (idle, walk, run, jump, punch, hit, die) and a magic cast on `KeyE`.
- Local-player network sync throttled at 100 ms with position/rotation dirty checks.
- Procedural terrain: `simplex-noise` + Alea PRNG, seeded by `verse${roomId}`, 80×80 tiles, 25 block types, optional trees, water plane, sub-surface dirt/stone.
- World reconciliation: `cubeStore` diffed against server `room.cubes` (initial full load, then per-key add/remove).
- Instanced rendering: single `InstancedMesh` with a custom `uvOffsetScale` shader over the Minecraft sprite atlas; camera-chunked activation (10³ chunks, 3-chunk radius, up to 27 active).
- Block placement: center-screen raycast (`useCubeRaycaster`) with a semi-transparent `CubePreview` and server-authoritative `addCube` round-trip.
- Tile HUD: `TileSelector` carousel + `Q`/`E` hotkeys, `Crosshair` aiming reticle.
- Lobby character preview (`CharacterPreview` inside a dedicated `Canvas`).
- Magic VFX pipeline: `FireBallEffectController` + `Explosion`, local playback via `effectStore`, remote replay via `effect-event` room messages.

## Installed but not wired

- `@react-three/postprocessing` — dependency present; `EffectContainer` renders gameplay VFX but no post-processing pass is configured.
- `useNetworkSync` hook — functional RTT sampler, not mounted. `networkSyncStore.startSync` exists but its `sendPing` is short-circuited.
- `dotenv` — declared as a dependency; Vite handles `.env` directly, so it is not used at runtime.
- Chunk colliders (`TrimeshCollider` / `CuboidCollider`) in `InstancedCubes.tsx` — code paths exist but are commented out, so cubes are not solid to the player.
- `stats` / HP fields on `UserState` — populated at join but not consumed in gameplay.
