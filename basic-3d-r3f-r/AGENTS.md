# AGENTS.md — basic-3d-r3f-r

A thin React Three Fiber game skeleton (variant R): one verse8 character that
walks, runs and jumps on a level with stairs, a ramp and a moving platform, a
3rd-person orbit camera, keyboard + mouse and touch input. The player is an
ecctrl 2 character on an always-on rapier world; `basic-3d-r3f-k` is the same
game with a kinematic controller (see README "K vs R").
Read this, then `PROJECT/Structure.md`, before changing code.

## Rules

- Per-frame state (player position) lives in plain mutable objects in
  `src/game/state.ts`, updated inside `useFrame`. Never put it in React state
  — that re-renders 60×/s.
- The player is `<Ecctrl>` in `src/components/Player.tsx`. Input reaches it
  only through `setMovement()` every frame (ecctrl 2 does not read the
  keyboard or its touch stores by itself). Tuning is in `PLAYER` (`config.ts`).
- ecctrl 2 is split into subpaths: `ecctrl`, `ecctrl/input`,
  `ecctrl/animation`, `ecctrl/camera`. Its 1.x API (props like
  `animated`, `EcctrlJoystick`, `EcctrlAnimation`) does not exist here.
- Level geometry comes from `src/game/world.ts` (`BOXES`, `RAMPS`,
  `PLATFORM`); Level.tsx draws it and `src/physics/World.tsx` adds the
  colliders. It is shared with `basic-3d-r3f-k` — change both or the
  comparison breaks.
- Touch controls render on touch devices before the first touch. Every new
  action needs a keyboard binding AND an on-screen button.
- Keep `@dimforge/rapier3d-compat` as a direct dependency (same version as
  `@react-three/rapier` uses) and in `resolve.dedupe`: ecctrl imports it
  undeclared, and a second copy doubles the wasm in the bundle.
- Register asset URLs in `src/assets.json`; load models with drei `useGLTF`
  inside `<Suspense>`.

## Commands

```bash
bun install
bun run dev        # local dev server
bun run typecheck  # tsc --noEmit
bun run build      # production build to dist/
```
