# Requirements — basic-3d-quarterview

## Coding Patterns

- Stores are concern-split (Zustand): `gameStore`, `localPlayerStore`, `multiPlayerStore`, `playerActionStore` — do not cross-write. `playerActionStore` is a plain object; mutate it only through `setPlayerAction` / `resetAllPlayerActions`.
- R3F goes under `components/r3f/`, DOM under `components/ui/`; `GameScene.tsx` stitches them and must not render 3D directly.
- Scene graph lives in `Experience.tsx`; controller, lighting, and physics wiring live in `GameSceneCanvas.tsx` — keep them separate.
- Extend `Player.tsx` by adding animation states and action branches (update `animationConfigMap`, `handleAnimationComplete`, and `updatePlayerState`), not by forking.
- New gameplay actions go through `playerActionStore` and `InputController` key/action maps, not ad-hoc listeners.
- No magic values — animation ids in `constants/character.ts`, rigid-body types in `constants/rigidBodyObjectType.ts`.
- Every new runtime asset must be registered in `src/assets.json` so `PreloadScene` covers it.

## Known Issues / Constraints

- `QuarterViewController` owns camera angle and follow behavior; there is no in-repo camera override.
- `MapPhysicsReadyChecker` has a 180-frame raycast timeout — very slow map loads may expire it.
- Camera does not orbit, so the nipplejs joystick occupies the left half of the screen on mobile; there is no right-side look stick.
- `usePlayerActionStore` is module-level shared state; it does not trigger React re-renders on change.
