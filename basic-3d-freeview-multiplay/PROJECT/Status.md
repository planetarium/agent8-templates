# Status — basic-3d-freeview-multiplay

## Implemented

- Third-person free-view camera (`FreeViewController`) with pointer-lock capture on canvas click
- Character animation set (idle, walk, run, jump, punch, hit, die) via `CharacterRenderer` + `AnimationConfigMap`
- Local-player input + state machine in `Player.tsx` (keyboard → `PlayerInputs` → `CharacterState`)
- Networking lifecycle in `App.tsx`: connect → nickname → room create/join → lobby → game
- Room flow: `joinRoom`, `leaveRoom`, `setCharacter`, `toggleReady` remote functions
- Character selection in `LobbyRoom` with live `CharacterPreview` (IDLE animation)
- Local-player transform sync: throttled `updateMyState` (100 ms) with position (0.01 m) / rotation (0.01 rad) dirty checks
- Remote-player rendering: `NetworkContainer` subscribes to room state and drives per-account `RemotePlayer` refs via `syncState`; nicknames shown as billboards
- RTT measurement: periodic `handlePing` in `networkSyncStore`, 5-sample trimmed average surfaced by `RTT.tsx`
- Scene lighting: ambient + `FollowLight` + sunset environment preset
- Flat `Floor` with trimesh collider

## Installed but not wired

- `@react-three/postprocessing` — no effect pipeline mounted
- `types/effect.ts` — effect message / enum types declared with no producer or consumer
- `hooks/useNetworkSync.ts` — standalone RTT hook superseded by `networkSyncStore`, no caller
- `action3`, `action4`, `magic` keyboard bindings — mapped in `controls.ts`, no handler
- `UserState.stats` (`maxHp`, `currentHp`) — present in server init and type, not read by any client code
- `melee_attack`, `aim`, `shoot`, `aim_run` animation URLs — listed in `assets.json`, not referenced by `CharacterState`
- World geometry beyond a flat `Floor`
</content>
</invoke>