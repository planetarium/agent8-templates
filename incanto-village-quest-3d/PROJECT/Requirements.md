# Emberwood — Requirements

## Functional

1. **Quest arc**: talk → accept (choice) → gate opens → clear 3 wolves →
   return → report → QUEST COMPLETE + play-again.
2. **Dialogue**: typewriter lines, E or click advances, choices render as
   buttons, choosing "Not yet" leaves the quest un-accepted.
3. **Gate rules**: entering the gate before accepting shows a hint line and
   does NOT change scenes.
4. **Wolves**: walk continuous patrol loops through the maze (never through
   hedges), face their travel direction, die to one sword strike in reach
   (2.6 m), each death poofs + counts down the HUD.
5. **Sword**: click/F sweeps a visible arc (Trail3D); misses are allowed.
6. **Return portal**: active any time; quest completes only when all wolves
   are down (quest.cleared).
7. **Restart**: play-again resets the quest and returns to a fresh village.
8. **Wolves fight back**: within 6 m they abandon patrol and re-path to the
   player THROUGH the maze (never through hedges); their fangs bite for 25
   every ~1.1 s of contact; the HP bar tracks it.
9. **Losing**: 0 HP → "YOU FELL" banner → automatic fresh-grove respawn
   (full HP, 3 wolves, quest progress kept).
10. **Sword**: the blade rides the right-hand bone; a strike plays the melee
   clip and the trail follows the real swing.

## Feel

- Wind ambience always present, louder + higher while sprinting.
- Sprint FEEL: per-stride foot-dust puffs + a soft camera FOV kick (no body ribbon).
- Village = warm sunset; grove = cold dusk, denser fog, moonlight.

## Verification (must stay green)

- `bun run verify` — auditScene(×2)=0 warnings, full quest E2E headless,
  record/replay bit-identical.
- `bun run typecheck`, `bun run check` (incanto-check on src/).
