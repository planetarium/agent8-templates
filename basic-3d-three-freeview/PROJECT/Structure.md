# Structure — basic-3d-three-freeview

Plain three.js for the 3D side (`src/three/`, imperative, no
@react-three/*); React only for the HUD (`src/App.tsx`, `src/ui/`).
`src/game/` is framework-free TypeScript, identical to the R3F templates.

## `src/config.ts`

`PHYSICS_DEMO`, the tuning table `PLAYER` (speeds, gravity, jump,
coyote/buffer, `stepHeight`, `maxSlope`) and `CAMERA`: `preset` (see
"Camera presets by genre"), `free` (that preset's distance, pitch, eye
height, shoulder offset, FOV) and `followYaw`.

## `src/App.tsx`

A full-screen `<div>` that `createGame()` (`three/engine.ts`) mounts the
canvas into (and disposes on unmount), a hint label, and `MobileControls`.
Binds the keyboard. Passes `physics` (`PHYSICS_DEMO` or `?physics=1`).

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
- `camera.ts` — pure camera rules: `CAMERA_PRESETS`, `cameraReach()`
  (how far the camera can sit before boxes, ramps or height fields block
  it, 0.3 m clear), `springDistance()` (pull in at once, ease out),
  `followYawStep()` (swing behind the motion), `latchMoveYaw()` (keep the
  movement basis while the camera swings).
- `camera.test.ts` — `bun test` for presets, collision, spring, follow yaw
  and the latch.
- `anim.ts` — shared animation state and `retarget()` for mixamo clip GLBs.
- `state.ts` — the shared `player` and camera `rig` (yaw, pitch, wanted
  distance, current reach, last drag time, movement latch).

## `src/three/`

- `engine.ts` — `createGame(container, { physics })` → cleanup. WebGL
  renderer (antialias, ACES tone mapping, PCF shadows, devicePixelRatio
  capped at 2, sized to the container by a `ResizeObserver`), scene, camera
  (near 0.1, far 500), and the one frame loop: every `System`
  (`{ update(dt) }`) in `systems` runs in order — camera rig, level,
  player (+ physics when loaded) — then the frame is drawn. A new per-frame
  thing (enemy, pickup, moving platform mesh) is one more system there.
- `player.ts` — `createPlayerObject(scene)`: camera-relative input →
  `stepPlayer` in 1/120 s substeps against `BOXES`, `RAMPS` and `FIELDS`,
  sets the animation state, moves and turns the character.
- `character.ts` — `createCharacter()`: verse8 base character (a
  placeholder capsule until the GLB loads), mixamo clips retargeted, clip
  cross-fade (`AnimationMixer`).
- `cameraRig.ts` — `createCameraRig(camera, canvas)`: 3rd-person orbit
  around the player (drag + wheel); auto-follow yaw when not dragged for
  2 s; pulled in in front of level geometry, eased back out.
- `level.ts` — `createLevel(scene)`: sky (three `Sky`, matched to drei's),
  fog, lights (the sun follows the player), and a mesh for every box, ramp
  and height field in `world.ts` (each list may be empty).
- `gltf.ts`, `props.ts`, `animatedModel.ts` — model parts, see "Model parts".

## `src/ui/`

- `MobileControls.tsx` — joystick + JUMP (React), shown on touch devices up front.

## `src/physics/`

Rapier (`@dimforge/rapier3d-compat`) is installed but lazy: import it only
from files under `src/physics/` that are reached through the dynamic
`import()` in `lazyPhysics.ts`. A static import anywhere else puts ~2 MB of
wasm into the first load. Dynamic bodies (balls, pins, stackable crates —
anything that should roll, tip over or be pushed): switch on the lazy rapier
path (`?physics=1` / `PHYSICS_DEMO = true`, the `physicsDemo` chunk) and build
those bodies in `physicsDemo.ts`. Do not hand-write their physics. Leave the
player controller (`src/game/player.ts`) as it is.

- `lazyPhysics.ts` — `loadPhysics(scene)` → `import('./physicsDemo')`.
- `physicsDemo.ts` — rapier world (gravity −26, fixed 1/60 s step), a floor
  collider and falling crates; a system the engine steps every frame.

## Camera presets by genre

Switch with one line in `config.ts`: `const PRESET: CameraPreset = 'shoulder';`.
The numbers live in `CAMERA_PRESETS` (`game/camera.ts`); `CAMERA.free` is a
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
(`HeightField`), moving platforms are AABBs that record `moved`. `three/level.ts`
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

### Moving platform (in `three/player.ts`)

```ts
import { updatePlatformAabb, type Aabb, type Platform } from '../game/world';

// A ferry down the course: center z slides between minZ and maxZ at x = 0.
// (Across the course instead: { size, top, z: -23, minX: -3, maxX: 3, speed }.)
const LIFT: Platform = { size: [3, 0.3, 3], top: 1.5, x: 0, minZ: -26, maxZ: -20, speed: 2 };
const lift: Aabb = { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
updatePlatformAabb(lift, LIFT, 0);
const COLLIDERS: Aabb[] = [...BOXES.map(boxAabb), lift];

// inside update(), before each stepPlayer substep (let clock = 0 next to `group`):
clock += dt / steps;
updatePlatformAabb(lift, LIFT, clock); // sets lift.moved: a rider is carried
// draw: new THREE.Mesh(new THREE.BoxGeometry(...LIFT.size), material) added to the scene,
// its position set to the lift's center at the end of update()
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
// three/player.ts already passes FIELDS: stepPlayer(..., COLLIDERS, lockZ, RAMPS, FIELDS)
```

`three/level.ts` draws each field as a plane displaced by `heightAt` (0.5 m grid).
The player's feet follow `heightAt`; slopes up to `maxSlope` (60°) are
walkable, steeper ones and faces more than `stepHeight` above the feet are
walls. Keep heights ≥ 0 so the floor box does not show through (or remove the
floor), and keep `heightAt` cheap — it runs several times per 1/120 s substep.
For noise terrain, call the noise function (e.g. simplex-noise
`createNoise2D`) inside `heightAt`.

## Model parts (putting models in)

Same behaviour as the R3F templates' `Props` / `AnimatedModel`, imported by
no scene yet — import them when the game needs a model; don't rewrite them.
Library models come at any scale (a mixamo rig is often a 0.01 Armature);
these measure the bounding box after `updateMatrixWorld`, scale to metres and
stand the lowest point on y = 0. Model URLs go in `src/assets.json` `models`.
Both return at once with an empty `object3d` that fills when the GLB has
loaded (`ready` resolves).

| path | for | required |
| --- | --- | --- |
| `src/game/fitModel.ts` | `fitModel(object, { height })` → `{ unit, lift }`: set `scale` to `unit` and `position.y` to `lift` on a wrapper | `object`, `height` (m) |
| `src/three/gltf.ts` | `loadGLTF(url)` → `Promise<GLTF>`, one load per URL (clone `gltf.scene` before using it twice; SkeletonUtils `clone` for skinned) | `url` |
| `src/three/props.ts` | `addProps(scene, { url, at, height, instanced?, castShadow? })` → `{ object3d, ready }`: a static model (crate, barrel, rock, house) added to `scene` at every `Placement` (`{ x, y, z, rotY, scale }`), instanced past 30 copies | `url`, `height` (m), `at` |
| `src/three/animatedModel.ts` | `createAnimatedModel({ url, height, source? })` → `{ object3d, update(dt), ready }`: a rigged enemy / NPC, feet at its origin, facing +z; plays its own named clips, a mixamorig rig without them borrows idle / walk / run (`assets.json` `animations`, `game/anim.ts` `retarget`); `source.state` picks the clip. Add `object3d` to the scene and call `update(dt)` from a system | `url`, `height` (m) |

```ts
// e.g. in engine.ts, after the systems list is built
addProps(scene, { url: assets.models['props/crate'].url, height: 0.8, at: [{ x: 2, y: 0, z: -4, rotY: 0, scale: 1 }] });
const guard = createAnimatedModel({ url: assets.models['characters/guard'].url, height: 1.7, source: { state: 'idle' } });
guard.object3d.position.set(-2, 0, -6);
scene.add(guard.object3d);
systems.push(guard);
```

## Extension points

- New obstacle / stairs / ramp / terrain / moving platform: see "Building the
  stage" above.
- New per-frame object (enemy, pickup, effect): a `{ update(dt) }` pushed to
  `systems` in `three/engine.ts`.
- New action: key in `input.ts` + button in `ui/MobileControls.tsx`.
- New dynamic bodies: in `physics/physicsDemo.ts` (or another file under
  `src/physics/` reached through `lazyPhysics.ts`), loaded by default by
  setting `PHYSICS_DEMO = true`.
