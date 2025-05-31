# CharacterRenderer Guide

`CharacterRenderer` is a core component of the Vibe Starter 3D library that provides unified rendering and animation control for 3D character models in VRM and GLTF/GLB formats.

## Overview

`CharacterRenderer` features the following capabilities:

- **Unified Rendering**: Automatically detects VRM and GLTF/GLB file formats and selects the appropriate renderer
- **Animation Management**: Simplifies complex animation state management and transitions
- **Flexible Configuration**: Provides various options including character height, animation loops, completion callbacks, etc.
- **Type Safety**: Complete TypeScript support for type safety

## Basic Usage

### 1. Basic Setup

```tsx
import { CharacterRenderer, AnimationConfigMap } from 'vibe-starter-3d';
import { useRef } from 'react';

function MyCharacter() {
  // Ref to manage current animation state
  const currentAnimationRef = useRef<'idle' | 'walk' | 'run'>('idle');

  // Animation configuration map
  const animationConfigMap: AnimationConfigMap = {
    idle: {
      url: '/animations/idle.glb',
      loop: true,
    },
    walk: {
      url: '/animations/walk.glb',
      loop: true,
    },
    run: {
      url: '/animations/run.glb',
      loop: true,
    },
  };

  return <CharacterRenderer url="/models/character.glb" animationConfigMap={animationConfigMap} currentAnimationRef={currentAnimationRef} targetHeight={1.8} />;
}
```

### 2. Scene Composition and Controller Placement (Recommended Architecture)

```tsx
import { CharacterRenderer, RigidBodyPlayer, FreeViewController, AnimationConfigMap } from 'vibe-starter-3d';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useRef } from 'react';

// Player component - manages player entity (physics, rendering, interaction)
function Player() {
  const currentAnimationRef = useRef<'idle' | 'walk' | 'run'>('idle');

  const animationConfigMap: AnimationConfigMap = {
    idle: { url: '/animations/idle.glb', loop: true },
    walk: { url: '/animations/walk.glb', loop: true },
    run: { url: '/animations/run.glb', loop: true },
  };

  return (
    <RigidBodyPlayer targetHeight={1.6}>
      <CharacterRenderer url="/models/player.glb" animationConfigMap={animationConfigMap} currentAnimationRef={currentAnimationRef} targetHeight={1.6} />
    </RigidBodyPlayer>
  );
}

// Scene component - manages controllers and view composition at the top level
function GameScene() {
  return (
    <Canvas>
      <Physics>
        {/* 🎯 Controllers are managed at the scene top level */}
        <FreeViewController />

        {/* Player character */}
        <Player />
      </Physics>
    </Canvas>
  );
}

// Main app component
function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameScene />
    </div>
  );
}
```

### 3. Various Controller Type Examples

```tsx
import { CharacterRenderer, RigidBodyPlayer, FreeViewController, FirstPersonViewController, QuarterViewController, AnimationConfigMap } from 'vibe-starter-3d';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useState, useRef } from 'react';

type ControllerType = 'free' | 'firstPerson' | 'quarter';

function Player() {
  const currentAnimationRef = useRef<'idle' | 'walk' | 'run'>('idle');

  const animationConfigMap: AnimationConfigMap = {
    idle: { url: '/animations/idle.glb', loop: true },
    walk: { url: '/animations/walk.glb', loop: true },
    run: { url: '/animations/run.glb', loop: true },
  };

  return (
    <RigidBodyPlayer targetHeight={1.6}>
      <CharacterRenderer url="/models/player.glb" animationConfigMap={animationConfigMap} currentAnimationRef={currentAnimationRef} targetHeight={1.6} />
    </RigidBodyPlayer>
  );
}

function GameScene() {
  const [controllerType, setControllerType] = useState<ControllerType>('free');

  // Render controller based on type
  const renderController = () => {
    switch (controllerType) {
      case 'free':
        return <FreeViewController />;
      case 'firstPerson':
        return <FirstPersonViewController />;
      case 'quarter':
        return <QuarterViewController followCharacter={true} inputMode="keyboard" />;
      default:
        return <FreeViewController />;
    }
  };

  return (
    <>
      {/* UI controls */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
        <button onClick={() => setControllerType('free')}>Free View</button>
        <button onClick={() => setControllerType('firstPerson')}>First Person</button>
        <button onClick={() => setControllerType('quarter')}>Quarter View</button>
      </div>

      <Canvas>
        <Physics>
          {/* 🎯 Selected controller managed at scene top level */}
          {renderController()}

          <Player />
        </Physics>
      </Canvas>
    </>
  );
}
```

