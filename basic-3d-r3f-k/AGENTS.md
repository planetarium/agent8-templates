# AGENTS.md — basic-3d-r3f-k

A thin React Three Fiber game skeleton (variant K): one verse8 character that
walks, runs and jumps on a level with stairs, a ramp and a moving platform, a
3rd-person orbit camera, keyboard + mouse and touch input. The player is the
template's own kinematic controller; `basic-3d-r3f-r` is the same game on
ecctrl + rapier (see README "K vs R").
Read this, then `PROJECT/Structure.md`, before changing code.

## Rules

- Per-frame state (player position, camera angles) lives in plain mutable
  objects in `src/game/state.ts`, updated inside `useFrame`. Never put it in
  React state — that re-renders 60×/s.
- `src/game/player.ts` is pure TypeScript (no React, no three). Keep gameplay
  rules there and test them with `bun test` (`player.test.ts`).
- Jump feel is tuned in `PLAYER` (`config.ts`): coyote time 0.12 s, input
  buffer 0.1 s from the press, both consumed by a jump. Grounded comes from
  collision only. Step-up height is `PLAYER.stepHeight`. Keep those tests
  green if you change the step.
- Level geometry comes from `src/game/world.ts` (`BOXES`, `RAMPS`,
  `PLATFORM`); the same data is drawn and collided. It is shared with
  `basic-3d-r3f-r` — change both or the comparison breaks.
- Touch controls render on touch devices before the first touch. Every new
  action needs a keyboard binding AND an on-screen button.
- Rapier (`@react-three/rapier`) is installed but lazy: import it only from
  files under `src/physics/` that are reached through `React.lazy`
  (`LazyPhysics.tsx`). A static import anywhere else puts ~2 MB of wasm into
  the first load.
- Register asset URLs in `src/assets.json`; load models with drei `useGLTF`
  inside `<Suspense>`.

## Commands

```bash
bun install
bun run dev        # local dev server
bun run typecheck  # tsc --noEmit
bun test           # controller tests (jump feel, step-up, ramp, platform)
bun run build      # production build to dist/
```
