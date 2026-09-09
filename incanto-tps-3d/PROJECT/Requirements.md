# Requirements — tps-3d (Incanto)

## Coding Patterns

- Game STRUCTURE belongs in `src/game.scene.json` (nodes, props, input map,
  environment, the player + enemy template, waves). Add nodes there or with
  `npx incanto-editor`, NOT ad-hoc in code.
- Game LOGIC: reach for a BUILT-IN gameplay behavior first (Health, Chase,
  WaveSpawner, DamageOnContact, ScoreKeeper). This game's ONLY custom behaviors
  are `Shoot` (the click-to-fire hitscan + face-aim, which no built-in can be —
  it reads the camera angle and the mouse) and `HudUpdater` (DOM presentation).
- THIRD-PERSON camera is declarative: `CharacterController3D` `view: 'free'` +
  `camDistance`/`eyeHeight`. The controller drives the scene's `current` Camera3D
  — never also attach a FollowCamera to that camera.
- The VISIBLE character is a `ModelInstance3D` named `Skin`, sibling of the
  Controller (the controller rotates `../Skin`). It loads a GLB (`$characters/base`)
  sized by `targetHeight` and animated by mixamo `$anims/*` clips (declared in
  scene `assets`, fetched from the CDN; mixamo retargets onto the model
  automatically). `Shoot.onReady` drives the clip from `movementStateChanged`.
- Enemies are a hidden `EnemyTemplate` the `WaveSpawner` clones: `Health`
  (`freeOnDeath: true`) on the root, `Chase` (`moveParent: true`) on a child,
  `DamageOnContact` (`targetGroup: 'player'`) on an Area3D hitbox.
- Generate every node uid with the engine's `newUid()` (or let the editor assign
  them) — NEVER hand-write readable uid strings.

## Known Issues / Constraints

- Movement-facing vs aim-facing: the controller turns the soldier toward the MOVE
  direction; `Shoot.faceAim()` overrides that toward the AIM on each shot, so the
  character reads as "aim while standing, run-face while moving". A full
  strafe-aim rig (always face the camera) would be a custom controller tweak.
- Mouse look needs POINTER LOCK (click the canvas). A free cursor never spins the
  camera (deltas only accumulate while locked or a button is held).
- HUD is DOM here by CHOICE, not by necessity: `HudLayer` + `UiText`/`UiBar`
  work in 3D too and are the ones a headless check can read (incanto-hud.md),
  and this scene keeps a `HudLayer` for its banner. The crosshair,
  HUD and banner live in `index.html`; `HudUpdater` fills them (guarded for
  headless). The crosshair marks the camera aim point, not the gun barrel.
- Zero-asset: arena, soldier and enemies are primitives; SFX are procedural
  presets; the music is a bundled clip. Nothing is fetched at boot.
