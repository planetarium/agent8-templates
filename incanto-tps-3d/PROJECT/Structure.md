# Structure — tps-3d (Incanto)

## `index.html`

Full-window canvas + the DOM overlays a 3D scene can't host as nodes: the center
crosshair (camera aim point), the HUD (wave / HP + bar / kills / ammo), the
win-lose banner, on-screen FIRE/JUMP buttons, the loading overlay, and the
iframe-embed GAME_SIZE harness.

## `src/game.scene.json`

THE game. Header: atmosphere `environment` (sky/fog/shadows/exposure/ambient),
physics gravity, and the input map (move/jump/sprint/fire/reload). Tree:
- `Arena` — walled floor, cover blocks, pillars, a ramp, sun + fill light, a
  conifer `Grove` (Tree3D).
- `Player` (RigidBody3D, `Health`) → `Controller` (CharacterController3D
  `view: 'free'` + `Shoot`), the visible `Skin` soldier (primitive parts), and a
  `Muzzle` (SFX + flash).
- `Camera` (Camera3D, current — driven by the controller each frame).
- `Spawner` (WaveSpawner) → hidden `EnemyTemplate` (Health/Chase/DamageOnContact/
  growl + red skin).
- `Hud` (HudUpdater). Plus top-level `connections` for death/damage/all-clear.
Open it with `npx incanto-editor`.

## `src/behaviors.ts`

The only custom code. `Shoot` — hitscan rifle on the CharacterController3D: reads
its yaw/pitch for aim, raycasts the nearest enemy in the crosshair cone, applies
`Health.damage`, scores kills via ScoreKeeper, spawns a tracer + muzzle flash,
owns the ammo clip/reload, and `faceAim()`s the soldier to the shot direction.
`HudUpdater` — reads ScoreKeeper/Health/Shoot/wave each frame into the HTML HUD
and flips the banner (guarded so headless runs are a no-op).

## `src/main.tsx` and `src/App.tsx`

Boot: `createGame3D({ scene, behaviors: { Shoot, HudUpdater }, pointer: true })`,
loop the bundled music, wire the on-screen buttons, expose `window.game`.

## `verify.ts`

Headless proof (`bun run verify`) that the loop plays end to end — move, waves,
Chase closing in, the autopilot aiming + firing the hitscan to clear all waves
(WIN), and an enemy hitbox draining the player to 0 (LOSE) — via `incanto/test`'s
`runScript` at a seeded fixed timestep.

## Prefabs

`src/cover.scene.json` and `src/pillar.scene.json` are the two cover blocks and
two pillars of the arena, placed from `game.scene.json` with `instance:` and a
`position` override each — the first 3D prefabs in the repo. `App.tsx` hands
the loader every `*.scene.json` beside it through vite's `import.meta.glob`;
`verify.ts` imports the two by name (bun has no glob). Every CLI resolves a
prefab relative to the scene on its own; the harness and the game are the two
places that say so themselves.

- `Arena/Curb`, `Arena/Ledge` — a 0.3 m step the player climbs and a 0.9 m face that stops it,
  the harness's fixtures for `stepHeight`.
- `Arena/Hill`, `Arena/HillTop`, `Arena/Cliff`, `Arena/CliffTop` — a 40° slope an enemy climbs and a
  70° face it cannot, the harness's fixtures for `slopeLimitDeg`.
- `Arena/Lift` — a moving platform (`Patrol` on a `StaticBody3D`), the harness's fixture for
  `platformCarry`.
- `Player/Catch` — a `Respawn` that returns a player who got over the walls to the spawn.

