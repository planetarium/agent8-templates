# Beacon Isle — Requirements

1. Quest arc: keeper dialogue (choice) → 3 wards guarded by shades → clear +
   E to relight each → report back → win banner + fireworks.
2. Shades: patrol rings AROUND their ward on the island surface; hunt the
   player within 9 m (re-path through terrain, never through sea/cliffs);
   bites drain 20 HP per 1.2 s of contact.
3. Losing: 0 HP → banner → fresh respawn; lit wards persist.
4. A dark ward with living guards refuses to light (hint line).
5. One strike fells a shade (dissolve poof); the sword rides the hand bone
   and plays the melee clip.
6. Works on phones: joystick + jump/interact/attack touch buttons from the
   input map alone.
7. `bun run verify` green: audit 0 warnings, quest E2E, hunt proof,
   death/respawn proof, bit-identical replay.
8. `bun run world` regenerates the island deterministically.
