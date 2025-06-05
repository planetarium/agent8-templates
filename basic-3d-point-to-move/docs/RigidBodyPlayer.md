# RigidBodyPlayer

`RigidBodyPlayer` is a **player-specific physics component** provided by Vibe Starter 3D. Built on top of `RigidBodyObject`, it offers specialized features for player characters and serves as the **automatic detection target for controller systems**.

## Overview

`RigidBodyPlayer` is a specialized component designed for player character physics simulation and controller integration. It provides comprehensive functionality including automatic collider generation, physics initialization, and other essential features required for player characters.

## ⚠️ Critical Architecture Understanding

### **Controllers ≠ Player Objects**

**Controllers do not own player objects - Controllers are control systems**

1. **Controllers are Independent**: Controller components (`FreeViewController`, `FirstPersonViewController`, etc.) are standalone control systems that do not create or own any player objects
2. **RigidBodyPlayer is the Actual Player**: The `RigidBodyPlayer` component represents the actual player character in the physics world
3. **Automatic Detection and Control**: Controllers automatically scan the scene to find the `RigidBodyPlayer` component and control it remotely
4. **Single Player Requirement**: Controllers require **exactly one** `RigidBodyPlayer` in the scene to function properly - multiple instances will cause conflicts
5. **Separation of Concerns**: Controllers handle input and camera logic, while `RigidBodyPlayer` manages physics and character representation

## Key Features

### Player-Specific Functionality

- **Automatic CapsuleCollider Generation**: Automatically generates appropriately sized capsule colliders based on character height
- **Controller Detection Target**: The target that all controller components automatically detect and control
- **bottomY Property**: Additional property for easy access to the player's bottom Y coordinate

### Physics System Integration

- **CharacterUtils Integration**: Automatic collider calculation based on character proportions
- **Physics Initialization**: Automatic initialization process for stable physics simulation
- **Collision Events**: Detection of all interactions between player and other objects

### Controller Integration

- **Automatic Registration**: Automatically registers with the controller store for controller access
- **Remote Control**: Provides interface for controllers to remotely control the player

## Interface

### RigidBodyPlayerProps

```typescript
interface RigidBodyPlayerProps extends RigidBodyObjectProps {
  targetHeight?: number;
  autoCreateCollider?: boolean;
  offsetY?: number;
}
```

| Property             | Type       | Description                                               | Default Value      |
| -------------------- | ---------- | --------------------------------------------------------- | ------------------ |
| `targetHeight`       | `number`   | Height of the character to be controlled (in meters)      | `1.6`              |
| `autoCreateCollider` | `boolean`  | Whether to automatically create a default CapsuleCollider | `true`             |
| `offsetY`            | `number`   | Vertical offset for the children group (in meters)        | `targetHeight / 2` |
| `onTriggerEnter`     | `function` | Callback called when player collision starts              | Optional           |
| `onTriggerExit`      | `function` | Callback called when player collision ends                | Optional           |

**Note**: This interface extends `RigidBodyObjectProps`, so all `RigidBodyObject` properties are available.

### RigidBodyPlayerRef

```typescript
interface RigidBodyPlayerRef extends RigidBodyObjectRef {
  readonly bottomY: number;
}
```

`RigidBodyPlayerRef` provides all `RapierRigidBody` functionality plus an additional `bottomY` property.

| Property  | Type     | Description                              |
| --------- | -------- | ---------------------------------------- |
| `bottomY` | `number` | Player's bottom Y coordinate (read-only) |

## Usage

### Basic Usage

```tsx
import { RigidBodyPlayer, FreeViewController, CharacterRenderer } from 'vibe-starter-3d';

function GameScene() {
  return (
    <>
      {/* Controller automatically finds and controls the RigidBodyPlayer below */}
      <FreeViewController />

      {/* Important: Only one RigidBodyPlayer per scene - this is what the controller will control */}
      <RigidBodyPlayer targetHeight={1.6} position={[0, 0, 0]}>
        <CharacterRenderer url="/models/player-character.vrm" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
      </RigidBodyPlayer>
    </>
  );
}
```

### Real Example: freeview Player

Complete player implementation from the freeview example:

```tsx
import { useRef } from 'react';
import { RigidBodyPlayer, RigidBodyPlayerRef, CharacterRenderer } from 'vibe-starter-3d';
import { CollisionPayload } from '@react-three/rapier';

const targetHeight = 1.6;

function Player({ position }) {
  const rigidBodyPlayerRef = useRef<RigidBodyPlayerRef>(null);

  const handleTriggerEnter = (payload: CollisionPayload) => {
    if (payload.other.rigidBody?.userData?.['type']) {
      // Handle collision with other objects (item collection, area entry, etc.)
    }
  };

  const handleTriggerExit = (payload: CollisionPayload) => {
    if (payload.other.rigidBody?.userData?.['type']) {
      // Handle collision end (area exit, etc.)
    }
  };

  return (
    <RigidBodyPlayer
      ref={rigidBodyPlayerRef}
      userData={{ type: 'LOCAL_PLAYER' }}
      position={position}
      targetHeight={targetHeight}
      onTriggerEnter={handleTriggerEnter}
      onTriggerExit={handleTriggerExit}
    >
      <CharacterRenderer
        url="/models/character.vrm"
        animationConfigMap={animationConfigMap}
        currentAnimationRef={currentStateRef}
        targetHeight={targetHeight}
        onAnimationComplete={handleAnimationComplete}
      />
    </RigidBodyPlayer>
  );
}
```

### Advanced Usage: Player Interacting with Items

```tsx
import { RigidBodyObject, RigidBodyPlayer } from 'vibe-starter-3d';
import { CuboidCollider } from '@react-three/rapier';
import { useState } from 'react';

function InteractiveWorld() {
  const [score, setScore] = useState(0);

  // Handle item collection
  const handlePlayerTriggerEnter = (payload) => {
    const otherType = payload.other.rigidBody?.userData?.type;

    if (otherType === 'ITEM') {
      const itemValue = payload.other.rigidBody?.userData?.value || 10;
      setScore((prev) => prev + itemValue);
      console.log(`Item collected! Score: ${score + itemValue}`);
    }

    if (otherType === 'ENEMY') {
      console.log('Enemy collision! Handle damage');
    }
  };

  return (
    <>
      {/* Controller */}
      <FreeViewController />

      {/* Player */}
      <RigidBodyPlayer targetHeight={1.8} userData={{ type: 'LOCAL_PLAYER', health: 100 }} onTriggerEnter={handlePlayerTriggerEnter}>
        <CharacterRenderer url="/models/player.vrm" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
      </RigidBodyPlayer>

      {/* Collectible item */}
      <RigidBodyObject type="fixed" userData={{ type: 'ITEM', value: 50 }} position={[5, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.5]} />
          <meshStandardMaterial color="gold" />
        </mesh>
        <CuboidCollider args={[0.6, 0.6, 0.6]} sensor />
      </RigidBodyObject>

      {/* Enemy object */}
      <RigidBodyObject type="dynamic" userData={{ type: 'ENEMY', damage: 25 }} position={[-5, 0, 0]}>
        <mesh>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <CuboidCollider args={[0.5, 1, 0.5]} />
      </RigidBodyObject>
    </>
  );
}
```

### Multiplayer Scenario: Local Player vs Remote Players

