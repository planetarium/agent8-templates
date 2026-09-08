# Emberwood — Status

## Done (2026-07-10, round 2)

- Full quest arc playable + LOSABLE: wolves hunt the player through the maze
  (findPath re-pathing), bites drain HP (repeatEvery fangs), 0 HP → YOU FELL →
  fresh grove respawn.
- Sword rides the hand bone (BoneAttachment3D) and strikes play the real
  melee-attack clip — the Trail3D arc follows the actual arm swing.
- Elder is a GLB villager (base-model, purple tint, idle clip).
- Headless verify green: audits, quest E2E, hunt/bite/respawn, replay
  bit-identical. Visual pass in a real browser (screenshots reviewed).

## Round 3 (2026-07-11)

- Grove is a real DUSK now: low warm sun, cool ambient, `environment.post`
  vignette + desaturation grade, moonlight fill, gentle bloom. Village gets a
  subtle warm grade.
- Wolves take TWO strikes: the first flinches them (knockback along the
  strike + red hurt-flash), the second fells them.
- (previous round) camera sphere-probe landed engine-side; hedges raised
  above the eye line.

## Known limitations / ideas

- A hurt/attack clip for the wolves once one lands in the animation catalog.

## Pausing

ESC pauses and shows the pause menu; OPTIONS opens the settings over it and
BACK returns to the menu that asked. All of it is `GameFlow` (`pausePanelPath`,
`screen(path)`, `back()`) wired with `connections` — there is no TypeScript for
any screen in this game.