## Advanced Usage

### 1. Animation Completion Callback Handling

```tsx
import { CharacterRenderer, AnimationConfigMap } from 'vibe-starter-3d';
import { useRef, useCallback } from 'react';

type CharacterState = 'idle' | 'walk' | 'attack' | 'jump';

function AdvancedCharacter() {
  const currentAnimationRef = useRef<CharacterState>('idle');

  const animationConfigMap: AnimationConfigMap = {
    idle: { url: '/animations/idle.glb', loop: true },
    walk: { url: '/animations/walk.glb', loop: true },
    attack: {
      url: '/animations/attack.glb',
      loop: false, // Play only once
      duration: 0.8, // Play for 0.8 seconds
      clampWhenFinished: true, // Stop at last frame
    },
    jump: {
      url: '/animations/jump.glb',
      loop: false,
      clampWhenFinished: false, // Return to default pose
    },
  };

  // Callback called when animation completes
  const handleAnimationComplete = useCallback((type: CharacterState) => {
    console.log(`Animation completed: ${type}`);

    switch (type) {
      case 'attack':
        // Transition to idle after attack animation completes
        currentAnimationRef.current = 'idle';
        break;
      case 'jump':
        // Transition to idle after jump animation completes
        currentAnimationRef.current = 'idle';
        break;
      default:
        break;
    }
  }, []);

  return (
    <CharacterRenderer
      url="/models/character.glb"
      animationConfigMap={animationConfigMap}
      currentAnimationRef={currentAnimationRef}
      targetHeight={1.7}
      onAnimationComplete={handleAnimationComplete}
    />
  );
}
```

### 2. Size Change Detection

```tsx
import { CharacterRenderer } from 'vibe-starter-3d';
import { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

function CharacterWithSizeDetection() {
  const currentAnimationRef = useRef<'idle'>('idle');
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);

  const animationConfigMap = {
    idle: { url: '/animations/idle.glb', loop: true },
  };

  // Called when character size information changes
  const handleSizeChange = useCallback((box: THREE.Box3) => {
    setBoundingBox(box);

    const size = new THREE.Vector3();
    box.getSize(size);

    console.log('Character size:', {
      width: size.x,
      height: size.y,
      depth: size.z,
    });
  }, []);

  return (
    <CharacterRenderer
      url="/models/character.glb"
      animationConfigMap={animationConfigMap}
      currentAnimationRef={currentAnimationRef}
      onSizeChange={handleSizeChange}
    />
  );
}
```

### 3. Real Game Scenario Example (freeview-based)

The following is a real game scenario from the freeview example, demonstrating proper architecture:

