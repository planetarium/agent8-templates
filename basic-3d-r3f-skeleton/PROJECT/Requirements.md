# Requirements — basic-3d-r3f-skeleton

## Coding Patterns

- Function components with hooks. Per-frame work in `useFrame`, on mutable
  objects — not React state.
- Gameplay rules in pure modules under `src/game/` with `bun test` coverage.
- One code path for both views: branch on `mode`, do not duplicate components.
- Every action works on keyboard and on touch.
- Rapier only behind `React.lazy` (`src/physics/`).

## Known Issues / Constraints

- The player is a capsule placeholder; no animation.
- Player collision is AABB-only (no slopes, no step-up).
- The rapier demo crates do not collide with the player.
- `@agent8/gameserver` is installed but not wired.
