# Requirements — basic-3d-flightview

## Coding Patterns

- Function components with hooks. Per-frame work in `useFrame`, on mutable
  objects — not React state.
- Flight and gameplay rules in pure modules under `src/game/` with
  `bun test` coverage.
- Many similar objects (scenery, bullets, targets) as `InstancedMesh`.
- Every action works on keyboard and on touch.
- Rapier only behind `React.lazy` (`src/physics/`).

## Known Issues / Constraints

- No physics body: the plane passes through scenery and sky shapes, and
  bullets hit nothing (there are no targets yet) — they expire after 500 ms
  or at the ground.
- W pushes the nose down and S pulls it up (a flight stick); the touch stick
  works the same way (up = nose down).
- Ctrl slows down; in a browser tab Ctrl + W closes the tab, so hold the
  arrow keys for pitch while slowing down, or rebind `SLOWER` in
  `game/input.ts`.
- Banking alone does not turn the plane: bank, then pull back (or use Q / E).
- The grass is flat (y = 0); the sea is drawn 1 m lower but the plane's
  ground stays y = 0 everywhere. Pass a `groundAt` to `stepFlight` for
  terrain.
- The camera's attitude lag (0.08 per 1/60 s) is scaled by frame time, so it
  feels the same at 30, 60 and 120 fps.
- No wingtip trails, muzzle flash or explosions.
- `@agent8/gameserver` is installed but not wired.
