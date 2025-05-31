# R3F + Rapier Essentials

Essential patterns and performance optimizations for React Three Fiber with Rapier physics.  
**These are fundamental guidelines that should be followed for robust and maintainable applications.**

_For games with: character movement & jumping, rotating obstacles, coin collection & scoring, projectile systems, collision detection, and interactive physics objects._

---

## 1. Core Usage Patterns

### 1.1 Physics Object Control

**Rule:**  
Always control physics objects through `RigidBody` API, never through mesh transforms.

```tsx
// ✅ Correct
const rbRef = useRef();
useFrame(() => {
  rbRef.current?.setLinvel({ x: 1, y: 0, z: 0 }, true);
});
<RigidBody ref={rbRef} type="fixed">
  <mesh>...</mesh>
</RigidBody>;

// ❌ Wrong
const meshRef = useRef();
useFrame(() => {
  meshRef.current.position.x += 0.01; // Breaks physics sync
});
<RigidBody type="fixed">
  <mesh ref={meshRef}>...</mesh>
</RigidBody>;
```

### 1.2 State Management

**Rule:**  
Use `useRef` + `useFrame` for real-time updates. Avoid `useState` for scene objects.

```tsx
// ✅ Performance-friendly
const ref = useRef();
useFrame(() => {
  ref.current.position.z += 0.1;
});

// ❌ Causes re-renders
const [z, setZ] = useState(0);
useFrame(() => setZ((v) => v + 0.1));
```

### 1.3 Initial vs Runtime State

```tsx
// Props for initial state
<RigidBody position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
  <mesh />
</RigidBody>;

// Refs for runtime changes
const rbRef = useRef();
useFrame(() => {
  rbRef.current?.setLinvel({ x: 1, y: 0, z: 0 }, true);
});
<RigidBody ref={rbRef}>...</RigidBody>;
```

### 1.4 Physics vs Render Cycle Synchronization

**Rule:**  
Never read physics state and immediately apply it back to physics in the same frame. Physics and render cycles are different - use accumulated values instead.

```tsx
// ❌ Wrong - Reading and writing physics state in same frame
useFrame((_state, delta) => {
  if (barricadeRef.current) {
    const currentQuat = barricadeRef.current.rotation();
    const euler = new THREE.Euler().setFromQuaternion(currentQuat);
    const newY = euler.y + delta * 0.5;

    barricadeRef.current.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, newY, 0)));
  }
});

// ✅ Correct - Use accumulated values with refs
const Barricade = () => {
  const barricadeRef = useRef<RapierRigidBody>(null);
  const angleRef = useRef(0);

  useFrame((_state, delta) => {
    if (barricadeRef.current) {
      angleRef.current += delta * 0.5;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angleRef.current, 0));
      barricadeRef.current.setRotation(q, true);
    }
  });

  return (
    <RigidBody ref={barricadeRef} type="fixed" position={[0, 0.75, 0]} name="barricade">
      <CuboidCollider args={[5, 0.25, 0.25]} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={[10, 0.5, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </RigidBody>
  );
};
```

**Why this matters:**

- Physics simulation runs at fixed timesteps (usually 60Hz)
- Render loop runs at variable frame rates
- Reading physics state and writing back creates timing conflicts
- Use refs to maintain your own state that drives physics updates

---

## 2. Performance Optimization

### 2.1 Essential Performance Rules

**Avoid Re-renders:**

- Use `useRef` instead of `useState` for scene objects
- Use `visible` prop instead of mount/unmount
- Cache materials and geometries with `useMemo`

**Optimize Object Creation:**

```tsx
// ❌ Creates new objects every frame
useFrame(() => {
  ref.current.position.lerp(new THREE.Vector3(x, y, z), 0.1);
});

// ✅ Reuse objects
const temp = useMemo(() => new THREE.Vector3(), []);
useFrame(() => {
  ref.current.position.lerp(temp.set(x, y, z), 0.1);
});
```

**Use Instancing for Many Objects:**

```tsx
// For many similar objects
<Instances>
  <boxGeometry />
  <meshStandardMaterial />
  {objects.map((obj, i) => (
    <Instance key={i} position={obj.position} />
  ))}
</Instances>
```

### 2.2 Collision Groups

