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

**Critical:** This example shows **Mesh** control. For **RigidBody** objects, NEVER use direct position manipulation:

```tsx
// ❌ WRONG - Breaks physics sync for RigidBody
const rigidBodyRef = useRef();
useFrame(() => {
  rigidBodyRef.current.position.z += 0.1; // DON'T DO THIS
});

// ✅ CORRECT - Use RigidBody API for physics objects
const rigidBodyRef = useRef();
useFrame(() => {
  const currentVel = rigidBodyRef.current.linvel();
  rigidBodyRef.current.setLinvel({ x: currentVel.x, y: currentVel.y, z: 1 }, true);
});
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

  // Create reusable objects for performance optimization
  const quaternionRef = useRef(new Quaternion());
  const eulerRef = useRef(new Euler(0, 0, 0));

  useFrame((_state, delta) => {
    if (barricadeRef.current) {
      angleRef.current += delta * 0.5;

      // Reuse existing objects to avoid creating new ones
      eulerRef.current.set(0, angleRef.current, 0);
      quaternionRef.current.setFromEuler(eulerRef.current);

      barricadeRef.current.setNextKinematicRotation(quaternionRef.current);
    }
  });

  return (
    <RigidBody ref={barricadeRef} type="kinematicPosition" position={[0, 0.75, 0]}>
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

## 2. RigidBody Configuration

### 2.1 Collider Types

**Rule:**  
Choose appropriate collider shapes for performance and accuracy. Simple shapes are faster than complex ones.

#### Collider Types (via `colliders` prop)

```tsx
// Available collider values:
'ball'; // Sphere collider
'cuboid'; // Box collider
'hull'; // Convex hull (for complex dynamic objects)
'trimesh'; // Triangle mesh (for complex static geometry)
false; // No auto collider
```

#### Basic Usage Examples

```tsx
// ✅ Manual collider (default behavior)
<RigidBody type="dynamic">
  <CuboidCollider args={[1, 1, 1]} />
  <mesh>
    <boxGeometry args={[2, 2, 2]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>

// ✅ Automatic collider generation
<RigidBody colliders="cuboid" type="dynamic">
  <mesh>
    <boxGeometry args={[2, 2, 2]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>

// ❌ This won't work - no collider at all!
<RigidBody type="dynamic">
  <mesh>
    <boxGeometry args={[2, 2, 2]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>
```

**Important:** By default (`colliders={false}`), RigidBody has NO collision shape. You must either:

1. Add manual colliders like `<CuboidCollider />`, or
2. Set `colliders="cuboid"` (or other shape) for automatic generation

#### Manual Collider Declaration

**Rule:**  
Use manual colliders for precise control or compound shapes.

```tsx
// ✅ Compound colliders (multiple shapes)
<RigidBody colliders={false} position={[0, 1, 0]}>
  {/* Main body */}
  <CuboidCollider args={[1, 0.5, 1]} position={[0, 0, 0]} />
  {/* Sensor trigger */}
  <CuboidCollider args={[1.2, 0.1, 1.2]} position={[0, 0.6, 0]} sensor />

  <mesh>
    <boxGeometry args={[2, 1, 2]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>

// ✅ Custom positioned colliders
<RigidBody colliders={false} type="fixed">
  <BallCollider args={[0.5]} position={[0, 2, 0]} />
  <CuboidCollider args={[2, 0.1, 2]} position={[0, 0, 0]} />

  <mesh position={[0, 2, 0]}>
    <sphereGeometry args={[0.5]} />
    <meshStandardMaterial />
  </mesh>
  <mesh position={[0, 0, 0]}>
    <boxGeometry args={[4, 0.2, 4]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>

// Sensor collider for triggers
<RigidBody colliders={false} type="fixed">
  <CuboidCollider
    args={[2, 2, 2]}
    sensor
    onIntersectionEnter={({ target }) => {
      console.log('Player entered zone!');
    }}
  />
</RigidBody>
```

#### Performance Guidelines

```tsx
// ✅ Performance priority (fastest → slowest)
"ball" > "cuboid" > "hull" > "trimesh"

// ✅ Best practices
// Static complex geometry
<RigidBody colliders="trimesh" type="fixed">
  <ComplexStaticMesh />
</RigidBody>

// Dynamic objects - keep simple
<RigidBody colliders="ball" type="dynamic">
  <ComplexVisualMesh />
</RigidBody>

// Player character - capsule for smooth movement
<RigidBody colliders="ball" type="dynamic">
  <CharacterMesh />
</RigidBody>

// Multiple simple colliders vs one complex
// ✅ Better performance
<RigidBody colliders={false}>
  <CuboidCollider args={[1, 1, 1]} />
  <BallCollider args={[0.5]} position={[2, 0, 0]} />
</RigidBody>

// ❌ Worse performance
<RigidBody colliders="hull">
  <ComplexMultiPartMesh />
</RigidBody>
```

#### Common Collider Patterns

```tsx
// Character controller
const Character = () => (
  <RigidBody colliders={false} type="dynamic" lockRotations>
    <CapsuleCollider args={[0.5, 1]} />
    <mesh>
      <capsuleGeometry args={[0.5, 2]} />
      <meshStandardMaterial />
    </mesh>
  </RigidBody>
);

// Character with foot-pivot model (common case)
const CharacterWithFootPivot = () => {
  const characterHeight = 2.0;
  const capsuleRadius = 0.5;
  const capsuleHalfHeight = 1.0; // Half of character height

  return (
    <RigidBody colliders={false} type="dynamic" lockRotations>
      {/* Position capsule at half character height for foot-pivot models */}
      <CapsuleCollider args={[capsuleRadius, capsuleHalfHeight]} position={[0, characterHeight * 0.5, 0]} />
      <mesh>
        <capsuleGeometry args={[capsuleRadius, characterHeight]} />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
  );
};

// Character setup guidelines
// ✅ For foot-pivot models (most common):
// - Position CapsuleCollider at Y = characterHeight * 0.5
// - This aligns physics center with visual center
// - Prevents character "floating" or "sinking" into ground

// ✅ For center-pivot models:
// - CapsuleCollider position can be [0, 0, 0]
// - Physics and visual centers already aligned

// Projectile with sensor
const Bullet = () => (
  <RigidBody colliders={false} type="dynamic">
    <BallCollider args={[0.1]} sensor onIntersectionEnter={handleHit} />
    <mesh>
      <sphereGeometry args={[0.1]} />
      <meshStandardMaterial />
    </mesh>
  </RigidBody>
);

// Terrain
const Terrain = ({ geometry }) => (
  <RigidBody colliders="trimesh" type="fixed">
    <mesh geometry={geometry}>
      <meshStandardMaterial />
    </mesh>
  </RigidBody>
);
```

### 2.2 RigidBody Properties

**Rule:**  
Understanding RigidBody properties is essential for proper physics behavior configuration.

**Note:** Most RigidBodyOptions properties are optional. When undefined, Rapier uses these defaults:

- `type`: `"dynamic"`
- `colliders`: `false` (no automatic collider generation)
- `gravityScale`: `1.0`
- `dominanceGroup`: `0`
- `ccd`: `false`
- `lockRotations`/`lockTranslations`: `false`
- `enabledRotations`/`enabledTranslations`: `[true, true, true]`
- `linearVelocity`/`angularVelocity`: `[0, 0, 0]`

**Essential Properties:**

| Property              | Type                                                                       | Description                                                          | Use Case                                         |
| --------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| `type`                | `"fixed"` \| `"dynamic"` \| `"kinematicPosition"` \| `"kinematicVelocity"` | Physics body type (default: `"dynamic"`)                             | Static walls, moving objects, animated platforms |
| `colliders`           | `"ball"` \| `"cuboid"` \| `"hull"` \| `"trimesh"` \| `false`               | Automatic collider generation (default: `false`)                     | Quick setup vs manual control                    |
| `mass`                | `number`                                                                   | Object mass in kg (auto-calculated from density×volume if undefined) | Heavy/light objects, realistic physics           |
| `friction`            | `number`                                                                   | Surface friction (0-∞)                                               | Slippery ice, sticky surfaces                    |
| `restitution`         | `number`                                                                   | Bounciness (0-1)                                                     | Bouncy balls, dead drops                         |
| `gravityScale`        | `number`                                                                   | Gravity multiplier (default: `1.0`)                                  | Floating objects, heavy objects                  |
| `linearDamping`       | `number`                                                                   | Linear velocity damping                                              | Air resistance, underwater                       |
| `angularDamping`      | `number`                                                                   | Angular velocity damping                                             | Spinning resistance                              |
| `lockRotations`       | `boolean`                                                                  | Lock all rotations (default: `false`)                                | Character controllers                            |
| `lockTranslations`    | `boolean`                                                                  | Lock all translations (default: `false`)                             | Fixed rotation objects                           |
| `enabledRotations`    | `[boolean, boolean, boolean]`                                              | Enable rotations per axis (default: `[true, true, true]`)            | Constrain specific rotations                     |
| `enabledTranslations` | `[boolean, boolean, boolean]`                                              | Enable translations per axis (default: `[true, true, true]`)         | Constrain movement directions                    |
| `canSleep`            | `boolean`                                                                  | Allow physics sleeping                                               | Performance optimization                         |
| `collisionGroups`     | `number`                                                                   | What groups this body belongs to                                     | Collision filtering                              |
| `solverGroups`        | `number`                                                                   | What groups this body collides with                                  | Collision filtering                              |
| `dominanceGroup`      | `number`                                                                   | Dominance for collision immunity (default: `0`)                      | Player immunity to pushbacks                     |
| `ccd`                 | `boolean`                                                                  | Continuous Collision Detection (default: `false`)                    | Fast-moving objects                              |
| `softCcdPrediction`   | `number`                                                                   | Soft CCD prediction distance                                         | Tunneling prevention                             |
| `linearVelocity`      | `[number, number, number]`                                                 | Initial linear velocity (default: `[0, 0, 0]`)                       | Moving platforms, projectiles                    |
| `angularVelocity`     | `[number, number, number]`                                                 | Initial angular velocity (default: `[0, 0, 0]`)                      | Spinning objects                                 |

**Important RigidBody Type Constraints:**

- **`setLinvel()`, `applyImpulse()`, `addForce()`**: Only work on `type="dynamic"` bodies
- **`setTranslation()`, `setRotation()`**: Work on all types, but not recommended for dynamic bodies (use forces/velocities instead)
- **`setNextKinematicTranslation()`**: Only for `type="kinematicPosition"` bodies

#### Usage Examples

```tsx
// Character controller
<RigidBody
  type="dynamic"
  colliders={false}
  mass={70}
  lockRotations={true}
  friction={0.8}
>
  <CapsuleCollider args={[0.5, 1]} />
  <mesh>...</mesh>
</RigidBody>

// Bouncy ball
<RigidBody
  colliders="ball"
  restitution={0.9}
  friction={0.1}
  mass={1}
>
  <mesh>...</mesh>
</RigidBody>

// Floating platform (kinematic)
<RigidBody
  type="kinematicPosition"
  colliders="cuboid"
  friction={1.0}
>
  <mesh>...</mesh>
</RigidBody>

// 2D-style character (locked Z-axis)
<RigidBody
  type="dynamic"
  enabledTranslations={[true, true, false]}
  enabledRotations={[false, false, false]}
  gravityScale={2.0}
>
  <mesh>...</mesh>
</RigidBody>

// Collision groups example
<RigidBody
  collisionGroups={0x0001} // This object is in group 1
  solverGroups={0x0002}    // This object only collides with group 2
>
  <mesh>...</mesh>
</RigidBody>
```

### 2.3 Kinematic Body Types: Position vs Velocity

**Rule:**  
Choose the right kinematic control method based on your movement needs and precision requirements.

#### Core Differences

| Feature            | `kinematicPosition`                                           | `kinematicVelocity`              |
| ------------------ | ------------------------------------------------------------- | -------------------------------- |
| **Control Method** | Direct position setting                                       | Velocity-based movement          |
| **API Methods**    | `setNextKinematicTranslation()`, `setNextKinematicRotation()` | `setLinvel()`, `setAngvel()`     |
| **Movement Style** | Precise, frame-by-frame positioning                           | Smooth acceleration/deceleration |
| **Use Case**       | Exact paths, scripted animations                              | Natural movement, AI behavior    |

#### kinematicPosition - Exact Control

**Best for:** Elevators, rotating doors, scripted platforms, cutscene objects

```tsx
// Moving platform with exact sine wave motion
const MovingPlatform = () => {
  const platformRef = useRef<RapierRigidBody>(null);
  const timeRef = useRef(0);

  useFrame((_state, delta) => {
    if (platformRef.current) {
      timeRef.current += delta;

      // Exact position calculation
      const x = Math.sin(timeRef.current * 2) * 5;
      const y = 0.75;
      const z = 0;

      platformRef.current.setNextKinematicTranslation({ x, y, z });
    }
  });

  return (
    <RigidBody ref={platformRef} type="kinematicPosition">
      <CuboidCollider args={[2, 0.25, 2]} />
      <mesh>
        <boxGeometry args={[4, 0.5, 4]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </RigidBody>
  );
};

// Elevator with exact floor positioning
const Elevator = () => {
  const elevatorRef = useRef<RapierRigidBody>(null);
  const [targetFloor, setTargetFloor] = useState(0);
  const currentYRef = useRef(0);

  useFrame((_state, delta) => {
    if (elevatorRef.current) {
      const targetY = targetFloor * 3; // 3m per floor
      const diff = targetY - currentYRef.current;

      if (Math.abs(diff) > 0.01) {
        currentYRef.current += Math.sign(diff) * delta * 2;
        elevatorRef.current.setNextKinematicTranslation({
          x: 0,
          y: currentYRef.current,
          z: 0,
        });
      }
    }
  });

  return (
    <RigidBody ref={elevatorRef} type="kinematicPosition">
      <CuboidCollider args={[1.5, 0.1, 1.5]} />
      <mesh>
        <boxGeometry args={[3, 0.2, 3]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </RigidBody>
  );
};
```

#### kinematicVelocity - Natural Movement

**Best for:** AI characters, patrol enemies, autonomous vehicles, smooth following objects

```tsx
// Patrolling enemy with natural movement
const PatrollingEnemy = () => {
  const enemyRef = useRef<RapierRigidBody>(null);
  const directionRef = useRef(1);
  const positionRef = useRef(0);

  useFrame((_state, delta) => {
    if (enemyRef.current) {
      positionRef.current += directionRef.current * delta * 2;

      // Smooth direction changes at boundaries
      if (positionRef.current > 5 || positionRef.current < -5) {
        directionRef.current *= -1;
      }

      // Velocity-based movement for natural feel
      const velocityX = directionRef.current * 2; // m/s
      enemyRef.current.setLinvel({ x: velocityX, y: 0, z: 0 }, true);
    }
  });

  return (
    <RigidBody ref={enemyRef} type="kinematicVelocity">
      <CapsuleCollider args={[0.5, 1]} />
      <mesh>
        <capsuleGeometry args={[0.5, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </RigidBody>
  );
};

// Following camera target with smooth acceleration
const CameraTarget = ({ targetPosition }) => {
  const targetRef = useRef<RapierRigidBody>(null);

  useFrame(() => {
    if (targetRef.current && targetPosition) {
      const currentPos = targetRef.current.translation();
      const diff = {
        x: targetPosition.x - currentPos.x,
        y: targetPosition.y - currentPos.y,
        z: targetPosition.z - currentPos.z,
      };

      // Smooth following with velocity
      const speed = 3.0;
      const velocity = {
        x: diff.x * speed,
        y: diff.y * speed,
        z: diff.z * speed,
      };

      targetRef.current.setLinvel(velocity, true);
    }
  });

  return (
    <RigidBody ref={targetRef} type="kinematicVelocity">
      <BallCollider args={[0.2]} />
      <mesh>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
    </RigidBody>
  );
};
```

#### Selection Guide

**Choose `kinematicPosition` when:**

- ✅ You need **exact positioning** (elevators, doors)
- ✅ **Scripted animations** are required
- ✅ **Frame-precise control** is important
- ✅ Objects follow **predetermined paths**

**Choose `kinematicVelocity` when:**

- ✅ **Natural acceleration/deceleration** is desired
- ✅ **AI movement** should feel organic
- ✅ Objects need **smooth direction changes**
- ✅ **Physics-like behavior** without full dynamics

#### Performance Considerations

```tsx
// ✅ Good: Reuse objects for kinematicPosition
const quaternionRef = useRef(new THREE.Quaternion());
const eulerRef = useRef(new THREE.Euler());

useFrame((_state, delta) => {
  angleRef.current += delta * rotationSpeed;
  eulerRef.current.set(0, angleRef.current, 0);
  quaternionRef.current.setFromEuler(eulerRef.current);
  rigidBodyRef.current?.setNextKinematicRotation(quaternionRef.current);
});

// ✅ Good: Smooth velocity interpolation for kinematicVelocity
const targetVelocityRef = useRef({ x: 0, y: 0, z: 0 });
const currentVelocityRef = useRef({ x: 0, y: 0, z: 0 });

useFrame((_state, delta) => {
  // Smooth velocity interpolation
  const lerpFactor = 1 - Math.exp(-5 * delta);
  currentVelocityRef.current.x += (targetVelocityRef.current.x - currentVelocityRef.current.x) * lerpFactor;
  currentVelocityRef.current.z += (targetVelocityRef.current.z - currentVelocityRef.current.z) * lerpFactor;

  rigidBodyRef.current?.setLinvel(currentVelocityRef.current, true);
});
```

### 2.4 Collider Properties (Manual Colliders)

**Rule:**  
Understanding Collider properties is essential when using manual collider placement (`colliders={false}`).

**Note:** Most ColliderOptions properties are optional. When undefined, Rapier uses these defaults:

- `density`: `1.0` (kg/m³)
- `friction`: `0.5`
- `restitution`: `0.0`
- `sensor`: `false`
- `position`/`rotation`: `[0, 0, 0]` (no offset from RigidBody)

**Essential Properties:**

| Property                 | Type                                       | Description                                                               | Use Case                          |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------- |
| `args`                   | `Array<number>`                            | Shape dimensions (Required)                                               | [width, height] for cuboid        |
| `position`               | `[number, number, number]`                 | Position relative to RigidBody (default: `[0, 0, 0]`)                     | Offset colliders from body center |
| `rotation`               | `[number, number, number]` \| `Quaternion` | Rotation relative to RigidBody (default: `[0, 0, 0]`)                     | Tilted colliders                  |
| `density`                | `number`                                   | Material density (default: `1.0` kg/m³)                                   | Heavy/light materials             |
| `friction`               | `number`                                   | Surface friction coefficient (default: `0.5`)                             | Slippery ice, sticky surfaces     |
| `restitution`            | `number`                                   | Bounciness (default: `0.0`, range: 0-1)                                   | Bouncy balls, dead drops          |
| `frictionCombineRule`    | `CoefficientCombineRule`                   | How friction combines with others                                         | Custom friction behavior          |
| `restitutionCombineRule` | `CoefficientCombineRule`                   | How restitution combines                                                  | Custom bounce behavior            |
| `collisionGroups`        | `InteractionGroups`                        | What groups this collider belongs to                                      | Collision filtering               |
| `solverGroups`           | `InteractionGroups`                        | What groups this collider solves with                                     | Physics solver filtering          |
| `sensor`                 | `boolean`                                  | Is this a trigger/sensor (default: `false`)                               | Trigger zones, collectibles       |
| `contactSkin`            | `number`                                   | Contact skin thickness                                                    | Performance vs accuracy           |
| `mass`                   | `number`                                   | Explicit mass override (auto-calculated from density×volume if undefined) | Override density calculations     |

**Sensor Events:** Sensor colliders (`sensor={true}`) provide intersection events from `@react-three/rapier`:

- `onIntersectionEnter`: When another collider starts touching this sensor
- `onIntersectionExit`: When another collider stops touching this sensor
- **Note**: These events fire for collider-to-collider interactions, not RigidBody-to-RigidBody
- The `target` parameter in the event refers to the **other collider**, not the RigidBody

#### Usage Examples

```tsx
// Manual collider with custom properties
<RigidBody colliders={false} type="dynamic">
  <CuboidCollider
    args={[1, 0.5, 1]}
    position={[0, 0.5, 0]}
    density={2.0}
    friction={0.8}
    restitution={0.3}
  />
  <mesh>
    <boxGeometry args={[2, 1, 2]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>

// Sensor collider for triggers
<RigidBody colliders={false} type="fixed">
  <CuboidCollider
    args={[2, 2, 2]}
    sensor
    onIntersectionEnter={({ target }) => {
      console.log('Player entered zone!');
    }}
  />
</RigidBody>

// Compound shape with different materials
<RigidBody colliders={false} type="dynamic">
  {/* Main body - steel */}
  <CuboidCollider args={[1, 0.5, 1]} density={7.8} friction={0.6} />
  {/* Rubber bumper */}
  <CuboidCollider
    args={[1.1, 0.1, 1.1]}
    position={[0, 0.6, 0]}
    density={1.2}
    friction={0.9}
    restitution={0.7}
  />
  <mesh>...</mesh>
</RigidBody>
```

---

## 3. Performance Optimization

### 3.1 Essential Performance Rules

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

// ❌ Creates new Quaternion/Euler objects every frame (rotation example)
useFrame((_state, delta) => {
  angleRef.current += delta * 0.5;
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angleRef.current, 0));
  rigidBodyRef.current?.setNextKinematicRotation(q);
});

// ✅ Reuse Quaternion/Euler objects for rotations
const quaternionRef = useRef(new THREE.Quaternion());
const eulerRef = useRef(new THREE.Euler(0, 0, 0));

useFrame((_state, delta) => {
  angleRef.current += delta * 0.5;
  eulerRef.current.set(0, angleRef.current, 0);
  quaternionRef.current.setFromEuler(eulerRef.current);
  rigidBodyRef.current?.setNextKinematicRotation(quaternionRef.current);
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

### 3.2 Collision Groups

**Rule:**  
Use collision groups for filtering what objects can collide with each other. This improves performance by avoiding unnecessary collision checks.

```tsx
// Import the helper
import { interactionGroups } from '@react-three/rapier';

const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  BULLET: 0x0004,
  ENVIRONMENT: 0x0008,
  PICKUP: 0x0010,
} as const;

// Using raw bitmasks (manual approach)
<RigidBody
  collisionGroups={COLLISION_GROUPS.BULLET}
  solverGroups={COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.ENVIRONMENT}
>
  <Bullet />
</RigidBody>

// Using interactionGroups helper (recommended)
<RigidBody
  collisionGroups={interactionGroups(2, [0, 1, 3])} // Group 2, collides with groups 0,1,3
  solverGroups={interactionGroups(2, [0, 1, 3])}
>
  <Enemy />
</RigidBody>

// Common patterns
const PlayerRigidBody = () => (
  <RigidBody
    collisionGroups={interactionGroups(0, [1, 3])} // Player group 0, collides with enemies(1) and environment(3)
  >
    <Player />
  </RigidBody>
);

const BulletRigidBody = () => (
  <RigidBody
    collisionGroups={interactionGroups(2, [1, 3])} // Bullet group 2, collides with enemies(1) and environment(3)
  >
    <Bullet />
  </RigidBody>
);
```

**Performance Tip:** Always set both `collisionGroups` and `solverGroups` to the same value unless you need different behavior for collision detection vs. physics solving.

**Advanced:** You can also set collision groups at the **individual collider level**, which overrides the RigidBody's groups:

```tsx
<RigidBody collisionGroups={interactionGroups(0, [1, 2])}>
  {/* This collider inherits RigidBody's groups */}
  <CuboidCollider args={[1, 1, 1]} />

  {/* This collider has its own groups */}
  <CuboidCollider args={[0.5, 0.5, 0.5]} collisionGroups={interactionGroups(3, [4])} solverGroups={interactionGroups(3, [4])} />
</RigidBody>
```

### 3.3 Object Pooling

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

## 4. Force Application

### 4.1 Method Selection

**Rule:**  
Choose the right method based on your needs. All force/impulse methods require the body to be dynamic.

| Method         | Effect                  | Use Case             | Units                |
| -------------- | ----------------------- | -------------------- | -------------------- |
| `applyImpulse` | Instant velocity change | Jumping, explosions  | N⋅s (Newton-seconds) |
| `addForce`     | Continuous acceleration | Thrusters, wind      | N (Newtons)          |
| `setLinvel`    | Direct velocity setting | Teleportation, reset | m/s                  |

```tsx
const rigidBodyRef = useRef();

// Jump (impulse) - affects velocity immediately
const jump = () => {
  rigidBodyRef.current?.applyImpulse({ x: 0, y: 10, z: 0 }, true);
};

// Continuous thrust (force) - affects acceleration over time
useFrame(() => {
  if (thrusterActive) {
    rigidBodyRef.current?.addForce({ x: 0, y: 0, z: -5 }, true);
  }
});

// Direct movement (velocity) - for precise control
const move = (velocity) => {
  rigidBodyRef.current?.setLinvel(velocity, true);
};

// Reset forces at end of frame if needed
useFrame(() => {
  // Clear accumulated forces if you want frame-by-frame control
  rigidBodyRef.current?.resetForces(true);
  rigidBodyRef.current?.resetTorques(true);
});
```

**Important Notes:**

- The second parameter (`wakeUp: boolean`) ensures the body is active if it was sleeping
- Forces accumulate until the physics step, while impulses are applied immediately
- Use `resetForces()` if you want to manually control force application each frame

---

## 5. Ray Casting

### 5.1 Basic Pattern

**Rule:**  
Use raycasting for ground detection, line-of-sight checks, and hit detection. Cache the Ray object for performance.

```tsx
const { rapier, world } = useRapier();

// Cache ray object to avoid recreating every frame
const rayRef = useRef<typeof rapier.Ray>();
const hitPointRef = useRef(new THREE.Vector3());

const performRaycast = useCallback(
  (origin, direction, maxDistance, excludeCollider?) => {
    if (!rayRef.current) {
      rayRef.current = new rapier.Ray(origin, direction);
    } else {
      rayRef.current.origin = origin;
      rayRef.current.dir = direction;
    }

    const hit = world.castRay(rayRef.current, maxDistance, true, undefined, undefined, excludeCollider);

    if (hit) {
      hitPointRef.current.copy(rayRef.current.pointAt(hit.timeOfImpact));
      return {
        point: hitPointRef.current.clone(),
        collider: hit.collider,
        timeOfImpact: hit.timeOfImpact,
        normal: hit.normal,
      };
    }
    return null;
  },
  [rapier, world],
);
```

### 5.2 Practical Examples

```tsx
// Ground check for character controller
const checkGrounded = useCallback(() => {
  const character = characterRef.current;
  if (!character) return false;

  const origin = character.translation();
  const hit = world.castRay(
    new rapier.Ray(origin, { x: 0, y: -1, z: 0 }),
    1.1, // Slightly longer than character height
    true, // Solid bodies only
    undefined, // All collision groups
    undefined, // All solver groups
    character, // Exclude character's own collider
  );

  return hit && hit.timeOfImpact < 1.05; // Small tolerance
}, [world, rapier]);

// Line of sight check
const hasLineOfSight = useCallback(
  (from: THREE.Vector3, to: THREE.Vector3) => {
    const direction = new THREE.Vector3().subVectors(to, from).normalize();
    const distance = from.distanceTo(to);

    const hit = world.castRay(
      new rapier.Ray(from, direction),
      distance,
      true,
      COLLISION_GROUPS.ENVIRONMENT, // Only check against walls
    );

    return !hit; // No hit means clear line of sight
  },
  [world],
);

// Mouse picking with physics
const handleMouseClick = useCallback(
  (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const ray = new rapier.Ray(raycaster.ray.origin, raycaster.ray.direction);

    const hit = world.castRay(ray, 1000, true);
    if (hit) {
      // Apply force at hit point
      const hitBody = hit.collider.parent();
      hitBody?.applyImpulseAtPoint({ x: 0, y: 5, z: 0 }, ray.pointAt(hit.timeOfImpact), true);
    }
  },
  [world, rapier],
);
```

**Performance Tips:**

- Reuse Ray objects instead of creating new ones each frame
- Use collision groups to limit what the ray can hit
- Cache raycast results when possible
- Avoid raycasting every frame for non-critical checks

---

## 6. Memory Management

### 6.1 Cleanup Pattern

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

### 6.2 Safe Operations

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

## 7. Performance Checklist

### 7.1 Essential Optimizations

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

### 7.2 Common Performance Pitfalls

1. **Creating objects in loops**: Cache and reuse Vector3, Quaternion, etc.
2. **React state in useFrame**: Use refs for high-frequency updates
3. **Unnecessary re-renders**: Avoid setState in animation loops
4. **Memory leaks**: Clean up timers and references
5. **Collision overhead**: Use appropriate collision groups

---

> **Note:**  
> This guide focuses on essential patterns for production R3F + Rapier applications with emphasis on performance and maintainability.
