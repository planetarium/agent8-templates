# basic-3d-r3f-k

R3F freeview skeleton, **variant K**: the player is the template's own
kinematic controller (`src/game/player.ts`). Its twin `basic-3d-r3f-r` is the
same game with the player on ecctrl + rapier. Built from
`basic-3d-r3f-skeleton` for a K-vs-R comparison. Not registered in
`templates.json`.

Stack: React 19, three, @react-three/fiber 9, @react-three/drei 10,
@react-three/rapier 2 (lazy demo only, not in the first load), Vite, Tailwind.

## Run

```bash
bun install
bun run dev          # http://localhost:5173  (?touch=1, ?physics=1)
bun test             # controller tests
bun run build && bun run preview
```

## K vs R

Everything except player movement and physics is the same code in both
folders: `src/assets.json`, `src/game/world.ts` (level), `src/game/anim.ts`
(clip retargeting + animation state), `src/game/input.ts`,
`src/components/Character.tsx` (verse8 base character, idle/walk/run/jump/fall
cross-fade), `src/components/Level.tsx`, HUD and touch-control layout.

| | K (this folder) | R (`basic-3d-r3f-r`) |
| --- | --- | --- |
| Player | `stepPlayer()` in `src/game/player.ts`: velocity + axis-by-axis AABB collision, 1/120 s substeps | `<Ecctrl>` (ecctrl 2.0.2), a floating dynamic capsule |
| Steps (0.3 m) | step-up: a hit box at most `PLAYER.stepHeight` (0.35) above the feet lifts the player onto it | capsule floats `floatHeight` (0.3) above the ground and rides up |
| Ramp | `rampHeight()` sets the foot height; a tall side is a wall | convex-hull collider |
| Moving platform | AABB moved before each substep; the player stood on it is carried by its displacement | `kinematicPosition` body, ecctrl `followPlatform` |
| Jump feel | coyote 0.12 s + input buffer 0.1 s, tested | ecctrl's own jump |
| Rapier | lazy chunk, only with `?physics=1` | always loaded |
| Camera | own orbit rig (`CameraRig.tsx`) | `EcctrlCameraControls`, same start pitch/distance |
| Touch | own stick + JUMP (`MobileControls.tsx`) | ecctrl `Joystick` + `VirtualButton`, same size and place |

Where to switch: `src/components/Player.tsx` (controller), `src/App.tsx`
(physics mount), `src/components/CameraRig.tsx`, `src/components/MobileControls.tsx`.

## First load (vite build)

| chunk | size |
| --- | --- |
| `index-*.js` (first load) | 1,237.65 kB (≈330 kB gzip) |
| `PhysicsDemo-*.js` (rapier + inlined wasm) | 2,257.66 kB, fetched only with `?physics=1` |

Rapier is not in the first load: the only `AGFzbQ` (base64 wasm header) in
`dist/` is in the `PhysicsDemo` chunk.

## Controls

| | |
| --- | --- |
| Desktop | WASD / arrows move (camera-relative), Shift run, Space jump, drag to orbit, wheel to zoom |
| Touch | stick (bottom-left, push to the rim to run), JUMP (bottom-right), drag the scene to orbit |
