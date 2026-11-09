# Structure — basic-3d-r3f-sideview

## `src/config.ts`

`PHYSICS_DEMO`, and the tuning tables `PLAYER` (speeds, gravity, jump,
coyote/buffer, `stepHeight`, `maxSlope`) and `CAMERA.side` (distance,
height, look-ahead).

## `src/App.tsx`

`<Canvas>` with `Level`, `Player`, `CameraRig` (and `LazyPhysics` when
enabled), a hint label, and `MobileControls`. Binds the keyboard.

## `src/game/`

- `input.ts` — keyboard set, joystick axes, `jumpPressedAt`; `moveAxis()`, `wantsRun()`.
- `player.ts` — pure `stepPlayer()`: acceleration, jump (coyote + buffer),
  gravity, axis-by-axis AABB collision with step-up, ramps, height fields
  (slope limit), riding moving boxes, respawn below `killY`; `lockZ` pins
  the player to z = 0.
- `player.test.ts` — `bun test` for ground, coyote, buffer, consume, step-up,
  ramp, platform and height field, on a test course defined in the file.
- `world.ts` — the stage: `BOXES` (just the floor), `RAMPS` and `FIELDS`
  (empty), plus the helpers `boxAabb`, `rampHeight`, `rampVertices`,
  `fieldHeight`, `platformCenter`, `updatePlatformAabb`.
- `camera.ts` / `camera.test.ts` — shared 3rd-person camera rules (presets,
  collision, follow yaw) used by the orbit-camera templates; the side camera
  does not use them.
- `anim.ts` — shared animation state and `retarget()` for mixamo clip GLBs.
- `state.ts` — the shared `player` (starts facing +x).

## `src/components/`

- `Player.tsx` — left / right input → `stepPlayer(..., lockZ = true, RAMPS,
  FIELDS)` in 1/120 s substeps against `BOXES`, sets the animation state,
  draws `Character`.
- `Character.tsx` — verse8 base character (a placeholder capsule until the
  GLB loads), clip cross-fade.
- `CameraRig.tsx` — fixed side camera on +z tracking x / y, leading toward
  the facing direction. No rotation input.
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
  For a side-scroller, put new bodies on z = 0 (or lock their z with
  `enabledTranslations`).

## Building the stage

The stage starts empty: one floor box (top at y = 0), sky, fog and a sun.
Obstacles go in `world.ts` `BOXES` / `RAMPS`, terrain in `FIELDS`
(`HeightField`), moving platforms are AABBs that record `moved`. `Level.tsx`
draws what is in `world.ts` and the player collides with the same data.
The player stays on z = 0: anything it must reach has to overlap z = 0.
Keep z > 0 empty (the camera looks from there); boxes wholly at negative z
are background.

Controller numbers (`PLAYER` in `config.ts`): radius 0.35 m, height 1.6 m;
`stepHeight` 0.35 m — a ledge this high or lower is walked onto, higher
blocks; `maxSlope` 60° — a steeper height-field slope is a wall; jump apex
≈ 1.56 m (`jumpVelocity` 9, `gravity` 26), so a 1.5 m box is about the
highest a jump reaches.

### Stairs and a ledge (`BOXES`)

```ts
export const BOXES: Box[] = [
  { pos: [0, -0.5, 0], size: [80, 1, 80], color: '#7fb069' }, // floor, top y = 0
  // three 0.3 m steps (each rise ≤ stepHeight 0.35: no jump needed)
  { pos: [2.5, 0.15, 0], size: [1, 0.3, 3], color: '#d9c5a0' },
  { pos: [3.5, 0.3, 0], size: [1, 0.6, 3], color: '#c9b48c' },
  { pos: [4.5, 0.45, 0], size: [1, 0.9, 3], color: '#b9a378' },
  // 0.9 → 1.5 is a 0.6 m ledge: needs a jump
  { pos: [6, 0.75, 0], size: [2, 1.5, 3], color: '#ca3c25' },
];
```

### Ramp (`RAMPS`)

```ts
// A wedge on the floor rising along +x (the default `dir`; '-x' rises the
// other way): y = 0 at minX, `height` at maxX.
// 1.5 m over 6 m ≈ 14°. Walk on from the low end; its tall end and the sides
// where the surface is more than stepHeight (0.35) above the feet are walls.
export const RAMPS: Ramp[] = [
  { minX: -11, maxX: -5, minZ: -1.5, maxZ: 1.5, height: 1.5, color: '#e6aa68' },
];
// a landing box at the top: { pos: [-4, 0.75, 0], size: [2, 1.5, 3], color: '#4f6d7a' }
```

### Moving platform (in `Player.tsx`)

```tsx
import { updatePlatformAabb, type Aabb, type Platform } from '../game/world';

const LIFT: Platform = { size: [3, 0.3, 3], top: 1.5, z: 0, minX: 11.5, maxX: 17.5, speed: 2 };
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
// Rolling ground along the course: up to 1.5 m, slopes ≤ ≈ 37°.
export const FIELDS: HeightField[] = [
  {
    minX: -30, maxX: 30, minZ: -3, maxZ: 3,
    heightAt: (x) => 0.75 * (1 - Math.cos(x)),
    color: '#6f9e5a',
  },
];
// Player.tsx already passes FIELDS: stepPlayer(..., COLLIDERS, true, RAMPS, FIELDS)
```

`Level.tsx` draws each field as a plane displaced by `heightAt` (0.5 m grid).
The player's feet follow `heightAt`; slopes up to `maxSlope` (60°) are
walkable, steeper ones and faces more than `stepHeight` above the feet are
walls. Keep heights ≥ 0 so the floor box does not show through (or remove the
floor), and keep `heightAt` cheap — it runs several times per 1/120 s substep.
For noise terrain, call the noise function (e.g. simplex-noise
`createNoise2D`) inside `heightAt`.

## Extension points

- New obstacle / stairs / ramp / terrain / moving platform: see "Building the
  stage" above (overlapping z = 0).
- New action: key in `input.ts` + button in `MobileControls.tsx`.
- New dynamic bodies: in `PhysicsDemo.tsx` (or another file under
  `src/physics/` reached through `LazyPhysics`), mounted by default by setting
  `PHYSICS_DEMO = true`.
