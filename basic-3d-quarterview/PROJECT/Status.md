# Status — basic-3d-quarterview

## Implemented

- Fixed 45° quarterview follow camera (wheel zoom, no rotation)
- World-relative walk / run (Shift or stick at the rim) / jump with coyote
  time, input buffer, consume-on-jump; step-up, ramp, moving platform, height field (all
  tested)
- verse8 base character with retargeted mixamo clips, idle/walk/run/jump/fall
- Keyboard and touch joystick + JUMP
- Empty stage: floor, sky, fog, hemisphere light, shadowed sun
- Lazy rapier demo (`?physics=1` or `PHYSICS_DEMO = true`)

## Not yet

- Sound, game rules, click-to-move
- Multiplayer (`@agent8/gameserver` unwired)
