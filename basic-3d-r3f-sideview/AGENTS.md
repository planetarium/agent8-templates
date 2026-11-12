# AGENTS.md — basic-3d-r3f-sideview

A thin React Three Fiber game skeleton, sideview: a side-scroller in 3D. One
verse8 character runs left / right and jumps along the z = 0 plane on an
empty stage (floor, sky, fog, sun), seen by a fixed side camera that tracks
it. Keyboard and touch input. The player is the template's own kinematic
controller (`src/game/player.ts`). Obstacles go in `src/game/world.ts`
`BOXES` / `RAMPS`, terrain is a `HeightField` in `FIELDS`, a moving platform
is an AABB that records `moved` — `PROJECT/Structure.md` "Building the
stage" has an example of each.
Read this, then `PROJECT/Structure.md`, before changing code.

## Rules

- Per-frame state (player position) lives in plain mutable objects in
  `src/game/state.ts`, updated inside `useFrame`. Never put it in React
  state — that re-renders 60×/s.
- `src/game/player.ts` is pure TypeScript (no React, no three). Keep gameplay
  rules there and test them with `bun test` (`player.test.ts`).
- The player is locked to z = 0: `Player.tsx` passes `lockZ = true` to
  `stepPlayer` and only uses the left / right input. Anything the player must
  reach (platforms, pickups, enemies) has to overlap the z = 0 line; boxes
  wholly behind it (negative z) are background scenery. Keep z > 0 empty —
  the camera looks from there.
- Jump feel is tuned in `PLAYER` (`config.ts`): coyote time 0.12 s, input
  buffer 0.1 s from the press, both consumed by a jump. Grounded comes from
  collision only. Step-up height is `PLAYER.stepHeight` (0.35 m), steepest
  walkable height-field slope `PLAYER.maxSlope` (60°). Keep those tests
  green if you change them.
- Level geometry comes from `src/game/world.ts` (`BOXES`, `RAMPS`,
  `FIELDS`); the same data is drawn (`Level.tsx`) and collided
  (`stepPlayer`). Build the game's own map there — the stage ships empty.
- Touch controls render on touch devices before the first touch. Every new
  action needs a keyboard binding AND an on-screen button.
- Rapier (`@react-three/rapier`) is installed but lazy: import it only from
  files under `src/physics/` that are reached through `React.lazy`
  (`LazyPhysics.tsx`). A static import anywhere else puts ~2 MB of wasm into
  the first load. Dynamic bodies (balls, pins, stackable crates — anything
  that should roll, tip over or be pushed): switch on the lazy rapier path in
  `src/physics/` (mount `LazyPhysics` / `PhysicsDemo`, the `?physics` chunk)
  and build those bodies there with `@react-three/rapier`. Do not hand-write
  their physics. Leave the player controller (`src/game/player.ts`) as it is.
- Register asset URLs in `src/assets.json`; load models with drei `useGLTF`
  inside `<Suspense>`.

## Commands

```bash
bun install
bun run dev        # local dev server
bun run typecheck  # tsc --noEmit
bun test           # controller tests (jump feel, step-up, ramp, platform, height field)
bun run build      # production build to dist/
```
