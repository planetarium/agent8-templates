# Status — basic-3d-r3f-firstpersonview

## Implemented

- First-person camera at eye height; pointer-lock mouse look, drag fallback,
  touch drag to look; crosshair
- View-relative walk / run (Shift or stick at the rim) / jump with coyote
  time, input buffer, consume-on-jump; step-up, ramp, moving platform (all
  tested)
- Keyboard + mouse and touch joystick + JUMP
- Sky, fog, hemisphere light, shadowed sun, box/stairs/ramp/platform level
- Lazy rapier demo (`?physics=1` or `PHYSICS_DEMO = true`)

## Not yet

- Arms / held item, head bob, sound, game rules
- Multiplayer (`@agent8/gameserver` unwired; `Character.tsx` is ready for
  remote players)
