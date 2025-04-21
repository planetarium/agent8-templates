import { useRef, useState, useEffect, useCallback } from 'react';
import { interactionGroups, Physics } from '@react-three/rapier';
import { Environment, Grid } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Floor } from './Floor';
import { ControllerHandle } from 'vibe-starter-3d';
import * as THREE from 'three';
import { useEffectStore } from '../../store/effectStore';
import { useGameServer } from '@agent8/gameserver';
import { EffectContainer } from './EffectContainer';
import { EffectType } from '../../types';
import { createBulletEffectConfig } from './effects/BulletEffectController';
import { FirstPersonViewController, useMouseControls } from 'vibe-starter-3d';

const SHOOT_COOLDOWN = 200;
const targetHeight = 1.6;

export function Experience() {
  const { server, account } = useGameServer();
  const { camera } = useThree();
  const getMouseInputs = useMouseControls();

  if (!server) return null;
  if (!account) return null;

  const controllerRef = useRef<ControllerHandle>(null);
  const shootTimestamp = useRef(0);
  const leftPressedLastFrame = useRef(false);

  /**
   * Delay physics activate
   */
  const [pausedPhysics, setPausedPhysics] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!controllerRef.current?.rigidBodyRef.current) return;

    const rigidBodyRef = controllerRef.current.rigidBodyRef.current;
    const colliderCount = rigidBodyRef.numColliders();
    console.log('jin2 colliderCount', colliderCount);
    if (colliderCount <= 0) return;

    for (let i = 0; i < colliderCount; i++) {
      const collider = rigidBodyRef.collider(i);
      console.log('jin2 collider', collider);
      collider.setCollisionGroups(interactionGroups([1, 2]));
    }
  }, [controllerRef.current?.rigidBodyRef.current]);

  const addEffect = useEffectStore((state) => state.addEffect);

  // Callback for Player to request a cast
  const spawnEffect = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      // Add effect locally via store
      addEffect(type, account, config);

      console.log('[Experience] Cast:', type, config);
    },
    [addEffect],
  );

  useFrame((_, delta) => {
    const currentState = controllerRef.current;
    const { left } = getMouseInputs();
    const now = Date.now();

    const leftJustPressed = left && !leftPressedLastFrame.current;
    leftPressedLastFrame.current = left;

    if (currentState && leftJustPressed && now > shootTimestamp.current) {
      shootTimestamp.current = now + SHOOT_COOLDOWN;

      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);

      const bulletSpeed = 200;

      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);
      const startPosition = cameraPosition.add(direction.clone().multiplyScalar(1.5));
      spawnEffect(EffectType.BULLET, createBulletEffectConfig({ startPosition, direction, speed: bulletSpeed, duration: 1000, scale: 1, flashDuration: 0 }));
    }
  });

  return (
    <>
      {/* Grid */}
      <Grid
        args={[100, 100]}
        position={[0, 0.1, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9f9f9f"
        fadeDistance={100}
        fadeStrength={1}
        userData={{ camExcludeCollision: true }}
      />

      <ambientLight intensity={0.7} />

      <Physics debug={false} paused={pausedPhysics}>
        {/* Environment */}
        <Environment preset="sunset" background={false} />

        {/* player with controller */}
        <FirstPersonViewController
          ref={controllerRef}
          camInitDis={-5}
          targetHeight={targetHeight}
          followLight={{
            position: [20, 30, 10],
            intensity: 1.2,
          }}
        ></FirstPersonViewController>

        {/* Floor */}
        <Floor />

        <EffectContainer />
      </Physics>
    </>
  );
}
