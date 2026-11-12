# basic-3d-r3f-r

R3F freeview skeleton, **variant R**: the player is an
[ecctrl](https://github.com/pmndrs/ecctrl) 2.0.2 character on an always-on
rapier world. Its twin `basic-3d-r3f-k` is the same game with the template's
own kinematic controller. Built from `basic-3d-r3f-skeleton` for a K-vs-R
comparison. Not registered in `templates.json`.

Stack: React 19, three, @react-three/fiber 9, @react-three/drei 10,
@react-three/rapier 2, ecctrl 2, Vite, Tailwind. (leva, an optional ecctrl
peer, is not installed.)

## Run

```bash
bun install
bun run dev          # http://localhost:5173  (?touch=1)
bun run build && bun run preview
```

## K vs R

Everything except player movement and physics is the same code in both
folders: `src/assets.json`, `src/game/world.ts` (level), `src/game/anim.ts`
(clip retargeting + animation state), `src/game/input.ts`,
`src/components/Character.tsx` (verse8 base character, idle/walk/run/jump/fall
cross-fade), `src/components/Level.tsx`, HUD and touch-control layout.

| | K (`basic-3d-r3f-k`) | R (this folder) |
| --- | --- | --- |
| Player | `stepPlayer()`: velocity + axis-by-axis AABB collision | `<Ecctrl>` in `src/components/Player.tsx`, a floating dynamic capsule |
| Steps (0.3 m) | step-up up to 0.35 m | capsule floats `floatHeight` (0.3) above the ground and rides up |
| Ramp | height function | `ConvexHullCollider` (`src/physics/World.tsx`) |
| Moving platform | carried by the AABB's displacement | `kinematicPosition` body moved in `useBeforePhysicsStep`, ecctrl `followPlatform` |
| Animation state | from the player's velocity / grounded | `useEcctrlAnimationStore` (IDLE/WALK/RUN/JUMP_*) mapped to idle/walk/run/jump/fall |
| Rapier | lazy, `?physics=1` only | always loaded |
| Camera | own orbit rig | `EcctrlCameraControls` (`ecctrl/camera`) following the player, same start pitch/distance |
| Touch | own stick + JUMP | `Joystick` + `VirtualButton` from `ecctrl/input`, same size and place |

Where to switch: `src/components/Player.tsx` (controller), `src/App.tsx`
(`<Physics>` mount), `src/physics/World.tsx` (colliders),
`src/components/CameraRig.tsx`, `src/components/MobileControls.tsx`.

Tuning to match K: walk 2.5 / run 6 m/s, hold Shift to run
(`enableToggleRun={false}`), `jumpVel` 4.9 → measured apex ≈1.55 m (K: 1.56 m),
capsule + float gap = 1.6 m tall.

## First load (vite build)

| chunk | size |
| --- | --- |
| `index-*.js` (first load, rapier + wasm included) | 3,568.32 kB (≈1.2 MB gzip) |

There is no separate rapier chunk: physics is needed before the player can
stand, so it ships in the first load.

ecctrl imports `@dimforge/rapier3d-compat` without declaring it. Without the
direct dependency in `package.json` and `resolve.dedupe` in `vite.config.ts`
it resolves to the 0.12 copy that `@types/three` pulls in, and the wasm is
bundled twice (5.6 MB).

## Controls

| | |
| --- | --- |
| Desktop | WASD / arrows move (camera-relative), Shift run, Space jump, drag to orbit, wheel to zoom |
| Touch | stick (bottom-left, push to the rim to run), JUMP (bottom-right), drag the scene to orbit |
