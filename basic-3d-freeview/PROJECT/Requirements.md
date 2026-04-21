# Requirements — basic-3d-freeview

## Coding Patterns

- Stores are concern-split (Zustand): `gameStore`, `localPlayerStore`, `multiPlayerStore`, `playerActionStore` — do not cross-write.
- R3F goes under `components/r3f/`, DOM under `components/ui/`; `GameScene.tsx` stitches them and must not render 3D directly.
- Extend `Player.tsx` by adding animation states, not by forking.
- No magic values — animation ids in `constants/character.ts`, rigid-body types in `constants/rigidBodyObjectType.ts`.

## Known Issues / Constraints

- `vibe-starter-3d` owns keyboard bindings; there is no local `controls.ts` override.
- `MapPhysicsReadyChecker` has a 180-frame raycast timeout — very slow map loads may expire it.
- Pointer lock is desktop-only (guarded by `IS_MOBILE`).
