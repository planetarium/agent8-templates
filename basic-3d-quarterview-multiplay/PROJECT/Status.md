# Status — basic-3d-quarterview-multiplay

## Implemented

- Connection + lobby flow: `NicknameSetup` → `RoomManager` (create/join) → `LobbyRoom` (character pick + ready) → `GameScene`
- Agent8 gameserver integration (`@agent8/gameserver`): `joinRoom`, `leaveRoom`, `setCharacter`, `toggleReady`, `updateMyState`, `revive`, `applyDamage`, `handlePing`
- Local player on `RigidBodyPlayer` with full humanoid animation set (idle, idle_01, walk, run, fast_run, jump, punch, punch_01, kick, kick_01, kick_02, melee attack, cast, hit, die) and dirty-checked, throttled state sync (~10 Hz)
- Server-authoritative death / revive: local player subscribes to its own server state, triggers `DIE`, and auto-calls `revive`
- Remote players via `NetworkContainer` + `RemotePlayer` (`NetworkObject` + `CapsuleCollider` + `CharacterRenderer`) with imperative `syncState` and floating nickname billboard
- Quarter-view camera following the local character (`QuarterViewController`, gated on physics ready)
- Physics-ready bootstrap (`MapPhysicsReadyChecker`) and keyboard input (`KeyboardControls` with WASD/Arrows, Space, Shift, Q/E/R/F)
- Network telemetry: RTT sampler + trimmed average in `networkSyncStore`, rendered by the `RTT` UI component in the game header
- Character selection UI with live 3D preview (`CharacterPreview` + `OrbitControls`) inside `LobbyRoom`
- Scene lighting: ambient + `FollowLight` + sunset environment preset; flat `Floor`

## Installed but not wired

- `@react-three/postprocessing` — no effect pipeline
- `lucide-react` — no icons used
- `sendMessage` / chat broadcast in `server.js` — no chat UI
- `sendEffectEvent` / `sendFireballEffect` in `server.js` — no effect system on the client
- `applyDamage` server method — no combat hit-detection code calls it
- `stats.maxHp` / `stats.currentHp` — tracked server-side, no HUD
- World geometry — only a flat `Floor`
</content>
</invoke>