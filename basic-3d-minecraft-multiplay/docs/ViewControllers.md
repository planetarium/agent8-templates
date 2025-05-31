# ViewControllers

**ViewControllers** are **independent input and camera management systems** provided by Vibe Starter 3D. These are components that automatically detect and remotely control `RigidBodyPlayer` in the scene.

## Overview

ViewControllers provide various perspectives and input methods to enable flexible character control in 3D games and simulations. All controllers follow the **Controller-Player Separation** architecture.

## ⚠️ Understanding Core Architecture

### **Controller ≠ Player Object**

**Controllers do not own player objects - controllers are control systems**

1. **Controllers are Independent**: All controller components are independent control systems that do not create or own player objects
2. **RigidBodyPlayer is the Actual Player**: The `RigidBodyPlayer` component represents the actual player character in the physics world
3. **Automatic Detection and Control**: Controllers scan the scene to find `RigidBodyPlayer` components and control them remotely
4. **Position Independence**: `RigidBodyPlayer` can be located anywhere within Canvas, and controllers automatically detect it
5. **Single Player Requirement**: There must be **exactly one** `RigidBodyPlayer` in the scene; multiple instances cause conflicts
6. **Separation of Concerns**: Controllers handle input and camera logic, while `RigidBodyPlayer` manages physics and character representation

### **Flexible Scene Composition**

Thanks to the controller's automatic detection system, all of the following configurations are possible:

```tsx
// ✅ Same level placement
function SameLevelExample() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController />
        <RigidBodyPlayer>
          <CharacterRenderer url="/models/character.glb" />
        </RigidBodyPlayer>
      </Physics>
    </Canvas>
  );
}

// ✅ Different group placement
function DifferentGroupExample() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController />

        <group name="objects">{/* Other object components */}</group>

        <group name="world">
          <RigidBodyPlayer>
            <CharacterRenderer url="/models/character.glb" />
          </RigidBodyPlayer>
          {/* Other world objects */}
        </group>
      </Physics>
    </Canvas>
  );
}

// ✅ Nested structure placement
function NestedExample() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController />

        <group name="game-world">
          <group name="level-1">
            <group name="players">
              <RigidBodyPlayer>
                <CharacterRenderer url="/models/character.glb" />
              </RigidBodyPlayer>
            </group>
          </group>
        </group>
      </Physics>
    </Canvas>
  );
}
```

## Controller Types Overview

| Controller                  | Description                           | Primary Use Cases                |
| --------------------------- | ------------------------------------- | -------------------------------- |
| `FreeViewController`        | Free third-person perspective control | General 3D games                 |
| `FirstPersonViewController` | First-person perspective control      | FPS games                        |
| `QuarterViewController`     | Quarter view perspective control      | Strategy games, MOBA             |
| `SideViewController`        | Side view perspective control         | 2.5D platformer games            |
| `SimulationViewController`  | Simulation view (with edge scrolling) | Simulation, RTS games            |
| `FlightViewController`      | Flight perspective control            | Aviation simulation, space games |
| `PointToMoveController`     | Point and click movement control      | RTS, strategy games              |

## Common Interface: ControllerProps

Basic properties inherited by most controllers.

```typescript
interface ControllerProps {
  camInitDis?: number; // Initial camera distance
  camMinDis?: number; // Minimum zoom-in distance
  camMaxDis?: number; // Maximum zoom-out distance
  floatHeight?: number; // Height from ground (m)
  followCameraForward?: boolean; // Follow camera direction
}
```

| Property              | Type      | Description                        | Default |
| --------------------- | --------- | ---------------------------------- | ------- |
| `camInitDis`          | `number`  | Initial camera distance            | `-4`    |
| `camMinDis`           | `number`  | Minimum camera zoom-in distance    | `-4`    |
| `camMaxDis`           | `number`  | Maximum camera zoom-out distance   | `-4`    |
| `floatHeight`         | `number`  | Height above ground (m)            | `0.01`  |
| `followCameraForward` | `boolean` | Whether to follow camera direction | `false` |

## Individual Controller Detailed Description

### 1. FreeViewController

**Free third-person perspective controller**, the most common camera system used in general 3D games.

#### Usage

```tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { FreeViewController, RigidBodyPlayer, CharacterRenderer } from 'vibe-starter-3d';

function FreeViewScene() {
  return (
    <Canvas
      shadows
      onPointerDown={(e) => {
        (e.target as HTMLCanvasElement).requestPointerLock();
      }}
    >
      <Physics>
        {/* Controller - automatically finds and controls RigidBodyPlayer */}
        <FreeViewController />

        {/* Player - target to be controlled by the controller */}
        <RigidBodyPlayer targetHeight={1.6}>
          <CharacterRenderer url="/models/character.glb" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
        </RigidBodyPlayer>

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      </Physics>
    </Canvas>
  );
}
```

### 2. FirstPersonViewController

**First-person perspective controller**, the camera system suitable for FPS games.

#### Usage

```tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { FirstPersonViewController, RigidBodyPlayer, CharacterRenderer } from 'vibe-starter-3d';

function FirstPersonScene() {
  return (
    <Canvas
      shadows
      onPointerDown={(e) => {
        (e.target as HTMLCanvasElement).requestPointerLock();
      }}
    >
      <Physics>
        {/* Controller - automatically finds and controls RigidBodyPlayer */}
        <FirstPersonViewController />

        {/* Player - target to be controlled by the controller */}
        <RigidBodyPlayer targetHeight={1.8}>
          <CharacterRenderer url="/models/fps-character.glb" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
        </RigidBodyPlayer>

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      </Physics>
    </Canvas>
  );
}
```

### 3. QuarterViewController

**Quarter view perspective controller**, suitable for strategy games or MOBA games.

#### QuarterViewControllerProps

```typescript
interface QuarterViewControllerProps extends ControllerProps {
  followCharacter?: boolean; // Follow character
  inputMode?: 'keyboard' | 'pointToMove'; // Input mode
  cameraMode?: 'perspective' | 'orthographic'; // Camera mode
}
```

| Property          | Type                                | Description      | Default         |
| ----------------- | ----------------------------------- | ---------------- | --------------- |
| `followCharacter` | `boolean`                           | Follow character | `false`         |
| `inputMode`       | `'keyboard'` \| `'pointToMove'`     | Input mode       | `'pointToMove'` |
| `cameraMode`      | `'perspective'` \| `'orthographic'` | Camera mode      | `'perspective'` |

#### Usage

```tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { QuarterViewController, RigidBodyPlayer, CharacterRenderer } from 'vibe-starter-3d';

function QuarterViewScene() {
  return (
    <Canvas shadows>
      <Physics>
        {/* Controller - automatically finds and controls RigidBodyPlayer */}
        <QuarterViewController />

        {/* Player - target to be controlled by the controller */}
        <RigidBodyPlayer targetHeight={1.6}>
          <CharacterRenderer url="/models/strategy-character.glb" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
        </RigidBodyPlayer>

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      </Physics>
    </Canvas>
  );
}
```

### 4. SideViewController

**Side view perspective controller**, suitable for 2.5D platformer games.

#### SideViewControllerProps

```typescript
interface SideViewControllerProps extends ControllerProps {
  cameraMode?: 'perspective' | 'orthographic'; // Camera mode
}
```

| Property     | Type                                | Description | Default          |
| ------------ | ----------------------------------- | ----------- | ---------------- |
| `cameraMode` | `'perspective'` \| `'orthographic'` | Camera mode | `'orthographic'` |

#### Usage

```tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { SideViewController, RigidBodyPlayer, CharacterRenderer } from 'vibe-starter-3d';

function SideViewScene() {
  return (
    <Canvas shadows>
      <Physics>
        {/* Controller - automatically finds and controls RigidBodyPlayer */}
        <SideViewController cameraMode="orthographic" camInitDis={-6} floatHeight={0} />

        {/* Player - target to be controlled by the controller */}
        <RigidBodyPlayer targetHeight={1.6}>
          <CharacterRenderer url="/models/platformer-character.glb" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
        </RigidBodyPlayer>

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      </Physics>
    </Canvas>
  );
}
```

### 5. SimulationViewController

**Simulation view controller**, providing edge scrolling and smooth camera control.

#### SimulationViewControllerProps

```typescript
interface SimulationViewControllerProps extends ControllerProps {
  cameraMode?: 'perspective' | 'orthographic'; // Camera mode
}
```

| Property     | Type                                | Description | Default         |
| ------------ | ----------------------------------- | ----------- | --------------- |
| `cameraMode` | `'perspective'` \| `'orthographic'` | Camera mode | `'perspective'` |

