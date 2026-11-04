# Requirements — basic-3d-r3f-firstpersonview

## Coding Patterns

- Function components with hooks. Per-frame work in `useFrame`, on mutable
  objects — not React state.
- Gameplay rules in pure modules under `src/game/` with `bun test` coverage.
- Every action works on keyboard and on touch.
- Rapier only behind `React.lazy` (`src/physics/`).

## Known Issues / Constraints

- Ramps are wedges rising along +x only (`rampHeight`); the foot height is
  sampled at the player's center.
- A moving platform pushes nothing: if it slides into a player who is not on
  it, the next downward step lifts the player on top.
- The rapier demo crates do not collide with the player.
- Pointer lock can be refused inside an embedded frame; mouse drag still
  turns the view then.
- `@agent8/gameserver` is installed but not wired.
