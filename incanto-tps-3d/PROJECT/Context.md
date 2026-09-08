# Context — tps-3d (Incanto)

## Project Overview

"Vanguard" — a 3D THIRD-PERSON shooter. The camera rides over your soldier's
shoulder (you SEE your character); the crosshair is where the hitscan rifle
fires. Move with WASD, look with the mouse (click locks the pointer), Shift to
sprint, Space to jump (tap for a short hop, hold for the full jump, press again in the air for a second), click / F to fire, R to reload, Enter to restart. Survive and clear three
escalating waves of chasing enemies to **SECURE THE AREA**; let them drain your
HP to 0 and the **MISSION FAILS**.

The entire loop is composed from `incanto/gameplay` built-ins wired in
`src/game.scene.json` — the same gameplay spine as the `fps-3d` example, but with
`CharacterController3D`'s `view: 'free'` third-person rig and a VISIBLE character.
The only custom TypeScript is `Shoot` (hitscan + face-aim) and `HudUpdater`.

## Tech Stack

_Exact versions are in `package.json`._

- **Game engine**: `incanto` + `incanto/3d` (CharacterController3D free-view rig,
  MeshInstance3D, Terrain/Tree3D, environment sky/fog/shadows, spatial audio) +
  `incanto/gameplay` (Health, Chase, WaveSpawner, DamageOnContact, ScoreKeeper).
- **Build / Lang**: Vite, TypeScript. No React — a single canvas + HTML HUD.

## Critical Memory

- READ THE SKILLS FIRST: `node_modules/incanto/skills/incanto-3d-character.md`
  (the controller + camera rigs), `incanto-building-3d-games.md`,
  `incanto-gameplay-behaviors.md`, `incanto-environment.md`, `incanto-audio.md`.
- **THIRD-PERSON = `view: 'free'`.** The controller OWNS the scene's current
  Camera3D and orbits it behind+above the player (`camDistance` 4.2, `eyeHeight`
  1.1), looking at the pivot. Do NOT add a FollowCamera — it would fight the rig.
- **The character is a real GLB model.** The `Player/Skin` is a `ModelInstance3D`
  (`base-model.glb` + mixamo idle/walk/run/jump clips, declared in scene `assets`).
  The controller mounts it at 180° and yaw-rotates it toward the MOVE direction;
  `Shoot.onReady` maps `movementStateChanged` → the matching clip, and
  `Shoot.faceAim()` snaps the model to the AIM direction on each shot so the
  soldier turns to shoot where you look. (No held-weapon bone attachment yet — the
  shot reads via the crosshair + tracer + muzzle flash.)
- Aim is the CAMERA look direction: `Shoot` reads `controller.yaw/pitch`, computes
  a forward vector, and hitscans the nearest enemy in the crosshair cone. The
  shot originates at the player + `eyeHeight` (chest).
- ONE owner of authority per concern: enemies are spawned clones — `Health` has
  `freeOnDeath: true` (scene `connections` are NOT cloned, so death cleanup must
  be node-local). Friendly fire is gated by `DamageOnContact.targetGroup`.
- The HUD + crosshair + banner are plain DOM (`index.html`); `HudUpdater` writes
  the numbers (guarded so headless runs are a no-op).
- `window.game` is exposed for console poking.