#### Usage

```tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { SimulationViewController, RigidBodyPlayer, CharacterRenderer } from 'vibe-starter-3d';

function SimulationScene() {
  return (
    <Canvas shadows>
      <Physics>
        {/* Controller - automatically finds and controls RigidBodyPlayer */}
        <SimulationViewController />

        {/* Player - target to be controlled by the controller */}
        <RigidBodyPlayer targetHeight={1.6}>
          <CharacterRenderer url="/models/sim-character.glb" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
        </RigidBodyPlayer>

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      </Physics>
    </Canvas>
  );
}
```

### 6. FlightViewController

**Flight perspective controller**, suitable for aviation simulation or space games.

#### FlightViewControllerProps

```typescript
interface FlightViewControllerProps {
  minSpeed?: number; // Minimum flight speed
  maxSpeed?: number; // Maximum flight speed
  speedIncreasePerSecond?: number; // Speed increase per second
  speedDecreasePerSecond?: number; // Speed decrease per second
  pitchRotationSpeed?: number; // Pitch rotation speed
  rollRotationSpeed?: number; // Roll rotation speed
  directionRotationAcceleration?: number; // Direction rotation acceleration
  maxRollAngle?: number; // Maximum roll angle
  maxPitchAngle?: number; // Maximum pitch angle
  cameraOffset?: Vector3; // Camera offset position
  onSpeedChange?: (speed: number) => void; // Speed change callback
}
```

| Property                        | Type                      | Description                     | Default       |
| ------------------------------- | ------------------------- | ------------------------------- | ------------- |
| `minSpeed`                      | `number`                  | Minimum flight speed (m/s)      | `0`           |
| `maxSpeed`                      | `number`                  | Maximum flight speed (m/s)      | `120`         |
| `speedIncreasePerSecond`        | `number`                  | Speed increase per second       | `20`          |
| `speedDecreasePerSecond`        | `number`                  | Speed decrease per second       | `80`          |
| `pitchRotationSpeed`            | `number`                  | Pitch rotation speed            | `0.5`         |
| `rollRotationSpeed`             | `number`                  | Roll rotation speed             | `Math.PI`     |
| `directionRotationAcceleration` | `number`                  | Direction rotation acceleration | `0.3`         |
| `maxRollAngle`                  | `number`                  | Maximum roll angle              | `Math.PI / 2` |
| `maxPitchAngle`                 | `number`                  | Maximum pitch angle             | `Math.PI / 2` |
| `cameraOffset`                  | `Vector3`                 | Camera offset position          | `[0, 3, 15]`  |
| `onSpeedChange`                 | `(speed: number) => void` | Speed change callback           | Optional      |

#### Usage

```tsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { FlightViewController, RigidBodyPlayer, CharacterRenderer } from 'vibe-starter-3d';

function FlightScene() {
  const [currentSpeed, setCurrentSpeed] = useState(0);

  return (
    <>
      {/* HTML UI Element - Speed Display */}
      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 100 }}>Speed: {currentSpeed.toFixed(1)} m/s</div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).requestPointerLock();
        }}
      >
        <Physics>
          {/* Controller - automatically finds and controls RigidBodyPlayer */}
          <FlightViewController
            minSpeed={5}
            maxSpeed={100}
            speedIncreasePerSecond={15}
            speedDecreasePerSecond={30}
            cameraOffset={[0, 2, 12]}
            onSpeedChange={setCurrentSpeed}
          />

          {/* Player - target to be controlled by the controller */}
          <RigidBodyPlayer targetHeight={2.0}>
            <CharacterRenderer url="/models/aircraft.glb" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
          </RigidBodyPlayer>

          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        </Physics>
      </Canvas>
    </>
  );
}
```

### 7. PointToMoveController

**Point and click movement controller**, suitable for RTS or strategy games.

#### PointToMoveControllerProps

```typescript
interface PointToMoveControllerProps extends ControllerProps {
  followCharacter?: boolean; // Follow character
  cameraMode?: 'perspective' | 'orthographic'; // Camera mode
  maxVelLimit?: number; // Maximum speed limit
}
```

| Property          | Type                                | Description                       | Default         |
| ----------------- | ----------------------------------- | --------------------------------- | --------------- |
| `followCharacter` | `boolean`                           | Follow character                  | `false`         |
| `cameraMode`      | `'perspective'` \| `'orthographic'` | Camera mode                       | `'perspective'` |
| `maxVelLimit`     | `number`                            | Maximum speed limit for character | `3`             |

