# Status — basic-3d-firstpersonview-multiplay

## Implemented

- Session flow: `NicknameSetup` → `RoomManager` (create/join) → `LobbyRoom` (character select + ready) → `GameScene`, driven by `App.tsx` and `@agent8/gameserver` subscriptions.
- First-person camera and movement via `vibe-starter-3d`'s `FirstPersonViewController`, with pointer-lock requested on canvas `pointerdown`.
- Local player animation state machine (IDLE, WALK, RUN, JUMP, PUNCH, HIT, DIE) driven by keyboard + action keys; DIE / revive flow synced through `subscribeRoomMyState` and `revive` remote function.
- Throttled network sync (100 ms + dirty thresholds) of position, rotation, and state via `updateMyState` remote function.
- Remote-player replication: `NetworkContainer` subscribes to all user states and spawns / removes `RemotePlayer` instances; transforms applied via `NetworkObject.syncTransform` with nickname billboards.
- Bullet system: left-click fires a ray-cast `Bullet` from the camera direction (200 ms cooldown) with `MuzzleFlash`; hits spawn an `Explosion` and report damage through `applyDamage`; peers mirror bullets via `'effect-event'` room messages.
- Lobby character preview rendered in a secondary R3F `Canvas` with `OrbitControls` and `CharacterPreview`.
- RTT ping loop (`handlePing` every 3 s, 5-sample trimmed average) surfaced via the `RTT` overlay.
- HTML crosshair overlay, leave-game button, and room-id display in `GameScene`.
- Scene lighting: ambient + `FollowLight` + sunset `Environment`.
- Flat `Floor` with a fixed `RigidBody` collider.

## Installed but not wired

- `@react-three/postprocessing` — no effect pipeline.
- `lucide-react` — dependency present but no icon usage in the source tree.
- `melee_attack`, `aim`, `shoot`, `aim_run` animations listed in `assets.json` — `CharacterState` only maps IDLE, WALK, RUN, JUMP, PUNCH, HIT, DIE.
- World geometry beyond the flat `Floor` — no walls, cover, or spawn points.
</content>
