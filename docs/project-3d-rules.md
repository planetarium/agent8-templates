# 3D Project Development Rules

## Guideline for Using `RigidBodyObject`

When implementing physics interactions, it is mandatory to use the `RigidBodyObject` component from the `vibe-starter-3d` package instead of the standard `RigidBody` from `@react-three/rapier`.

The primary reason for this is to simplify event handling for collisions and intersections. Using the standard `RigidBody` component requires managing a complex set of events (`onCollisionEnter`, `onCollisionExit`, `onIntersectionEnter`, `onIntersectionExit`).

In contrast, `RigidBodyObject` abstracts this complexity. It allows you to handle all physics-based interactions uniformly through just two simple trigger events: `onTriggerEnter` and `onTriggerExit`. This makes the interaction logic significantly cleaner and easier to manage.

## NPC / Character Physics Body & Visual Alignment

### Animation Retargeting — Rotation-Only Tracks to Preserve Bone Proportions

When applying external Mixamo animation clips to a model with **different skeleton proportions** (e.g., standard tall rig → SD short/chubby rig), the source clip's **position tracks** move bones to the source rig's absolute positions. This stretches the target model's limbs to match the source bone lengths — legs grow longer, torso elongates.

**Rule:** Before binding an external clip to a different-proportioned skeleton, strip all `.position` and `.scale` tracks and keep only `.quaternion` (rotation) tracks. Rotations are proportionally invariant — they encode "how much to rotate each joint" without encoding bone length.

```ts
function retargetClip(clip: THREE.AnimationClip): THREE.AnimationClip {
  const rotationOnly = clip.tracks.filter((track) =>
    track.name.endsWith('.quaternion')
  );
  return new THREE.AnimationClip(clip.name, clip.duration, rotationOnly);
}

// Apply before clipAction:
const idleClip = retargetClip(idleAnims[0]);
const idleAction = mixer.clipAction(idleClip, clonedScene);
```

**When NOT needed:** If the source and target skeletons have the same proportions (e.g., both are standard Mixamo characters), position tracks are safe and provide root-motion. Only strip them for cross-proportion retargeting.

### CharacterRenderer with Non-Standard Proportion Models

When using `CharacterRenderer` from `vibe-starter-3d`, the package internally runs its own animation retargeting (`convertAnimation()` in `useCharacterResource`). This internal retargeting applies hips-position scaling but keeps all position tracks — which can cause **limb stretching** on models with very different proportions from the animation source (e.g., SD characters, cartoon animals like a husky dog).

**Rule:** For models whose skeleton proportions differ significantly from the standard Mixamo humanoid rig, set `disableAnimationAdjustmentToModelProportion={true}` on `CharacterRenderer`. This skips the package's internal retargeting and uses the raw animation clip as-is.

```tsx
// ✅ For non-standard proportion models (SD, cartoon animals, etc.)
<CharacterRenderer
  url={huskyModelUrl}
  animationConfigMap={animationConfigMap}
  animationState={animationState}
  targetHeight={1.0}
  disableAnimationAdjustmentToModelProportion={true}
/>

// ✅ For standard Mixamo humanoid models — default behavior is fine
<CharacterRenderer
  url={humanModelUrl}
  animationConfigMap={animationConfigMap}
  animationState={animationState}
  targetHeight={1.6}
/>
```

**How to decide:** If `targetHeight` differs significantly from the animation source's native height (~1.7m for standard Mixamo), or if the model is a non-humanoid shape (quadrupeds, SD chibi, etc.), enable this flag. When the flag is `true`, the `targetHeight` prop still handles visual scaling correctly — only the internal animation bone-position adjustment is disabled.

**Combining with manual retargeting:** If you are bypassing `CharacterRenderer` and using `AnimationMixer` directly, apply the `retargetClip()` function from the rule above instead.

---

### NPC / Enemy Character Collider — CapsuleCollider Pattern

When attaching physics colliders to NPC or enemy characters, **always follow the pattern below.**

#### Core Principle

Most 3D character GLBs have their **Y-axis pivot at the feet position (Y=0)**. If `CapsuleCollider`'s `position` is not specified, the collider center aligns with the foot position, causing **the character's upper body to float in the air.**

**Rule:** Set `position={[0, targetHeight / 2, 0]}` to offset the collider center upward by half the character's height.

```
Character Head  ← Y = targetHeight (e.g., 1.4m)
     |
     |      ← CapsuleCollider center (Y = targetHeight / 2 = 0.7m)
     |
Character Feet  ← Y = 0 (pivot position)
```