#### Usage

```tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { PointToMoveController, RigidBodyPlayer, CharacterRenderer } from 'vibe-starter-3d';

function PointToMoveScene() {
  return (
    <Canvas shadows>
      <Physics>
        {/* Controller - automatically finds and controls RigidBodyPlayer */}
        <PointToMoveController followCharacter={false} cameraMode="perspective" maxVelLimit={5} camInitDis={-10} />

        {/* Player - target to be controlled by the controller */}
        <RigidBodyPlayer targetHeight={1.6}>
          <CharacterRenderer url="/models/strategy-unit.glb" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
        </RigidBodyPlayer>

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      </Physics>
    </Canvas>
  );
}
```

## Real-World Usage Examples

### 1. Advanced Example: Interactive Game

```tsx
import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { FreeViewController, RigidBodyPlayer, RigidBodyObject, CharacterRenderer, useControllerState, FollowLight } from 'vibe-starter-3d';
import { CollisionPayload } from '@react-three/rapier';

function InteractiveGame() {
  const currentAnimationRef = useRef();
  const [gameState, setGameState] = useState({
    score: 0,
    health: 100,
    inSafeZone: false,
  });

  const { setEnableInput } = useControllerState();

  const animationConfig = {
    idle: { url: '/animations/idle.fbx', loop: true },
    run: { url: '/animations/run.fbx', loop: true },
    collect: { url: '/animations/collect.fbx', loop: false },
    hurt: { url: '/animations/hurt.fbx', loop: false },
  };

  // Player collision handling
  const handlePlayerTriggerEnter = (payload: CollisionPayload) => {
    const otherType = payload.other.rigidBody?.userData?.type;

    switch (otherType) {
      case 'COIN':
        const coinValue = payload.other.rigidBody?.userData?.value || 10;
        setGameState((prev) => ({ ...prev, score: prev.score + coinValue }));
        currentAnimationRef.current = 'collect';
        break;

      case 'ENEMY':
        const damage = payload.other.rigidBody?.userData?.damage || 20;
        setGameState((prev) => ({ ...prev, health: Math.max(0, prev.health - damage) }));
        currentAnimationRef.current = 'hurt';
        break;

      case 'SAFE_ZONE':
        setGameState((prev) => ({ ...prev, inSafeZone: true }));
        break;

      case 'CUTSCENE_TRIGGER':
        // Disable input during cutscene
        setEnableInput(false);
        setTimeout(() => {
          setEnableInput(true);
          currentAnimationRef.current = 'idle';
        }, 3000);
        break;
    }
  };

  const handlePlayerTriggerExit = (payload: CollisionPayload) => {
    const otherType = payload.other.rigidBody?.userData?.type;

    if (otherType === 'SAFE_ZONE') {
      setGameState((prev) => ({ ...prev, inSafeZone: false }));
    }
  };

  return (
    <>
      {/* HTML UI Element - Game UI */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          zIndex: 100,
        }}
      >
        <div>Score: {gameState.score}</div>
        <div style={{ color: gameState.health > 50 ? 'green' : 'red' }}>Health: {gameState.health}/100</div>
        <div style={{ color: gameState.inSafeZone ? 'lightgreen' : 'orange' }}>{gameState.inSafeZone ? '🛡️ Safe Zone' : '⚠️ Danger Zone'}</div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).requestPointerLock();
        }}
      >
        <Physics>
          {/* Controller */}
          <FreeViewController />

          {/* Player */}
          <RigidBodyPlayer targetHeight={1.7} userData={{ type: 'PLAYER' }} onTriggerEnter={handlePlayerTriggerEnter} onTriggerExit={handlePlayerTriggerExit}>
            <CharacterRenderer url="/models/adventure-hero.glb" animationConfigMap={animationConfig} currentAnimationRef={currentAnimationRef} />
          </RigidBodyPlayer>

          {/* Collectible coins */}
          {[
            { pos: [5, 0.5, 0], value: 50 },
            { pos: [-3, 0.5, 4], value: 30 },
            { pos: [2, 0.5, -6], value: 100 },
          ].map((coin, index) => (
            <RigidBodyObject key={`coin-${index}`} type="fixed" position={coin.pos} userData={{ type: 'COIN', value: coin.value }}>
              <mesh rotation={[0, Math.PI / 4, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1]} />
                <meshStandardMaterial color="gold" emissive="orange" emissiveIntensity={0.2} />
              </mesh>
            </RigidBodyObject>
          ))}

          {/* Enemy patrol */}
          <RigidBodyObject type="kinematicPosition" position={[-5, 1, -2]} userData={{ type: 'ENEMY', damage: 25 }}>
            <mesh>
              <boxGeometry args={[1, 2, 1]} />
              <meshStandardMaterial color="darkred" />
            </mesh>
          </RigidBodyObject>

          {/* Safe zone */}
          <RigidBodyObject type="fixed" position={[8, -0.1, 6]} userData={{ type: 'SAFE_ZONE' }}>
            <mesh>
              <cylinderGeometry args={[3, 3, 0.2]} />
              <meshStandardMaterial color="lightgreen" transparent opacity={0.4} />
            </mesh>
          </RigidBodyObject>

          {/* Cutscene trigger */}
          <RigidBodyObject type="fixed" position={[0, 0, 10]} userData={{ type: 'CUTSCENE_TRIGGER' }}>
            <mesh>
              <boxGeometry args={[2, 0.1, 0.5]} />
              <meshStandardMaterial color="purple" transparent opacity={0.5} />
            </mesh>
          </RigidBodyObject>

          <ambientLight intensity={0.3} />

          {/* Light that follows the player */}
          <FollowLight />
        </Physics>
      </Canvas>
    </>
  );
}
```