```tsx
import { RigidBodyPlayer, RigidBodyObject } from 'vibe-starter-3d';

function MultiPlayerScene() {
  const handleLocalPlayerTrigger = (payload) => {
    const otherType = payload.other.rigidBody?.userData?.type;
    const otherPlayerId = payload.other.rigidBody?.userData?.playerId;

    if (otherType === 'REMOTE_PLAYER') {
      console.log(`Met player ${otherPlayerId}!`);
      // Multiplayer interaction logic
    }
  };

  return (
    <>
      {/* Controller only controls LOCAL_PLAYER */}
      <FreeViewController />

      {/* Local player (controlled by controller) */}
      <RigidBodyPlayer userData={{ type: 'LOCAL_PLAYER', playerId: 'player1' }} onTriggerEnter={handleLocalPlayerTrigger}>
        <CharacterRenderer url="/models/local-player.vrm" animationConfigMap={localAnimationConfig} currentAnimationRef={localAnimationRef} />
      </RigidBodyPlayer>

      {/* Remote players (network controlled, use RigidBodyObject) */}
      <RigidBodyObject type="kinematicPosition" userData={{ type: 'REMOTE_PLAYER', playerId: 'player2' }}>
        <CharacterRenderer url="/models/remote-player.vrm" animationConfigMap={remoteAnimationConfig} currentAnimationRef={remoteAnimationRef} />
      </RigidBodyObject>

      <RigidBodyObject type="kinematicPosition" userData={{ type: 'REMOTE_PLAYER', playerId: 'player3' }}>
        <CharacterRenderer url="/models/remote-player.vrm" animationConfigMap={remoteAnimationConfig} currentAnimationRef={remoteAnimationRef} />
      </RigidBodyObject>
    </>
  );
}
```

## Direct Player Control via Ref

```tsx
import { RigidBodyPlayer, RigidBodyPlayerRef } from 'vibe-starter-3d';
import { useRef, useEffect } from 'react';

function ControlledPlayer() {
  const playerRef = useRef<RigidBodyPlayerRef>(null);

  useEffect(() => {
    if (!playerRef.current) return;

    // All RapierRigidBody methods are available
    const position = playerRef.current.translation();
    const velocity = playerRef.current.linvel();

    // Use additional bottomY property
    const groundLevel = playerRef.current.bottomY;

    // Teleport player
    playerRef.current.setTranslation({ x: 0, y: 5, z: 0 }, true);

    // Implement jump
    const jumpForce = { x: 0, y: 10, z: 0 };
    playerRef.current.setLinvel(jumpForce, true);

    console.log('Player position:', position);
    console.log('Player velocity:', velocity);
    console.log('Ground level:', groundLevel);
  }, []);

  // Manipulate player under specific conditions
  const handleSpecialAction = () => {
    if (playerRef.current) {
      // Launch player upward
      playerRef.current.setLinvel({ x: 0, y: 15, z: 0 }, true);

      // Adjust gravity scale
      playerRef.current.setGravityScale(0.5, true);

      // Normalize after 3 seconds
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.setGravityScale(1.0, true);
        }
      }, 3000);
    }
  };

  return (
    <RigidBodyPlayer ref={playerRef} targetHeight={1.8} userData={{ type: 'LOCAL_PLAYER' }}>
      <CharacterRenderer url="/models/player.vrm" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />

      {/* Special action trigger */}
      <mesh onClick={handleSpecialAction}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
    </RigidBodyPlayer>
  );
}
```

## Automatic Collider System

`RigidBodyPlayer` uses `CharacterUtils` to automatically generate appropriately sized capsule colliders based on character height.

### Automatic Generation (Default)

```tsx
{
  /* When autoCreateCollider is true (default) */
}
<RigidBodyPlayer targetHeight={1.8}>
  {/* CapsuleCollider is automatically generated */}
  <CharacterRenderer url="/models/player.vrm" />
</RigidBodyPlayer>;
```

### Manual Collider Setup

```tsx
import { CapsuleCollider } from '@react-three/rapier';
import { CharacterUtils } from 'vibe-starter-3d';

{
  /* Manual collider setup */
}
<RigidBodyPlayer targetHeight={2.0} autoCreateCollider={false}>
  {/* Custom collider */}
  <CapsuleCollider args={[CharacterUtils.capsuleHalfHeight(2.0), CharacterUtils.capsuleRadius(2.0)]} />
  <CharacterRenderer url="/models/tall-player.vrm" />
</RigidBodyPlayer>;
```

## CharacterUtils Integration

`RigidBodyPlayer` internally uses `CharacterUtils` to calculate appropriate collider sizes:

```typescript
// Automatically calculated values
const height = 1.8;
const radius = CharacterUtils.capsuleRadius(height); // 0.36
const halfHeight = CharacterUtils.capsuleHalfHeight(height); // 0.54
```

## Controller Integration

### Supported Controllers

All controllers automatically detect and control `RigidBodyPlayer`:

- `FreeViewController`: Free view control
- `FirstPersonViewController`: First-person view control
- `QuarterViewController`: Quarter view control
- `SideViewController`: Side view control
- `SimulationViewController`: Simulation view control
- `FlightViewController`: Flight control
- `PointToMoveController`: Point-to-move control

### Controller Switching

```tsx
import { useState } from 'react';
import { RigidBodyPlayer, FreeViewController, FirstPersonViewController, QuarterViewController } from 'vibe-starter-3d';

function AdaptivePlayerScene() {
  const [controllerType, setControllerType] = useState('free');

  const renderController = () => {
    switch (controllerType) {
      case 'free':
        return <FreeViewController />;
      case 'firstPerson':
        return <FirstPersonViewController />;
      case 'quarter':
        return <QuarterViewController />;
      default:
        return <FreeViewController />;
    }
  };

  return (
    <>
      {/* Controller type changes but controls the same RigidBodyPlayer */}
      {renderController()}

      {/* Player remains unchanged */}
      <RigidBodyPlayer targetHeight={1.7}>
        <CharacterRenderer url="/models/player.vrm" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
      </RigidBodyPlayer>

      {/* UI for controller switching */}
      <div className="controller-selector">
        <button onClick={() => setControllerType('free')}>Free View</button>
        <button onClick={() => setControllerType('firstPerson')}>First Person</button>
        <button onClick={() => setControllerType('quarter')}>Quarter View</button>
      </div>
    </>
  );
}
```

## Best Practices

### 1. One RigidBodyPlayer per Scene

```tsx
// ✅ Correct usage: One RigidBodyPlayer
function CorrectScene() {
  return (
    <>
      <FreeViewController />
      <RigidBodyPlayer>
        <CharacterRenderer url="/player.glb" />
      </RigidBodyPlayer>

      {/* Use RigidBodyObject for NPCs */}
      <RigidBodyObject>
        <CharacterRenderer url="/npc.glb" />
      </RigidBodyObject>
    </>
  );
}

// ❌ Wrong usage: Multiple RigidBodyPlayers
function WrongScene() {
  return (
    <>
      <FreeViewController />
      {/* Controller doesn't know which player to control! */}
      <RigidBodyPlayer>
        <CharacterRenderer url="/player1.glb" />
      </RigidBodyPlayer>
      <RigidBodyPlayer>
        <CharacterRenderer url="/player2.glb" />
      </RigidBodyPlayer>
    </>
  );
}
```

### 2. Player Identification via userData

```tsx
<RigidBodyPlayer
  userData={{
    type: 'LOCAL_PLAYER',
    playerId: 'user123',
    health: 100,
    level: 15,
  }}
>
  <CharacterRenderer url="/models/player.glb" />
</RigidBodyPlayer>
```

### 3. Appropriate targetHeight Setting

```tsx
// Various character sizes
<RigidBodyPlayer targetHeight={1.6}>  {/* Normal adult */}
<RigidBodyPlayer targetHeight={1.2}>  {/* Child character */}
<RigidBodyPlayer targetHeight={2.2}>  {/* Large character */}
```

### 4. Collision Event Optimization

```tsx
const handlePlayerTriggerEnter = useCallback((payload) => {
  const otherType = payload.other.rigidBody?.userData?.type;

  // Fast type-based branching
  switch (otherType) {
    case 'ITEM':
      handleItemPickup(payload);
      break;
    case 'ENEMY':
      handleCombat(payload);
      break;
    case 'NPC':
      handleNPCInteraction(payload);
      break;
    default:
      // Ignore unknown types
      break;
  }
}, []);
```

## Differences from RigidBodyObject

| Feature                | RigidBodyPlayer            | RigidBodyObject         |
| ---------------------- | -------------------------- | ----------------------- |
| Purpose                | Player-specific            | General physics objects |
| Auto Collider Creation | ✅ (CapsuleCollider)       | ❌                      |
| Controller Target      | ✅ (auto detect & control) | ❌                      |
| bottomY Property       | ✅                         | ❌                      |
| Multiple Instances     | ❌ (one per scene)         | ✅                      |

## Precautions