#### Required Implementation Pattern

```tsx
import { RigidBodyObject, CharacterRenderer, CharacterUtils } from 'vibe-starter-3d';
import { CapsuleCollider } from '@react-three/rapier';

const NPC_TARGET_HEIGHT = 1.4;

function NPCCharacter({ position }) {
  return (
    <RigidBodyObject
      type="dynamic"
      colliders={false}          // ✅ Must disable auto-colliders
      position={position}
      lockRotations
    >
      {/* Key: position={[0, targetHeight / 2, 0]} */}
      <CapsuleCollider
        position={[0, NPC_TARGET_HEIGHT / 2, 0]}
        args={[
          CharacterUtils.capsuleHalfHeight(NPC_TARGET_HEIGHT),
          CharacterUtils.capsuleRadius(NPC_TARGET_HEIGHT),
        ]}
      />
      <CharacterRenderer
        url={npcModelUrl}
        animationConfigMap={animationConfigMap}
        animationState={animationState}
        targetHeight={NPC_TARGET_HEIGHT}
      />
    </RigidBodyObject>
  );
}
```

#### Incorrect Patterns

```tsx
// ❌ Auto-generated hull/capsule colliders — mesh-based sizing causes floating
<RigidBodyObject type="dynamic" colliders="hull" ...>
  <CharacterRenderer ... />
</RigidBodyObject>

// ❌ CapsuleCollider added without colliders={false} — double collider conflict
<RigidBodyObject type="dynamic" ...>
  <CapsuleCollider ... />
  <CharacterRenderer ... />
</RigidBodyObject>

// ❌ CapsuleCollider without position — collider center at feet, body floats upward
<CapsuleCollider args={[halfH, radius]} /> {/* position missing */}
```

#### CharacterUtils Usage

`CharacterUtils` automatically calculates the correct collider dimensions for the given `targetHeight`:

```tsx
import { CharacterUtils } from 'vibe-starter-3d';

// For targetHeight = 1.4
CharacterUtils.capsuleHalfHeight(1.4) // ≈ 0.42
CharacterUtils.capsuleRadius(1.4)     // ≈ 0.28
```

---

### Problem: Walk Animation Switches to T-Pose (crossFadeTo disabled bug)

`crossFadeTo()` internally sets `enabled = false` on the fading-out action once its weight reaches 0. The next time you try to fade back to that action as a **source**, it is already disabled and contributes zero weight — resulting in a permanent T-pose (no animation applied at all).

**Rule:** Never use `crossFadeTo()` for looping state switches (idle ↔ walk). Instead, **lerp weights manually each frame**. Both actions stay `enabled = true` and playing at all times, so transitions always work correctly.

```tsx
// Setup — both actions playing, weights explicit
const FADE_SPEED = 1 / 0.3; // reach target weight in 0.3 s

idleAction.reset().play();
idleAction.weight = 1;

walkAction.reset().play();
walkAction.weight = 0;

// In useFrame — manual weight lerp, no crossFadeTo()
const targetWalk = isMoving ? 1 : 0;
const step = FADE_SPEED * delta;
let w = walkAction.weight;
if (Math.abs(w - targetWalk) < step) {
  w = targetWalk;
} else {
  w += targetWalk > w ? step : -step;
}
walkAction.weight = w;
idleAction.weight = 1 - w;
```

```tsx
// ❌ Never do this for repeating state switches
idleAction.crossFadeTo(walkAction, 0.3, true);
// After fade completes: idleAction.enabled = false
// Next call to walkAction.crossFadeTo(idleAction, ...) → T-pose
```

---

## GLB Model Cloning — Always Use SkeletonUtils.clone()

**Rule:** Never use `scene.clone(true)` to duplicate a loaded GLB model. Always use `SkeletonUtils.clone()` from `three-stdlib`.

**Why `scene.clone(true)` breaks SkinnedMesh models:**

Most character GLB files use a `SkinnedMesh` with a bone skeleton (e.g. mixamo rig). `Object3D.clone(true)` copies the mesh nodes but leaves the cloned `SkinnedMesh` pointing at the **original** skeleton's bones. All clones share one skeleton state, so bones deform incorrectly and the mesh collapses or becomes invisible.

**Correct pattern:**

