# Requirements — basic-3d-three-freeview

## Coding Patterns

- 3D objects are created with factory functions (`createX(...)` →
  `{ object3d?, update(dt), dispose? }`) under `src/three/`, updated by the
  engine's frame loop on mutable objects — not React state.
- React only for DOM UI (HUD, menus, touch controls).
- Gameplay rules in pure modules under `src/game/` with `bun test` coverage.
- Every action works on keyboard and on touch.
- Rapier only behind the dynamic `import()` in `src/physics/lazyPhysics.ts`.
- Courses, goals and enemies stretch from the spawn toward the camera's
  front (−z); x is the course's width.

## Known Issues / Constraints

- Ramps are wedges rising along one axis (`dir`: '+x', '-x', '+z', '-z');
  the foot height is sampled at the player's center.
- The camera avoids static `BOXES`, `RAMPS` and `FIELDS`; moving platforms
  are not in its obstacle list (add their AABBs in `three/cameraRig.ts`).
- Auto-follow yaw: holding a sideways key keeps running sideways while the
  camera swings behind; release and press again to go where the camera
  now faces.
- A moving platform pushes nothing: if it slides into a player who is not on
  it, the next downward step lifts the player on top.
- Height fields: the slope check compares `heightAt` under the start and the
  end of each substep, so a sudden jump in height is a wall while walking but
  can be landed on from above. Ramps and boxes are not checked for slope.
- The rapier demo crates do not collide with the player.
- `@agent8/gameserver` is installed but not wired.