```tsx
const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  BULLET: 0x0004,
  ENVIRONMENT: 0x0008,
} as const;

<RigidBody
  collisionGroups={COLLISION_GROUPS.BULLET}
  solverGroups={COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.ENVIRONMENT}
>
```

### 2.3 Object Pooling

```tsx
const bulletPool = useRef([]);
const activeBullets = useRef(new Set());

const getBullet = useCallback(() => {
  let bullet = bulletPool.current.pop();
  if (!bullet) bullet = createNewBullet();
  activeBullets.current.add(bullet);
  return bullet;
}, []);

const returnBullet = useCallback((bullet) => {
  activeBullets.current.delete(bullet);
  bullet.reset();
  bulletPool.current.push(bullet);
}, []);
```

---

## 3. Force Application

### 3.1 Method Selection

| Method         | Effect                  | Use Case            |
| -------------- | ----------------------- | ------------------- |
| `applyImpulse` | Instant velocity change | Jumping, explosions |
| `addForce`     | Continuous acceleration | Thrusters, wind     |
| `setLinvel`    | Direct velocity setting | Teleportation       |

```tsx
const rigidBodyRef = useRef();

// Jump (impulse)
const jump = () => {
  rigidBodyRef.current?.applyImpulse({ x: 0, y: 10, z: 0 }, true);
};

// Continuous thrust (force)
useFrame(() => {
  rigidBodyRef.current?.addForce({ x: 0, y: 0, z: -5 }, true);
});

// Direct movement (velocity)
const move = (velocity) => {
  rigidBodyRef.current?.setLinvel(velocity, true);
};
```

---

## 4. Ray Casting

### 4.1 Basic Pattern

```tsx
const { rapier, world } = useRapier();

const performRaycast = useCallback(
  (origin, direction, maxDistance) => {
    const ray = new rapier.Ray(origin, direction);
    const hit = world.castRay(ray, maxDistance, true);

    if (hit) {
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      return { point: hitPoint, collider: hit.collider };
    }
    return null;
  },
  [rapier, world],
);
```

### 4.2 Collision Detection

```tsx
// Ground check example
const checkGrounded = useCallback(() => {
  const character = characterRef.current;
  if (!character) return false;

  const ray = new rapier.Ray(character.translation(), { x: 0, y: -1, z: 0 });

  const hit = world.castRay(ray, 1.1, true);
  return !!hit;
}, [world]);
```

---

## 5. Memory Management

### 5.1 Cleanup Pattern

```tsx
useEffect(() => {
  return () => {
    // Clear references
    if (rigidBodyRef.current) {
      rigidBodyRef.current = null;
    }
    // Clear timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
}, []);
```

### 5.2 Safe Operations

```tsx
const safeApplyImpulse = useCallback((impulse) => {
  const rigidBody = rigidBodyRef.current;
  if (!rigidBody || rigidBody.isSleeping()) return;

  try {
    rigidBody.applyImpulse(impulse, true);
  } catch (error) {
    console.error('Physics operation failed:', error);
  }
}, []);
```

---

## 6. Performance Checklist

### 6.1 Essential Optimizations

- [ ] Use `useRef` instead of `useState` for scene objects
- [ ] Cache materials and geometries with `useMemo`
- [ ] Use object pooling for frequently created/destroyed objects
- [ ] Use collision groups for filtering
- [ ] Use `visible` prop instead of mount/unmount
- [ ] Avoid creating temporary objects in loops
- [ ] Clean up references on unmount
- [ ] Use `useFrame` delta for time-based animations
- [ ] Prefer instancing for many similar objects
- [ ] Minimize React re-renders in physics loops

### 6.2 Common Performance Pitfalls

1. **Creating objects in loops**: Cache and reuse Vector3, Quaternion, etc.
2. **React state in useFrame**: Use refs for high-frequency updates
3. **Unnecessary re-renders**: Avoid setState in animation loops
4. **Memory leaks**: Clean up timers and references
5. **Collision overhead**: Use appropriate collision groups

---

## 7. Recommended Libraries

- **State Management**: `zustand`, `valtio`
- **Animation**: `react-spring`
- **Input**: `@react-three/drei` (KeyboardControls)
- **Networking**: `socket.io`

---

> **Note:**  
> This guide focuses on essential patterns for production R3F + Rapier applications with emphasis on performance and maintainability.
