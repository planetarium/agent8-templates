# Requirements — basic-3d-r3f-minecraft

## Coding Patterns

- Function components with hooks. Per-frame work in `useFrame`, on mutable
  objects — not React state.
- World and movement rules in pure modules under `src/game/` with
  `bun test` coverage.
- Block edits go through `Builder.tsx` (`edit`, `mineTarget`,
  `placeAtTarget`), which marks the touched chunks dirty.
- Chunk meshes are built imperatively in `Terrain.tsx` (one `Mesh` per
  chunk, one material per texture slot); keep per-frame work there bounded
  (at most 2 new chunks per frame after the first).
- Every action works with mouse / keyboard and on touch.
- Rapier only behind `React.lazy` (`src/physics/`).

## Known Issues / Constraints

- A block step (1 m) cannot be walked up — jump. Same rule as the Incanto
  basic-3d-minecraft template.
- The bottom layer (y = 0) cannot be mined; placing a block where the
  player stands is refused.
- Water is a transparent plane at y = 10.5, drawn only — no swimming.
- The crosshair ray starts at the camera; its reach is the camera-to-eye
  distance + 15 m, so it can pick a block between the camera and the player.
- Out-of-world columns are invisible walls; the world does not grow.
- The world is not saved; a reload regenerates it from the seed.
- `PhysicsDemo.tsx` (shared with the other R3F templates) has a floor
  collider at y = 0, under the terrain; rapier bodies do not collide with
  blocks until you add colliders for them.
- Block textures load from the verse8 CDN; until they arrive the blocks are
  flat colors.
- `@agent8/gameserver` is installed but not wired.
