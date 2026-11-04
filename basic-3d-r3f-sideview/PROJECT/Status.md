# Status — basic-3d-r3f-sideview

## Implemented

- Fixed side camera on +z with look-ahead toward the facing direction
- Walk / run (Shift or stick at the rim) / jump with coyote time, input
  buffer, consume-on-jump; step-up, ramp, moving platform (all tested)
- Player locked to the z = 0 plane
- verse8 base character with retargeted mixamo clips, idle/walk/run/jump/fall
- Keyboard and touch joystick + JUMP
- Sky, fog, hemisphere light, shadowed sun, box/stairs/ramp/platform level
- Lazy rapier demo (`?physics=1` or `PHYSICS_DEMO = true`)

## Not yet

- Sound, game rules
- Multiplayer (`@agent8/gameserver` unwired)
