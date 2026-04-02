# 3D Project Development Rules

## Guideline for Using `RigidBodyObject`

When implementing physics interactions, it is mandatory to use the `RigidBodyObject` component from the `vibe-starter-3d` package instead of the standard `RigidBody` from `@react-three/rapier`.

The primary reason for this is to simplify event handling for collisions and intersections. Using the standard `RigidBody` component requires managing a complex set of events (`onCollisionEnter`, `onCollisionExit`, `onIntersectionEnter`, `onIntersectionExit`).

In contrast, `RigidBodyObject` abstracts this complexity. It allows you to handle all physics-based interactions uniformly through just two simple trigger events: `onTriggerEnter` and `onTriggerExit`. This makes the interaction logic significantly cleaner and easier to manage.

## Animated GLB Models in Physics Bodies — Must Use `colliders={false}`

When placing any animated GLB model (characters, NPCs, animals, creatures) inside `RigidBodyObject`, you **must** set `colliders={false}` and add an explicit `CapsuleCollider`. This applies whether you use `CharacterRenderer`, `<primitive object={glb.scene}>`, or `<Clone>`.

Without `colliders={false}`, `@react-three/rapier` auto-generates colliders by traversing all child nodes. Animated models contain bone/armature nodes with no geometry, causing a fatal crash: `TypeError: Cannot read properties of undefined (reading 'count')` at `mergeVertices`.

```tsx
// ✅ Correct — colliders={false} with explicit CapsuleCollider
<RigidBodyObject type="dynamic" colliders={false} position={position} lockRotations>
  <CapsuleCollider
    position={[0, targetHeight / 2, 0]}
    args={[targetHeight * 0.3, targetHeight * 0.2]}
  />
  <CharacterRenderer url={modelUrl} targetHeight={targetHeight} ... />
</RigidBodyObject>

// ❌ CRASHES — auto-colliders on animated model
<RigidBodyObject type="dynamic">
  <CharacterRenderer url={modelUrl} ... />
</RigidBodyObject>

// ❌ CRASHES — same issue with useGLTF + primitive
<RigidBodyObject type="dynamic">
  <primitive object={animalGLB.scene} />
</RigidBodyObject>
```

**Note:** Static prop GLBs (trees, rocks, buildings) without bones/armatures are safe with auto-colliders.

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
