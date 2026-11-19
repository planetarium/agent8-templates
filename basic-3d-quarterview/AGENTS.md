# AGENTS.md — basic-3d-quarterview

A thin React Three Fiber game skeleton, quarterview: one verse8 character
that walks, runs and jumps on an empty stage (floor, sky, fog, sun), seen
from a fixed high-angle camera (45° down, narrow FOV for an isometric feel)
that follows it and never rotates. Keyboard and touch input. The player is
the template's own kinematic controller (`src/game/player.ts`). Obstacles go
in `src/game/world.ts` `BOXES` / `RAMPS`, terrain is a `HeightField` in
`FIELDS`, a moving platform is an AABB that records `moved` —
`PROJECT/Structure.md` "Building the stage" has an example of each.
Read this, then `PROJECT/Structure.md`, before changing code.

## Rules

- Per-frame state (player position, camera zoom) lives in plain mutable
  objects in `src/game/state.ts`, updated inside `useFrame`. Never put it in
  React state — that re-renders 60×/s.
- `src/game/player.ts` is pure TypeScript (no React, no three). Keep gameplay
  rules there and test them with `bun test` (`player.test.ts`).
- Movement is along the world axes: W / up = −z, D / right = +x. The camera
  angle is fixed in `CAMERA.quarter` (yaw 0, so world axes line up with the
  screen); there is no mouse look. If you yaw the camera, rotate the input in
  `Player.tsx` by the same angle.
- Jump feel is tuned in `PLAYER` (`config.ts`): coyote time 0.12 s, input
  buffer 0.1 s from the press, both consumed by a jump. Grounded comes from
  collision only. Step-up height is `PLAYER.stepHeight` (0.35 m), steepest
  walkable height-field slope `PLAYER.maxSlope` (60°). Keep those tests
  green if you change them.
- Level geometry comes from `src/game/world.ts` (`BOXES`, `RAMPS`,
  `FIELDS`); the same data is drawn (`Level.tsx`) and collided
  (`stepPlayer`). Build the game's own map there — the stage ships empty.
- Lay courses, goals and enemies out from the spawn toward the camera's
  front (−z, up the screen); x is the course's width. The player spawns
  facing −z.
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
- A weapon or tool in a hand: pass `hold={{ url, aim, muzzle }}` to
  `<Character>` / `<AnimatedModel>` (`PROJECT/Structure.md` "Model parts").
  How it is held (grip point, direction, real length, muzzle) comes from the
  asset's info file on its own — don't copy search-result grip values into
  `src/assets.json` or code. Only to change how this game holds it:
  `hold={{ url, override }}`. Don't parent weapons to bones yourself.
- A character holding a gun in its hand — player or enemy — fires from its
  own `muzzle` (one `newMuzzle()` per character, passed in its `hold`),
  never from its body position plus a height. Skip a shot while
  `muzzle.valid` is false. Guns not in a hand (turrets, vehicles), melee
  weapons and games without weapons are not covered.

## Commands

```bash
bun install
bun run dev        # local dev server
bun run typecheck  # tsc --noEmit
bun test           # controller tests (jump feel, step-up, ramp, platform, height field)
bun run build      # production build to dist/
```
