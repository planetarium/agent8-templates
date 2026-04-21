# Requirements — basic-3d-sideview

## Coding Patterns

- Stores are concern-split (Zustand): `gameStore`, `localPlayerStore`, `multiPlayerStore`, `playerActionStore` — do not cross-write. `playerActionStore` is a plain singleton exposed through a hook; mutate it only through `setPlayerAction` / `resetAllPlayerActions`.
- R3F goes under `components/r3f/`, DOM under `components/ui/`; `GameScene.tsx` is a layout shell and must not render 3D directly or hold mutable state.
- Extend `Player.tsx` by adding animation states to `CharacterState` and a matching entry in the `animationConfigMap`, not by forking the component.
- Movement animation states come from `useControllerStore.getCharacterMovementState()` and pass through `toCharacterState` — combat states are pushed by `playerActionStore` with `lockControls()` / `unlockControls()` bracketing each one-shot.
- Input writes go to `vibe-starter-3d`'s `useInputStore` (movement / jump) and `playerActionStore` (combat). Do not set controller state directly from UI.
- Every renderable asset (models, animations, and anything you add) must be declared in `src/assets.json` so `PreloadScene` warms it.
- No magic values — animation ids in `constants/character.ts`, rigid-body types in `constants/rigidBodyObjectType.ts`.

## Known Issues / Constraints

- Side view is enforced by the `SideViewController` parameters in `GameSceneCanvas.tsx`; changing `cameraMode`, `followCharacter`, or `camDistance` will break the intended perspective.
- Keyboard/joystick bindings are hardcoded inside `InputController.tsx` (`CONTROL_KEY_MAPPING`, `ACTION_KEY_MAPPING`); there is no shared controls file to override.
- `MapPhysicsReadyChecker` has a 180-frame raycast timeout — very slow map loads may expire it and start physics before geometry is detected.
- `Floor` generates platforms along the x-axis only; world geometry off the z=0 strip must be added separately and still be reachable by the readiness raycast.
- Mobile joystick hijacks the left 50% of the screen (`pointerEvents: auto`, `zIndex: 1000`) — do not place interactive DOM UI there.
- `PreloadScene` onError only logs; a failed asset URL does not block completion, so broken URLs will surface at runtime in `Player` / scene mount.
