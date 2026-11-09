# AGENTS.md — basic-3d-r3f-minecraft

A React Three Fiber voxel game skeleton: a seeded 80 × 80 block world
(grass, dirt, stone) in 10 × 10 chunks, the verse8 character on the
template's own kinematic controller (`src/game/player.ts`), a 3rd-person
orbit camera, and a crosshair that mines (click) and places (right-click)
blocks; keyboard + mouse and touch input. The world is
`src/game/voxel.ts` (seed, blocks, chunks, meshing, raycast, collision).
Read this, then `PROJECT/Structure.md`, before changing code.

## Rules

- Per-frame state (player, camera angles, the voxel world, the crosshair
  target) lives in plain mutable objects in `src/game/state.ts`, updated
  inside `useFrame`. Never put it in React state — that re-renders 60×/s.
  The hotbar selection is React state (it changes on a key press).
- `src/game/voxel.ts` and `src/game/player.ts` are pure TypeScript (no
  React, no three). Keep world and movement rules there and test them with
  `bun test` (`voxel.test.ts`, `player.test.ts`).
- Edit blocks only through `mineTarget()` / `placeAtTarget()` or `edit()`
  in `components/Builder.tsx`: they call `setBlock` and add the touched
  chunks (`chunksTouching`) to `builder.dirty`, so `Terrain` rebuilds only
  those meshes. Never rebuild every chunk per edit.
- Only chunks within `VOXEL.activeRadius` (3) of the player's chunk are
  meshed and drawn; fog hides the edge. Meshes hold exposed faces only.
- Collision: `Player.tsx` passes the solid blocks within 2 blocks of the
  player (`collidersNear`) to `stepPlayer` every substep; columns outside
  the world are walls. A block is 1 m, higher than `PLAYER.stepHeight`
  (0.35 m), so climbing one block needs a jump (apex ≈ 1.56 m). Keep the
  tests that check this green.
- Jump feel is tuned in `PLAYER` (`config.ts`): coyote time 0.12 s, input
  buffer 0.1 s from the press, both consumed by a jump.
- Movement is camera-relative: W walks away from the camera (`rig.yaw`).
- Camera framing is `CAMERA.preset` in `config.ts` ('wide' here; 'follow'
  or 'shoulder'); it swings behind the motion (`followYaw`) and pulls in in
  front of blocks. Rules and tests in `src/game/camera.ts`.
- Touch controls render on touch devices before the first touch. Every new
  action needs a keyboard / mouse binding AND an on-screen button.
- Rapier (`@react-three/rapier`) is installed but lazy: import it only from
  files under `src/physics/` that are reached through `React.lazy`
  (`LazyPhysics.tsx`). A static import anywhere else puts ~2 MB of wasm into
  the first load. Dynamic bodies (balls, pins, stackable crates — anything
  that should roll, tip over or be pushed): switch on the lazy rapier path in
  `src/physics/` (mount `LazyPhysics` / `PhysicsDemo`, the `?physics` chunk)
  and build those bodies there with `@react-three/rapier`. Do not hand-write
  their physics. Leave the player controller (`src/game/player.ts`) as it is.
- Register asset URLs (models, block textures) in `src/assets.json`; load
  models with drei `useGLTF` inside `<Suspense>`.

## Commands

```bash
bun install
bun run dev        # local dev server (window.game in the console: world, player, builder, chunks)
bun run typecheck  # tsc --noEmit
bun test           # voxel + controller + camera tests
bun run build      # production build to dist/
```
