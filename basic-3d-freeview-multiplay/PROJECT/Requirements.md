# Requirements — basic-3d-freeview-multiplay

## Coding Patterns

- Screen routing lives in `App.tsx` as a top-level state machine — extend existing branches instead of introducing a parallel router.
- Stores are concern-split (Zustand): `networkSyncStore` for server/RTT lifecycle, `playerStore` for local rigid-body refs — do not cross-write.
- R3F goes under `components/r3f/`, DOM under `components/ui/` and `components/scene/`; `GameScene.tsx` stitches the Canvas and the HUD and must not render 3D outside the `Canvas` tree.
- Local player state goes out through `server.remoteFunction('updateMyState', …)` with the existing throttle (100 ms) and dirty-check thresholds; do not send every frame.
- Remote player transforms are applied imperatively through `RemotePlayerHandle.syncState` — do not convert them into React props.
- Animation ids must come from `CharacterState` in `constants/character.ts`; keyboard bindings from `constants/controls.ts`.
- Character / animation URLs are resolved via `src/assets.json`; new characters are added there and referenced by key.

## Known Issues / Constraints

- `hooks/useNetworkSync.ts` duplicates `networkSyncStore`'s ping logic and is not wired — pick one before building on it.
- `types/effect.ts` (`EffectType`, `EffectData`, `ActiveEffect`, `EffectEventMessage`) is declared but no effect system is implemented yet.
- `LobbyRoom.tsx` contains a fallback `Assets.characters['avatarsample_d_darkness.vrm']` that does not exist in `assets.json`; only reachable if selection logic regresses.
- No physics-ready gate exists — `GameScene` mounts as soon as `gameStarted && isReady` is true, so maps must be ready to render immediately.
- `FreeViewController` owns camera and movement; there is no local override layer for its keyboard bindings.
- Pointer lock is requested on every `Canvas` `pointerdown` with no mobile guard.
</content>
</invoke>