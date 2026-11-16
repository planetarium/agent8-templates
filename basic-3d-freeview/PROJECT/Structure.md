# Structure — basic-3d-freeview

## `src/config.ts`

`PHYSICS_DEMO`, the tuning table `PLAYER` (speeds, gravity, jump,
coyote/buffer, `stepHeight`, `maxSlope`) and `CAMERA`: `preset` (see
"Camera presets by genre"), `free` (that preset's distance, pitch, eye
height, shoulder offset, FOV) and `followYaw`.

## `src/App.tsx`

`<Canvas>` with `Level`, `Player`, `CameraRig` (and `LazyPhysics` when
enabled), a hint label, and `MobileControls`. Binds the keyboard.

## `src/game/`

- `input.ts` — keyboard set, joystick axes, `jumpPressedAt`; `moveAxis()`, `wantsRun()`.
- `player.ts` — pure `stepPlayer()`: acceleration, jump (coyote + buffer),
  gravity, axis-by-axis AABB collision with step-up, ramps, height fields
  (slope limit), riding moving boxes, respawn below `killY`.
- `player.test.ts` — `bun test` for ground, coyote, buffer, consume, step-up,
  ramp (every direction), platform (along x and z) and height field, on a
  test course defined in the file.
- `world.ts` — the stage: `BOXES` (just the floor), `RAMPS` and `FIELDS`
  (empty), plus the helpers `boxAabb`, `rampHeight`, `rampVertices`,
  `fieldHeight`, `platformCenter`, `updatePlatformAabb`.
- `cameraPresets.ts` — `CAMERA_PRESETS` / `CameraPreset` as plain data with
  no imports; `config.ts` imports only this, never `camera.ts` or `world.ts`.
- `camera.ts` — pure camera rules (re-exports `CAMERA_PRESETS`): `cameraReach()`
  (how far the camera can sit before boxes, ramps or height fields block
  it, 0.3 m clear), `springDistance()` (pull in at once, ease out),
  `followYawStep()` (swing behind the motion), `latchMoveYaw()` (keep the
  movement basis while the camera swings).
- `camera.test.ts` — `bun test` for presets, collision, spring, follow yaw
  and the latch.
- `imports.test.ts` — `bun test` that `config.ts` stays a leaf (loads no game
  module or package), so a `world.ts` that imports `config` and reads
  `PLAYER` at load works.
- `anim.ts` — shared animation state and `retarget()` for mixamo clip GLBs.
- `state.ts` — the shared `player` and camera `rig` (yaw, pitch, wanted
  distance, current reach, last drag time, movement latch).

## `src/components/`

- `Player.tsx` — camera-relative input → `stepPlayer` in 1/120 s substeps
  against `BOXES`, `RAMPS` and `FIELDS`, sets the animation state, draws
  `Character`.
- `Character.tsx` — verse8 base character (a placeholder capsule until the
  GLB loads), clip cross-fade.
- `CameraRig.tsx` — 3rd-person orbit around the player (drag + wheel);
  auto-follow yaw when not dragged for 2 s; pulled in in front of level
  geometry, eased back out.
- `Level.tsx` — sky, fog, lights, and a mesh for every box, ramp and height
  field in `world.ts` (each list may be empty).
- `MobileControls.tsx` — joystick + JUMP, shown on touch devices up front.

## `src/physics/`

Rapier (`@react-three/rapier`) is installed but lazy: import it only from
files under `src/physics/` that are reached through `React.lazy`
(`LazyPhysics.tsx`). A static import anywhere else puts ~2 MB of wasm into the
first load. Dynamic bodies (balls, pins, stackable crates — anything that
should roll, tip over or be pushed): switch on the lazy rapier path in
`src/physics/` (mount `LazyPhysics` / `PhysicsDemo`, the `?physics` chunk) and
build those bodies there with `@react-three/rapier`. Do not hand-write their
physics. Leave the player controller (`src/game/player.ts`) as it is.

- `LazyPhysics.tsx` — `React.lazy(() => import('./PhysicsDemo'))`.
- `PhysicsDemo.tsx` — `<Physics>` with a floor collider and falling crates.

## Camera presets by genre

