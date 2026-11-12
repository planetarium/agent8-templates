# AGENTS.md — basic-3d-r3f-skeleton

A thin React Three Fiber game skeleton: one player that runs and jumps, a
camera that is either a 3rd-person orbit (**freeview**) or a side-scroller
(**sideview**), keyboard + mouse and touch input, lights and a box level.
Read this, then `PROJECT/Structure.md`, before changing code.

## View mode

`src/config.ts` → `export const VIEW_MODE: ViewMode = 'freeview';`
Set it to `'sideview'` for a side-scroller. This one line is the whole
difference between the two games; do not fork components per view — branch
on the `mode` prop inside `CameraRig`, `Player` and `MobileControls`.
(`?mode=sideview` in the URL overrides it for quick checks.)

## Rules

- Per-frame state (player position, camera angles) lives in plain mutable
  objects in `src/game/state.ts`, updated inside `useFrame`. Never put it in
  React state — that re-renders 60×/s.
- `src/game/player.ts` is pure TypeScript (no React, no three). Keep gameplay
  rules there and test them with `bun test` (`player.test.ts`).
- Jump feel is tuned in `PLAYER` (`config.ts`): coyote time 0.12 s, input
  buffer 0.1 s from the press, both consumed by a jump. Grounded comes from
  collision only. Keep those tests green if you change the step.
- Level boxes come from `BOXES` in `src/game/world.ts`; the same list is drawn
  and collided, so a new box is both visible and standable.
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
bun test           # jump-feel tests
bun run build      # production build to dist/
```