```tsx
import { CharacterRenderer, RigidBodyPlayer, AnimationConfigMap, FreeViewController, FollowLight } from 'vibe-starter-3d';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Environment } from '@react-three/drei';
import { useRef, useMemo, useCallback } from 'react';

// Character state definition
enum CharacterState {
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
  JUMP = 'jump',
  PUNCH = 'punch',
  KICK = 'kick',
  HIT = 'hit',
  DIE = 'die',
}

// Player component - manages player entity
function Player() {
  const currentStateRef = useRef<CharacterState>(CharacterState.IDLE);

  // Animation configuration map (memoized for performance optimization)
  const animationConfigMap: AnimationConfigMap = useMemo(
    () => ({
      [CharacterState.IDLE]: {
        url: '/animations/idle.glb',
        loop: true,
      },
      [CharacterState.WALK]: {
        url: '/animations/walk.glb',
        loop: true,
      },
      [CharacterState.RUN]: {
        url: '/animations/run-medium.glb',
        loop: true,
      },
      [CharacterState.JUMP]: {
        url: '/animations/jump.glb',
        loop: true,
        clampWhenFinished: true,
      },
      [CharacterState.PUNCH]: {
        url: '/animations/punch-00.glb',
        loop: false,
        duration: 0.5,
        clampWhenFinished: true,
      },
      [CharacterState.KICK]: {
        url: '/animations/kick-00.glb',
        loop: false,
        duration: 0.75,
        clampWhenFinished: true,
      },
      [CharacterState.HIT]: {
        url: '/animations/hit-to-body.glb',
        loop: false,
        clampWhenFinished: false,
      },
      [CharacterState.DIE]: {
        url: '/animations/death-backward.glb',
        loop: false,
        clampWhenFinished: true,
      },
    }),
    [],
  );

  // Animation completion handling
  const handleAnimationComplete = useCallback((type: CharacterState) => {
    console.log(`Animation completed: ${type}`);

    switch (type) {
      case CharacterState.PUNCH:
      case CharacterState.KICK:
      case CharacterState.HIT:
        // Transition to idle after action animation completes
        currentStateRef.current = CharacterState.IDLE;
        break;
      default:
        break;
    }
  }, []);

  return (
    <RigidBodyPlayer targetHeight={1.6}>
      <CharacterRenderer
        url="/models/base-model.glb"
        animationConfigMap={animationConfigMap}
        currentAnimationRef={currentStateRef}
        targetHeight={1.6}
        onAnimationComplete={handleAnimationComplete}
      />
    </RigidBodyPlayer>
  );
}

// Game scene component - manages controllers and overall scene composition
function GameScene() {
  return (
    <Canvas
      shadows
      onPointerDown={(e) => {
        (e.target as HTMLCanvasElement).requestPointerLock();
      }}
    >
      <Physics debug={true}>
        {/* 🎯 Controllers are managed at scene top level */}
        <FreeViewController />

        {/* Lighting setup */}
        <FollowLight />
        <ambientLight intensity={0.7} />

        {/* Player */}
        <Player />

        {/* Floor */}
        <mesh position={[0, -1, 0]}>
          <boxGeometry args={[100, 0.1, 100]} />
          <meshStandardMaterial color="gray" />
        </mesh>
      </Physics>
    </Canvas>
  );
}

// Main app component
function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameScene />
    </div>
  );
}
```

## Architecture Best Practices

### 1. Controller Placement Principles

```tsx
// ✅ Good example: Managing controllers at scene top level
function GameScene() {
  return (
    <Canvas>
      <Physics>
        {/* Controllers are managed at scene level with views */}
        <FreeViewController />

        {/* Player handles character physics, interaction, and rendering */}
        <Player />
      </Physics>
    </Canvas>
  );
}

// ❌ Bad example: Including controller inside player
function Player() {
  return (
    <>
      {/* Controller inside player reduces reusability and flexibility */}
      <FreeViewController />
      <RigidBodyPlayer>
        <CharacterRenderer />
      </RigidBodyPlayer>
    </>
  );
}
```

### 2. Separation of Concerns

```tsx
// ✅ Good example: Clear separation of each component's role

// 1. Player component - manages character physics, interaction, and rendering
function Player() {
  return (
    <RigidBodyPlayer>
      <CharacterRenderer />
    </RigidBodyPlayer>
  );
}

// 2. Scene component - manages overall scene composition and controllers
function GameScene() {
  return (
    <Canvas>
      <Physics>
        <FreeViewController /> {/* View control */}
        <Player /> {/* Character */}
      </Physics>
    </Canvas>
  );
}

// 3. App component - manages overall app composition and input
function App() {
  return (
    <KeyboardControls>
      <GameScene />
    </KeyboardControls>
  );
}
```

### 3. Controller Switching Management

```tsx
// ✅ Good example: Managing controller switching at scene level
function GameScene() {
  const [viewMode, setViewMode] = useState<'free' | 'firstPerson' | 'quarter'>('free');

  const renderController = () => {
    switch (viewMode) {
      case 'free':
        return <FreeViewController />;
      case 'firstPerson':
        return <FirstPersonViewController />;
      case 'quarter':
        return <QuarterViewController />;
    }
  };

  return (
    <Canvas>
      <Physics>
        {/* Managing controller type at scene level */}
        {renderController()}

        {/* Player is unaffected by controller changes */}
        <Player />
      </Physics>
    </Canvas>
  );
}
```