Switch with one line in `config.ts`: `const PRESET: CameraPreset = 'shoulder';`.
The numbers live in `CAMERA_PRESETS` (`game/cameraPresets.ts`); `CAMERA.free` is a
copy you can tweak per game.

| preset | for | distance (min–max) | pitch | eye height | shoulder | FOV landscape / portrait |
| --- | --- | --- | --- | --- | --- | --- |
| `follow` (default) | platformer, adventure, action, most games | 4.5 m (2.5–10) | 0.18 rad ≈ 10° | 1.3 m | 0 | 65° / 75° |
| `shoulder` | third-person shooter, aiming | 3 m (1.8–6) | 0.1 rad | 1.45 m | 0.6 m right | 60° / 70° |
| `wide` | exploration, building, sandbox | 7 m (3–16) | 0.3 rad ≈ 17° | 1.3 m | 0 | 65° / 75° |

All presets: the camera is cast from the head toward its spot against
`BOXES`, `RAMPS` and `FIELDS` (0.3 m clear); when something is in the way it
pulls in at once and eases back out when it clears. `CAMERA.followYaw`
(on by default) swings the camera behind the direction of motion with a
≈ 0.6 s time constant while the player is not dragging, and waits 2 s after
a drag. A held direction keeps running the same way while the camera
swings (`latchMoveYaw`); a new direction is read from the new camera angle.
Turn it off (`followYaw: false`) for a camera that only moves when dragged.

`shoulder` puts the character left of center; aim with a crosshair in the
screen center (in `App.tsx`, next to the hint label):

```tsx
{/* crosshair: what the camera looks at, past the shoulder */}
<div className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
  <div className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 bg-white/90" />
  <div className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-white/90" />
</div>
```

Shots go from the camera through the center of the screen (three
`Raycaster.setFromCamera({ x: 0, y: 0 }, camera)`).

## Building the stage

The stage starts empty: one floor box (top at y = 0), sky, fog and a sun.
Obstacles go in `world.ts` `BOXES` / `RAMPS`, terrain in `FIELDS`
(`HeightField`), moving platforms are AABBs that record `moved`. `Level.tsx`
draws what is in `world.ts` and the player collides with the same data.

**Course axis:** the player spawns facing −z with the camera behind it on
+z. Lay courses, goals and enemies out from the spawn toward −z (z goes
0 → −3 → −6 …); x is the course's width. A course along x runs across the
screen like a side-scroller.

Controller numbers (`PLAYER` in `config.ts`): radius 0.35 m, height 1.6 m;
`stepHeight` 0.35 m — a ledge this high or lower is walked onto, higher
blocks; `maxSlope` 60° — a steeper height-field slope is a wall; jump apex
≈ 1.56 m (`jumpVelocity` 9, `gravity` 26), so a 1.5 m box is about the
highest a jump reaches.

### Stairs and a ledge (`BOXES`)

```ts
export const BOXES: Box[] = [
  { pos: [0, -0.5, 0], size: [80, 1, 80], color: '#7fb069' }, // floor, top y = 0
  // the course heads away from the camera (−z); 3 m wide along x
  // three 0.3 m steps (each rise ≤ stepHeight 0.35: no jump needed)
  { pos: [0, 0.15, -3], size: [3, 0.3, 1], color: '#d9c5a0' },
  { pos: [0, 0.3, -4], size: [3, 0.6, 1], color: '#c9b48c' },
  { pos: [0, 0.45, -5], size: [3, 0.9, 1], color: '#b9a378' },
  // 0.9 → 1.5 is a 0.6 m ledge: needs a jump
  { pos: [0, 0.75, -6.5], size: [3, 1.5, 2], color: '#ca3c25' },
];
```

### Ramp (`RAMPS`)

```ts
// A wedge on the floor rising along −z (away from the camera): y = 0 at
// maxZ, `height` at minZ. `dir` is '+x' | '-x' | '+z' | '-z' (default '+x').
// 1.5 m over 6 m ≈ 14°. Walk on from the low end; its tall end and the sides
// where the surface is more than stepHeight (0.35) above the feet are walls.
export const RAMPS: Ramp[] = [
  { minX: -1.5, maxX: 1.5, minZ: -16, maxZ: -10, height: 1.5, dir: '-z', color: '#e6aa68' },
];
// a landing box at the top: { pos: [0, 0.75, -17], size: [3, 1.5, 2], color: '#4f6d7a' }
```

