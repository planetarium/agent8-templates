# Requirements — basic-3d-firstpersonview-multiplay

## Coding Patterns

- Stores are concern-split (Zustand): `networkSyncStore` (server + RTT), `playerStore` (rigid-body registry), `effectStore` (local effect queue) — do not cross-write.
- Session flow is owned by `App.tsx`; `scene/` components render one stage each (`NicknameSetup`, `RoomManager`, `LobbyRoom`, `GameScene`) and call back into `App` for transitions.
- R3F goes under `components/r3f/`, DOM under `components/scene/` and `components/ui/`; `GameScene.tsx` is the only place that mounts the `Canvas`.
- Local transform broadcasts go through the throttled `updateMyState` remote function only — keep the 100 ms interval and dirty-check thresholds (`POSITION_CHANGE_THRESHOLD`, `ROTATION_CHANGE_THRESHOLD`).
- Remote player transforms are applied through `RemotePlayer.syncState` → `NetworkObject.syncTransform`; do not drive them via React state/props per-frame.
- Effects are authored locally via `effectStore.addEffect` and mirrored across peers through the `'effect-event'` room channel; damage goes through the `applyDamage` remote function, not peer-to-peer.
- No magic values — animation ids in `constants/character.ts`, input bindings in `constants/controls.ts`, effect types in `types/effect.ts`.

## Known Issues / Constraints

- The local `Player`'s `CharacterRenderer` must stay `visible={false}`; enabling it breaks the FPV illusion.
- Pointer lock is requested on canvas `pointerdown` and is desktop-only — no mobile input path is provided.
- Remote functions used by the client (`joinRoom`, `leaveRoom`, `toggleReady`, `setCharacter`, `updateMyState`, `applyDamage`, `revive`, `handlePing`) must exist on the Agent8 game server; they are not part of this repository.
- `vibe-starter-3d`'s `FirstPersonViewController` owns camera and movement; there is no local override.
- The physics-ready raycast gate used in other templates is not present here — `Physics` runs immediately once `GameScene` mounts.
</content>
