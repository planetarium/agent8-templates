# Requirements — basic-3d-r3f-empty

## Coding Patterns

- Function components with hooks. Per-frame work in `useFrame`, on mutable
  objects — not React state.
- Game rules in pure modules under `src/game/` with `bun test` coverage.
- Every action works with mouse and with touch.
- Rapier only behind `React.lazy` (`src/physics/`).

## Known Issues / Constraints

- A click that moved the pointer more than 4 px is treated as a camera drag
  and does not move the marker.
- `@agent8/gameserver` is installed but not wired.
