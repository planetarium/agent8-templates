# Status — basic-3d-three-freeview

## Implemented

- Freeview orbit camera (drag, wheel): presets follow / shoulder / wide,
  collision with level geometry + spring-back, auto-follow yaw (tested)
- Walk / run (Shift or stick at the rim) / jump with coyote time, input
  buffer, consume-on-jump; step-up, ramp, moving platform, height field (all tested)
- verse8 base character with retargeted mixamo clips, idle/walk/run/jump/fall
- Keyboard + mouse and touch joystick + JUMP
- Empty stage: floor, sky, fog, hemisphere light, shadowed sun
- Lazy rapier demo (`?physics=1` or `PHYSICS_DEMO = true`)

## Not yet

- Sound, game rules
- Multiplayer (`@agent8/gameserver` unwired)
