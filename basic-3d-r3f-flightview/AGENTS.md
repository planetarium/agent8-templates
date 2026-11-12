# AGENTS.md — basic-3d-r3f-flightview

A React Three Fiber flight game skeleton: a kinematic airplane on a 1000 m
runway over grass and sea, a banking chase camera, tracer bullets, seeded
scenery (500 shapes on the ground, 150 drifting in the sky), a speed /
altitude HUD, keyboard and touch input. No character and no physics body:
the plane is the template's own flight step (`src/game/flight.ts`).
Read this, then `PROJECT/Structure.md`, before changing code.

## Rules

- Per-frame state (the plane, the bullets) lives in plain mutable objects in
  `src/game/state.ts`, updated inside `useFrame`. Never put it in React
  state — that re-renders 60×/s. The HUD writes the DOM directly 10×/s.
- `src/game/flight.ts` is pure TypeScript (no React, no three). Keep flight
  rules there and test them with `bun test` (`flight.test.ts`).
- Flight feel is tuned in `FLIGHT` / `GUN` / `CAMERA` (`config.ts`): top
  speed 120 m/s, throttle +20 / −80 m/s², pitch 0.5 rad/s, roll π/4 rad/s,
  yaw acceleration 0.3 rad/s², full control authority on the ground from
  20 m/s, airborne above 1 m; bullets 200 m/s for 500 ms; chase offset
  (0, 3, 15) with a 0.08 attitude slerp. Keep those tests green if you
  change them.
- The plane's nose points along local −z. Pitch and roll turn about the
  plane's own axes, yaw about world up. The ground is solid: the plane never
  goes below `groundAt(x, z) + FLIGHT.restHeight` (flat y = 0 by default).
- The plane's look is primitives in `components/Airplane.tsx` (`Model`).
  To use a model, replace `Model` with a drei `useGLTF` scene inside
  `<Suspense>` (URL in `src/assets.json`), nose toward −z — do not guess
  asset URLs.
- Scenery is instanced (`components/World.tsx`): one `InstancedMesh` per
  shape. Add many objects the same way, not as hundreds of `<mesh>`es.
- Touch controls render on touch devices before the first touch. Every new
  action needs a keyboard binding AND an on-screen button.
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

## Commands

```bash
bun install
bun run dev        # local dev server
bun run typecheck  # tsc --noEmit
bun test           # flight tests (speed, attitude, ground, gun, decor)
bun run build      # production build to dist/
```
