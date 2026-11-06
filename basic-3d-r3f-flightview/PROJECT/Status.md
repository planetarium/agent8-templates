# Status — basic-3d-r3f-flightview

## Implemented

- Kinematic flight: throttle, pitch / roll about the plane's axes, yaw rate
  about world up, ground authority below 20 m/s, ground clamp, reset (all
  tested)
- Primitive airplane (fuselage, cockpit, nose cone, propeller that spins with
  speed, wings, tail) — a swap point for a model
- Banking chase camera (offset (0, 3, 15), attitude slerp 0.08, position
  follow), wider FOV on portrait screens
- Tracer bullets: 200 m/s, 500 ms, 200 ms cooldown (tested)
- Runway with 100 stripes, grass, sea, sky shader, fog, shadowed sun that
  follows the plane
- Seeded scenery: 500 ground shapes + 150 drifting sky shapes, instanced
- HUD: speed (5-step average, km/h), altitude
- Keyboard and touch (joystick, throttle rocker ▲ / ▼, FIRE)
- Lazy rapier demo (`?physics=1` or `PHYSICS_DEMO = true`)

## Not yet

- Targets, hits, health, sound
- Multiplayer (`@agent8/gameserver` unwired)