## Important Notes

### 1. Preventing Controller Conflicts

```tsx
// ❌ Wrong usage: Multiple controllers simultaneously
function WrongUsage() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController /> {/* Conflict occurs! */}
        <FirstPersonViewController /> {/* Conflict occurs! */}
        <RigidBodyPlayer>{/* ... */}</RigidBodyPlayer>
      </Physics>
    </Canvas>
  );
}

// ✅ Correct usage: Use only one controller
function CorrectUsage() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController /> {/* Use only one */}
        <RigidBodyPlayer>{/* ... */}</RigidBodyPlayer>
      </Physics>
    </Canvas>
  );
}
```

### 2. RigidBodyPlayer Requirements

```tsx
// ❌ Wrong usage: No RigidBodyPlayer
function WrongUsage() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController /> {/* No player to control! */}
        {/* RigidBodyPlayer is required */}
      </Physics>
    </Canvas>
  );
}

// ✅ Correct usage: Include RigidBodyPlayer (position doesn't matter)
function CorrectUsage() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController />

        {/* RigidBodyPlayer is automatically detected anywhere within Canvas */}
        <group name="world-objects">
          <RigidBodyPlayer>
            <CharacterRenderer url="/models/character.glb" />
          </RigidBodyPlayer>
          {/* Other game objects */}
        </group>
      </Physics>
    </Canvas>
  );
}
```

### 3. Preventing Multiple RigidBodyPlayers

```tsx
// ❌ Wrong usage: Multiple RigidBodyPlayers
function WrongUsage() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController />

        <RigidBodyPlayer>
          {' '}
          {/* First player */}
          <CharacterRenderer url="/models/player1.glb" />
        </RigidBodyPlayer>

        <group name="other-area">
          <RigidBodyPlayer>
            {' '}
            {/* Second player - Conflict occurs! */}
            <CharacterRenderer url="/models/player2.glb" />
          </RigidBodyPlayer>
        </group>
      </Physics>
    </Canvas>
  );
}

// ✅ Correct usage: Use only one RigidBodyPlayer
function CorrectUsage() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController />

        <RigidBodyPlayer>
          {' '}
          {/* Only one player */}
          <CharacterRenderer url="/models/player.glb" />
        </RigidBodyPlayer>

        <group name="other-area">
          {/* Use RigidBodyObject for other characters */}
          <RigidBodyObject type="dynamic">
            <CharacterRenderer url="/models/npc.glb" />
          </RigidBodyObject>
        </group>
      </Physics>
    </Canvas>
  );
}
```

## Conclusion

ViewControllers are core components of Vibe Starter 3D, providing flexible camera and input systems tailored to various game genres and use cases. Through the **Controller-Player Separation** architecture, control logic and player objects are separated to ensure maintainability and extensibility.

Each controller is optimized for specific purposes, so please select and use the appropriate controller that matches your project requirements.
