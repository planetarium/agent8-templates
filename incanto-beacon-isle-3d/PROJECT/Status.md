# Beacon Isle — Status

## Round 2 (2026-07-12)

- **The Shadeheart**: lighting the third ward summons a glowing violet
  colossus (primitive-built — a keeper.glb attempt rendered at zero scale,
  see Learnings below) that hunts the player across the island via the
  terrain nav; five strikes (recoil + eye-flare per hit) fell it in a triple
  burst; only then does the keeper's report end the quest.
- **The clock IS the quest** (paused DayNight, director-lerped `hour`):
  dusk start → each lit ward buys back light → the boss drags the isle to a
  deep-red horizon (17.8 — sun kept ABOVE the horizon; below it the
  atmosphere sky and its IBL go black) → victory brings morning.
- **Gliding**: hold JUMP while falling — capped descent; landing thumps a dust puff.
- Keeper NPC tracks the player with `BoneLookAt3D`; shoreline rocks are one
  `InstancedMesh3D` draw call.

## Round 1 (2026-07-11)

- Full quest loop, terrain-nav shade AI, bone-mounted sword, golden-hour
  grade, headless verify + replay determinism, 4-iteration visual pass.

## Learnings

- `PathFollow` writes WORLD coordinates into `node.position` — such nodes
  must be ROOT children. Parenting one under a positioned wrapper doubles
  the offset ON SCREEN while all position-based gameplay math stays
  self-consistent: invisible-boss bugs that verify green.
- keeper.glb mounts at a degenerate scale through ModelInstance3D's
  targetHeight fit (the known "explicit scale" trap) — primitives with
  emissive materials are the reliable monster path.
- Atmosphere rule: keep `elevationDeg` (or DayNight `hour`) sun-above-horizon
  in playable scenes; the sky + IBL die within ~1° below.

## Ideas next

- Boss attack telegraphs (charge-up glow, ground slam particles).
- A hurt/attack clip for shades once one lands in the catalog.

## This round's surfaces, on the island (2026-09-04)

`Pad` (StaticBody3D, `restitution 1`, `snapToGround: 0.1`) with a dead `Ball` dropped on it,
and `Walker` (CharacterBody3D + `Chase` on a child, `slopeLimitDeg 50`, `stepHeight 0.5`) on
the west slope, `loseRange 25` so it never joins the quest. `verify.ts` measures the rebound
(2.4 m of 3), the chase up the slope (8.5 m of 10, +1.75 m) and that the walker stays on the
terrain (0.97 m over `heightAt`).

## Pausing, saving, continuing

ESC pauses and shows the pause menu; SAVE writes the run into a slot and
CONTINUE reloads the isle and hands every behaviour its state back — both are
`GameFlow` handlers (`save`, `continueFrom`) wired from buttons, so there is no
save code in this game at all.

ESC pauses and shows the pause menu; OPTIONS opens the settings over it and
BACK returns to the menu that asked. All of it is `GameFlow` (`pausePanelPath`,
`screen(path)`, `back()`) wired with `connections` — there is no TypeScript for
any screen in this game.
