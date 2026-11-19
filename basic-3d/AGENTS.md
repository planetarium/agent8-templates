# AGENTS.md — basic-3d

A React Three Fiber empty 3D stage: ground, sky, a shadow-casting sun, a
clickable grid and a marker cube on the origin, under an orbit camera. No
character — a starting point for 3D games that are not character games
(puzzle, board game, tower defense, idle, tycoon, simulation, sandbox).
Read this, then `PROJECT/Structure.md`, before changing code.

## Rules

- Per-frame state lives in plain mutable objects updated inside `useFrame`.
  Never put it in React state — that re-renders 60×/s. React state is fine
  for things that change on a click (like the marker cell).
- Game rules go in pure TypeScript under `src/game/` (no React, no three)
  and get `bun test` coverage, like `grid.ts` / `grid.test.ts`.
- The ground's top face is y = 0; `STAGE` in `config.ts` sets its size and
  the grid.
- Every action works with mouse and with touch (OrbitControls already does
  both; a tap is a click).
- Rapier (`@react-three/rapier`) is installed but lazy: import it only from
  files under `src/physics/` that are reached through `React.lazy`
  (`LazyPhysics.tsx`). A static import anywhere else puts ~2 MB of wasm into
  the first load. Dynamic bodies (balls, pins, stackable crates — anything
  that should roll, tip over or be pushed): switch on the lazy rapier path in
  `src/physics/` (mount `LazyPhysics` / `PhysicsDemo`, the `?physics` chunk)
  and build those bodies there with `@react-three/rapier`. Do not hand-write
  their physics.
- Register asset URLs in `src/assets.json`; load models with drei `useGLTF`
  inside `<Suspense>`.
- A weapon or tool in a hand: pass `hold={{ url, aim, muzzle }}` to
  `<AnimatedModel>` (`PROJECT/Structure.md` "Model parts").
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
bun test           # grid tests
bun run build      # production build to dist/
```
