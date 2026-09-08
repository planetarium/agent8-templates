# Status — tps-3d (Incanto)

## Implemented

- `src/game.scene.json`: third-person arena — atmosphere sky/fog/shadows, a
  48×48 walled floor with cover blocks + pillars + a ramp + a conifer `Grove`,
  sun + fill light.
  - **Player** (RigidBody3D, group `player`, `Health` max 100 / 0.6s i-frames):
    `Controller` (CharacterController3D `view: 'free'`, camDistance 4.2, eyeHeight
    1.1, maxSpeed 4.2, `Shoot` script — and the whole game-feel table: coyote
    0.12 s, jump buffer 0.15 s, `jumpCutMultiplier` 0.45 for a variable-height
    jump, `maxJumps` 2, `airControl` 0.5, `fallGravity` 3; `bun run verify`
    measures each one rather than reading it); a real GLB `Skin` whose UPPER
    BODY plays `$anims/shoot` on every shot (`animationUpper`) while the legs
    keep the controller's run/idle clip — the two-layer animation the 3D
    character skill documents and no example had composed; a real GLB `Skin` (ModelInstance3D
    `base-model.glb` + mixamo idle/walk/run/jump clips); a `Muzzle` Node3D
    (shot/kill/empty SFX + flash light).
  - **Spawner** (WaveSpawner, 3 waves of 4/6/8) cloning a hidden `EnemyTemplate`
    (CharacterBody3D, group `enemy`, `Health` 30 freeOnDeath, red capsule + glow
    eye, `Chase` moveParent AI, `DamageOnContact` hitbox, spatial growl).
  - Camera3D (current), HurtSfx, `Hud` (HudUpdater). Connections: Player.died →
    `/root.loseLife`, Player.damaged → HurtSfx, Spawner.allCleared → Hud.
- `src/behaviors.ts`: `Shoot` (18-round clip, hitscan within a ~9° crosshair cone
  to 70 m, tracer + muzzle flash, face-aim on fire, reload) and `HudUpdater`
  (HP/Kills/Wave/Ammo + health bar + SECURE/FAILED banner).
- `src/App.tsx`: preloads the GLB + animation assets with a progress bar
  (`preloadUrls(assetUrls(scene.assets))`), then `createGame3D` with
  `pointer: true`, looping music, on-screen FIRE/JUMP buttons, `window.game`.
- `index.html`: canvas + center crosshair + HUD overlay + banner + mobile buttons.

## Works (verified)

- `bun run check` — scene valid. `bun run verify` — 9/9 headless checks (move,
  waves spawn, Chase closes in, hitscan scores, all-clear WIN, contact-damage LOSE).
- **Verified by playing in the browser (Playwright)**: over-the-shoulder camera
  frames the soldier (back to camera, `skinRotationY` 180); enemies spawn + chase
  + reach the player; holding fire cleared a wave (Kills 0→4) with visible tracers;
  HP drained to 0 under a swarm → "MISSION FAILED" banner. HUD updates live.

## Not Included (on purpose)

- No held-weapon bone attachment (the model has no rifle in-hand — the shot reads
  via crosshair + tracer + muzzle flash); no dedicated shoot/reload/aim clips
  (the CDN set is idle/walk/run/jump).
- No cover/peek mechanic, no projectile-drop weapons (hitscan only). Co-op
  multiplayer lives in the sibling `examples/tps-3d-multiplay`.

## stepHeight and jumpVelocity (2026-09-04)

The controller declares `stepHeight: 0.4` and `jumpVelocity: 5`; a 0.3 m `Curb` and a
0.9 m `Ledge` sit at z −12 (away from the fight) and `verify.ts` walks the player into
both — over the one (y 0.84 → 1.14), stopped by the other — and compares the jump apex
against the same scene at `jumpVelocity 4` (1.26 u vs 0.81 u).

## slopeLimitDeg, and the chaser that flew (2026-09-04)

The enemy prefab declares `slopeLimitDeg: 50` and `stepHeight: 0.7`; a 40° `Hill` and a
70° `Cliff` (each 4 m of slab onto a plateau) sit at the far corner (x 7–22, z −20).
`verify.ts` puts one enemy at the foot of each with the player on top: it climbs the
hill and reaches (rose 2.64 m), and is stopped by the cliff (rose 0.32 m, 3.2 m short).
Composing this found `Chase` flying its body straight at an elevated target; a
`CharacterBody3D` chaser now walks (`Chase.ground`), and the contact run went from
3 hits to 11 once enemies climbed the 0.6 m Ramp by `stepHeight` rather than by the
pile behind them.

## cameraCollision and platformCarry (2026-09-04)

Both declared on the controller; the arena gained a `Lift` (StaticBody3D walked by
`Patrol`, pingpong x −18 → −10). `verify.ts` asserts: a wall behind the player closes the
camera to 0.45 m (4.2 in the open); standing still on the lift for two seconds, it travels
4 m and the rider drifts under 0.25 m. `floatHeight` was tried and taken back out — the spring sags
~0.13 m, so 0.05 rests exactly where 0.01 does (0.84); the number is in the skill.

## Catch (2026-09-04)

`Player/Catch` (a `Respawn`, auto line) puts back a player who leaves the arena: the Hill
and Cliff plateaus, the Lift and a double jump reach over the 3 m walls (24 playtests fell
3 times before it, none after). `verify.ts` drops the player over Wall1 and asserts the catch.

## Pausing

ESC pauses and shows the pause menu; OPTIONS opens the settings over it and
BACK returns to the menu that asked. All of it is `GameFlow` (`pausePanelPath`,
`screen(path)`, `back()`) wired with `connections` — there is no TypeScript for
any screen in this game.