## Props Detailed Description

### CharacterRendererProps

| Property                                      | Type                                    | Description                                                      | Default  |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- | -------- |
| `visible`                                     | `boolean`                               | Whether the character model is displayed on screen               | `true`   |
| `url`                                         | `string`                                | Model file path or URL (required)                                | -        |
| `animationConfigMap`                          | `AnimationConfigMap`                    | Animation configuration map (required)                           | -        |
| `currentAnimationRef`                         | `RefObject<AnimationType \| undefined>` | Ref pointing to current animation type (required)                | -        |
| `targetHeight`                                | `number`                                | Target height for the character model                            | Optional |
| `disableAnimationAdjustmentToModelProportion` | `boolean`                               | Disable animation adjustment to model proportion (GLTF/GLB only) | Optional |
| `onAnimationComplete`                         | `(type: AnimationType) => void`         | Callback called when animation completes                         | Optional |
| `onSizeChange`                                | `(boundingBox: THREE.Box3) => void`     | Callback called when model size information changes              | Optional |
| `fallback`                                    | `React.ReactNode`                       | Suspense fallback for unsupported file formats                   | Optional |

### AnimationConfig

| Property            | Type      | Description                                           | Default  |
| ------------------- | --------- | ----------------------------------------------------- | -------- |
| `url`               | `string`  | Animation file path or URL (required)                 | -        |
| `loop`              | `boolean` | Whether animation should repeat                       | `true`   |
| `duration`          | `number`  | Animation duration in seconds                         | Optional |
| `clampWhenFinished` | `boolean` | Whether to stop at last frame when animation finishes | `false`  |

## Supported File Formats

### VRM Files (.vrm)

- VRM character models created in VRoid Studio, etc.
- Automatically rendered using `VrmModelRenderer`

### GLTF/GLB Files (.gltf, .glb)

- Standard 3D model formats
- Automatically rendered using `GltfModelRenderer`
- Supports `disableAnimationAdjustmentToModelProportion` option

## Best Practices

### 1. Animation State Management

```tsx
// ✅ Good example: Using useRef for state management
const currentAnimationRef = useRef<AnimationType>('idle');

// ❌ Bad example: Using useState (causes unnecessary re-renders)
const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('idle');
```

### 2. Animation Configuration Optimization

```tsx
// ✅ Good example: Memoizing animation map with useMemo
const animationConfigMap = useMemo(
  () => ({
    idle: { url: '/animations/idle.glb', loop: true },
    walk: { url: '/animations/walk.glb', loop: true },
  }),
  [],
);

// ❌ Bad example: Creating new object every time
const animationConfigMap = {
  idle: { url: '/animations/idle.glb', loop: true },
  walk: { url: '/animations/walk.glb', loop: true },
};
```

### 3. Ensuring Type Safety

```tsx
// ✅ Good example: Clear type definition
type CharacterState = 'idle' | 'walk' | 'run' | 'attack';
const currentAnimationRef = useRef<CharacterState>('idle');

// ❌ Bad example: No type definition
const currentAnimationRef = useRef('idle');
```

### 4. Resource Management

```tsx
// ✅ Good example: Using relative paths or CDN
url = '/models/character.glb';
url = 'https://cdn.example.com/models/character.glb';

// ❌ Bad example: Hard-coding absolute paths
url = '/Users/username/project/public/models/character.glb';
```

## Troubleshooting

### 1. Animation Not Playing

- Check if the animation is defined in `animationConfigMap`
- Verify that `currentAnimationRef.current` value is correct
- Confirm animation file path is accurate

### 2. Model Not Displaying

- Check if `visible` property is `true`
- Verify model file path is correct
- Confirm file format is supported (.vrm, .gltf, .glb)

### 3. Performance Issues

- Memoize `animationConfigMap` with `useMemo`
- Use `useRef` to prevent unnecessary re-renders
- Consider compression or optimization for large model files

This guide enables you to effectively utilize `CharacterRenderer` for rendering 3D characters and controlling animations.
