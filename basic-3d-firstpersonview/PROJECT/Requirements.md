# Requirements — basic-3d-firstpersonview

## Coding Patterns

- Stores are concern-split (Zustand): `gameStore`, `localPlayerStore`, `multiPlayerStore`, `playerActionStore`, `effectStore` — do not cross-write.
- R3F goes under `components/r3f/`, DOM under `components/ui/`; `GameScene.tsx` stitches them and must not render 3D directly.
- Spawn visual effects through `effectStore.addEffect` and let `EffectContainer` render them; add new effect types by extending `EffectType`, the container's `switch`, and a `create*EffectConfig` util.
- Effect store payloads are plain JSON — serialize `THREE.Vector3` via `toArray()` / `toVector3Array`, not live objects.
- Extend `Player.tsx` by adding animation states / action branches, not by forking.
- No magic values — animation ids in `constants/character.ts`, rigid-body types in `constants/rigidBodyObjectType.ts`.

## Known Issues / Constraints

- `vibe-starter-3d` owns camera and movement bindings via `FirstPersonViewController` + `useInputStore`; action keys are mapped locally in `InputController.tsx`.
- `MapPhysicsReadyChecker` has a 180-frame raycast timeout — very slow map loads may expire it.
- Pointer lock is desktop-only (guarded by `IS_MOBILE`); FPV aim on mobile relies on touch look handled by the controller.
- Local `CharacterRenderer` must stay `visible={false}` — flipping it breaks the FPV illusion (camera is inside the capsule).
- `Bullet` uses a sensor `RigidBodyObject` with a short freeze window on hit; very high-speed bullets past a frame's raycast distance may miss thin geometry.