```tsx
import { SkeletonUtils } from 'three-stdlib';
import { useGLTF } from '@react-three/drei';

function MyModel() {
  const { scene } = useGLTF(url);

  const cloned = React.useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as THREE.Group;
    // Disable frustum culling for SkinnedMesh — bounding boxes are often wrong
    clone.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        (child as THREE.SkinnedMesh).frustumCulled = false;
      }
    });
    return clone;
  }, [scene]);

  return <primitive object={cloned} />;
}
```

`SkeletonUtils.clone()` deep-copies the entire bone hierarchy so each instance has its own independent skeleton. This is the same approach used internally by drei's `<Clone>` component.

**Preloading:** Call `useGLTF.preload(url)` at module level so the network request is shared across all instances regardless of how many are mounted.

```ts
// At module top level — fetched once, cloned per instance
Object.values(MODEL_URLS).forEach((url) => useGLTF.preload(url));
```

## Performance Optimization Rules

### Shadow Map

| Setting | Before | After | Effect |
|---|---|---|---|
| Shadow map size | 2048×2048 | 1024×1024 | GPU memory reduced ~4× |
| Shadow camera range | 200×200 | 120×120 | Shadow computation reduced ~64% |

**Rule:** Use `1024×1024` shadow maps as the default. Only upgrade to `2048` if shadow quality is visibly insufficient. Minimize the shadow camera's `left/right/top/bottom` range to the smallest value that still covers the playable area.

```tsx
<DirectionalLight
  castShadow
  shadow-mapSize-width={1024}
  shadow-mapSize-height={1024}
  shadow-camera-left={-60}
  shadow-camera-right={60}
  shadow-camera-top={60}
  shadow-camera-bottom={-60}
/>
```

### Terrain Size & Detail

| Setting | Before | After | Effect |
|---|---|---|---|
| Terrain size | 200×200 | 160×160 | — |
| Terrain detail | 5 | 4 | Triangle count reduced ~36% |

**Rule:** Keep terrain `detail` at 4 or lower unless fine surface detail is required. Reduce terrain size to the minimum that covers the playable area. Every extra level of `detail` roughly quadruples the triangle count.

### ModelPlacer Instance Count

| Object type | Before | After | Effect |
|---|---|---|---|
| Total instances | 62 (25+15+10+12) | 35 (15+8+6+6) | Draw calls reduced ~44% |

**Rule:** Keep total `ModelPlacer` instances at or below 35–40. Dense environmental props (trees, rocks, bushes) should be the first candidates for count reduction. Prefer larger, more distinctive objects over many small ones.

### `useThree()` — Call Once, Share via Ref

**Rule:** Never call `useThree()` inside individual repeated components (e.g., per-NPC, per-enemy, per-entity). Instead, call it once in the parent manager component and pass the result (camera, gl, scene, etc.) down via props or a shared ref.

**Why:** `useThree()` is a React hook with subscription overhead. Calling it in each of N entity components creates N separate subscriptions. A single call in the manager eliminates N-1 unnecessary subscriptions.

```tsx
// ❌ Incorrect — hook called in every entity instance
function NPCEntity() {
  const { camera } = useThree(); // called N× in parallel
  ...
}

// ✅ Correct — called once in parent, ref shared
function NPCManager() {
  const { camera } = useThree(); // called once
  const cameraRef = useRef(camera);

  return entities.map((e) => (
    <NPCEntity key={e.id} cameraRef={cameraRef} />
  ));
}
```

---

## Canvas Component Structure Rules

**Core Requirement:** Components that render HTML tags (e.g., `<div>`, `<button>`) must NEVER be placed inside React Three Fiber's `<Canvas>` component.

**Reasoning:**
This is a core architectural rule. Placing standard HTML inside the `<Canvas>` WebGL context will cause rendering errors.

**Implementation Guidelines:**

- **UI Components:** Components using HTML tags belong in the `src/components/ui/` directory. They must be rendered as an overlay, outside the `<Canvas>`.
- **3D Components:** Only Three.js-related components, located in `src/components/r3f/`, should be placed inside the `<Canvas>`.

**Correct Structure Example:**

```tsx
// ✅ Correct approach
<div>
  {/* The 3D scene is rendered inside the Canvas */}
  <Canvas>
    <Player />
    <Floor />
  </Canvas>

  {/* UI components are rendered as overlays outside the Canvas */}
  <Crosshair />
  <LoadingScreen />
</div>
```

**Incorrect Structure Example:**

```tsx
// ❌ Incorrect approach
<Canvas>
  <Player />
  {/* This is forbidden, as Crosshair renders HTML */}
  <Crosshair />
</Canvas>
```