1. **Single Instance**: There must be **exactly one RigidBodyPlayer** per scene. Multiple instances will cause controller conflicts.

2. **Use RigidBodyObject for NPCs**: Use `RigidBodyObject` for non-player characters (NPCs, enemies, remote players, etc.).

3. **targetHeight Consistency**: Set the same `targetHeight` for both `CharacterRenderer` and `RigidBodyPlayer`.

4. **Controller Dependency**: While `RigidBodyPlayer` can work without controllers, it should be used with controllers in actual games.

5. **Performance Considerations**: Avoid unnecessary collision event handling and only set collision groups when needed.

## Migration Guide

How to migrate from existing `RigidBodyObject` to `RigidBodyPlayer`:

### Existing Code

```tsx
<RigidBodyObject type="dynamic" position={[0, 0, 0]}>
  <CapsuleCollider args={[0.8, 0.3]} />
  <CharacterRenderer url="/models/player.glb" targetHeight={1.6} />
</RigidBodyObject>
```

### After Migration

```tsx
<RigidBodyPlayer type="dynamic" position={[0, 0, 0]} targetHeight={1.6}>
  {/* CapsuleCollider is automatically generated */}
  <CharacterRenderer url="/models/player.glb" targetHeight={1.6} />
</RigidBodyPlayer>
```

## Advanced Use Case

### Checkpoint System

```tsx
import { RigidBodyPlayer, RigidBodyObject, FollowLight } from 'vibe-starter-3d';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useState, useRef } from 'react';

function CheckpointSystem() {
  const [currentCheckpoint, setCurrentCheckpoint] = useState([0, 0, 0]);
  const playerRef = useRef<RigidBodyPlayerRef>(null);

  const handleCheckpointReached = (payload) => {
    const checkpointId = payload.other.rigidBody?.userData?.checkpointId;
    const checkpointPosition = payload.other.rigidBody?.translation();

    setCurrentCheckpoint([checkpointPosition.x, checkpointPosition.y, checkpointPosition.z]);
    console.log(`Checkpoint ${checkpointId} reached!`);
  };

  const respawnAtCheckpoint = () => {
    if (playerRef.current) {
      playerRef.current.setTranslation(
        {
          x: currentCheckpoint[0],
          y: currentCheckpoint[1] + 2,
          z: currentCheckpoint[2],
        },
        true,
      );
    }
  };

  return (
    <div className="w-full h-screen">
      {/* UI outside Canvas */}
      <div className="absolute top-4 left-4 z-10">
        <button onClick={respawnAtCheckpoint} className="bg-blue-500 text-white px-4 py-2 rounded">
          Return to Checkpoint
        </button>
      </div>

      {/* Canvas interior - 3D content only */}
      <Canvas>
        <Physics>
          {/* Light that follows the player */}
          <FollowLight />

          <FreeViewController />

          <RigidBodyPlayer ref={playerRef} onTriggerEnter={handleCheckpointReached} userData={{ type: 'LOCAL_PLAYER' }}>
            <CharacterRenderer url="/models/player.vrm" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
          </RigidBodyPlayer>

          {/* Checkpoints */}
          <RigidBodyObject type="fixed" position={[10, 0, 0]} userData={{ type: 'CHECKPOINT', checkpointId: 1 }}>
            <mesh>
              <cylinderGeometry args={[1, 1, 0.2]} />
              <meshStandardMaterial color="green" />
            </mesh>
            <CuboidCollider args={[1, 0.1, 1]} sensor />
          </RigidBodyObject>

          <RigidBodyObject type="fixed" position={[20, 0, 10]} userData={{ type: 'CHECKPOINT', checkpointId: 2 }}>
            <mesh>
              <cylinderGeometry args={[1, 1, 0.2]} />
              <meshStandardMaterial color="green" />
            </mesh>
            <CuboidCollider args={[1, 0.1, 1]} sensor />
          </RigidBodyObject>

          {/* Floor */}
          <RigidBodyObject type="fixed">
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#gray" />
            </mesh>
          </RigidBodyObject>
        </Physics>
      </Canvas>
    </div>
  );
}
```

Now you can build a complete player character system using the powerful features of `RigidBodyPlayer`!
