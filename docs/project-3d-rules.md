# 3D Project Development Rules

## Guideline for Using `RigidBodyObject`

When implementing physics interactions, it is mandatory to use the `RigidBodyObject` component from the `vibe-starter-3d` package instead of the standard `RigidBody` from `@react-three/rapier`.

The primary reason for this is to simplify event handling for collisions and intersections. Using the standard `RigidBody` component requires managing a complex set of events (`onCollisionEnter`, `onCollisionExit`, `onIntersectionEnter`, `onIntersectionExit`).

In contrast, `RigidBodyObject` abstracts this complexity. It allows you to handle all physics-based interactions uniformly through just two simple trigger events: `onTriggerEnter` and `onTriggerExit`. This makes the interaction logic significantly cleaner and easier to manage.

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