### Moving platform (in `Player.tsx`)

```tsx
import { updatePlatformAabb, type Aabb, type Platform } from '../game/world';

// A ferry down the course: center z slides between minZ and maxZ at x = 0.
// (Across the course instead: { size, top, z: -23, minX: -3, maxX: 3, speed }.)
const LIFT: Platform = { size: [3, 0.3, 3], top: 1.5, x: 0, minZ: -26, maxZ: -20, speed: 2 };
const lift: Aabb = { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
updatePlatformAabb(lift, LIFT, 0);
const COLLIDERS: Aabb[] = [...BOXES.map(boxAabb), lift];

// inside useFrame, before each stepPlayer substep (clock = useRef(0)):
clock.current += dt / steps;
updatePlatformAabb(lift, LIFT, clock.current); // sets lift.moved: a rider is carried
// draw: a <mesh> with <boxGeometry args={LIFT.size} /> moved to the lift's center in useFrame
```

Any other motion works the same way: write the box's `min*` / `max*` and its
displacement since the last substep into `moved` before each `stepPlayer`.

### Terrain (`FIELDS`, `HeightField`)

```ts
// A 3 m hill (slopes up to ≈ 24°) inside a 40 × 40 m square.
export const FIELDS: HeightField[] = [
  {
    minX: -20, maxX: 20, minZ: -20, maxZ: 20,
    heightAt: (x, z) => 3 * Math.exp(-(x * x + z * z) / 32),
    color: '#6f9e5a',
  },
];
// Player.tsx already passes FIELDS: stepPlayer(..., COLLIDERS, lockZ, RAMPS, FIELDS)
```

`Level.tsx` draws each field as a plane displaced by `heightAt` (0.5 m grid).
The player's feet follow `heightAt`; slopes up to `maxSlope` (60°) are
walkable, steeper ones and faces more than `stepHeight` above the feet are
walls. Keep heights ≥ 0 so the floor box does not show through (or remove the
floor), and keep `heightAt` cheap — it runs several times per 1/120 s substep.
For noise terrain, call the noise function (e.g. simplex-noise
`createNoise2D`) inside `heightAt`.

## Model parts (putting models in)

Shared by every R3F template (`npm run 3d:sync` keeps them identical) and
imported by no scene yet — import them when the game needs a model; don't
rewrite them. Library models come at any scale (a mixamo rig is often a
0.01 Armature); these measure the bounding box after `updateMatrixWorld`,
scale to metres and stand the lowest point on y = 0. Model URLs go in
`src/assets.json` `models`.

| path | for | required |
| --- | --- | --- |
| `src/game/fitModel.ts` | `fitModel(object, { height })` → `{ unit, lift }`: draw with `scale={unit}`, `position-y={lift}` | `object`, `height` (m) |
| `src/components/models/Props.tsx` | `<Props>`: a static model (crate, barrel, rock, house) at every `Placement` (`{ x, y, z, rotY, scale }`), instanced past 30 copies | `url`, `height` (m), `at` |
| `src/components/models/AnimatedModel.tsx` | `<AnimatedModel>`: a rigged enemy / NPC, feet at its origin, facing +z; plays its own named clips, a mixamorig rig without them borrows idle / walk / run (`assets.json` `animations`, `game/anim.ts` `retarget`); `source={{ state }}` picks the clip; each clip it can play stands on its own lowest skinned point (`game/groundClips.ts`, sampled once per model URL), the lift easing over the cross-fade | `url`, `height` (m) |
| `src/game/groundClips.ts` | `clipGroundOffsets(root, clips)` → per clip, the offset that puts the lowest skinned point of 9 samples on y = 0 (model units; `AnimatedModel` multiplies by `unit`) | `root`, `clips` |

## Extension points

- New obstacle / stairs / ramp / terrain / moving platform: see "Building the
  stage" above.
- New action: key in `input.ts` + button in `MobileControls.tsx`.
- New dynamic bodies: in `PhysicsDemo.tsx` (or another file under
  `src/physics/` reached through `LazyPhysics`), mounted by default by setting
  `PHYSICS_DEMO = true`.
