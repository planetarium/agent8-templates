# Requirements — basic-3d-r3f-r

## Coding Patterns

- Function components with hooks. Per-frame work in `useFrame`, on mutable
  objects — not React state.
- Every action works on keyboard and on touch.
- Colliders for level data live in `src/physics/World.tsx`.

## Known Issues / Constraints

- No coyote time / jump buffer (ecctrl's own jump).
- Rapier and its wasm are in the first-load bundle.
- `@agent8/gameserver` is installed but not wired.
