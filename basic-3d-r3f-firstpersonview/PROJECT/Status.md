# Status — basic-3d-r3f-firstpersonview

## Implemented

- First-person camera at eye height; pointer-lock mouse look, drag fallback,
  touch drag to look; crosshair
- View-relative walk / run (Shift or stick at the rim) / jump with coyote
  time, input buffer, consume-on-jump; step-up, ramp, moving platform, height field (all
  tested)
- Keyboard + mouse and touch joystick + JUMP
- Empty stage: floor, sky, fog, hemisphere light, shadowed sun
- Lazy rapier demo (`?physics=1` or `PHYSICS_DEMO = true`)

## Not yet

- Arms / held item, head bob, sound, game rules
- Multiplayer (`@agent8/gameserver` unwired; `Character.tsx` is ready for
  remote players)
