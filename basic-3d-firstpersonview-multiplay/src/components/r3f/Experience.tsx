import { useRef, useState, useEffect, useCallback } from 'react';
import { interactionGroups } from '@react-three/rapier';
import { Environment, Grid } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Player } from './Player';
import { PlayerRef } from '../../types/player';
import { Floor } from './Floor';
import { ControllerHandle, FirstPersonViewController, useMouseControls } from 'vibe-starter-3d';
import * as THREE from 'three';
import { useEffectStore } from '../../store/effectStore';
import { useGameServer } from '@agent8/gameserver';
import { EffectType } from '../../types';
import { createBulletEffectConfig } from './effects/BulletEffectController';
import { CharacterState } from '../../constants/character';

const SHOOT_COOLDOWN = 200;
const targetHeight = 1.6;

/**
 * Experience component props
 */
interface ExperienceProps {
  /** Current player's character key */
  characterUrl: string;
}

export function Experience({ characterUrl }: ExperienceProps) {
  const { server, account } = useGameServer();
  const { camera } = useThree();
  const getMouseInputs = useMouseControls();

  if (!server) return null;
  if (!account) return null;

  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);
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
    if (playerRef.current) {
      const boundingBox = playerRef.current.boundingBox;

      if (boundingBox) {
        console.log('Character size information updated:', boundingBox);
      }
    }
  }, [playerRef.current?.boundingBox]);

  useEffect(() => {
    if (!controllerRef.current?.rigidBodyRef.current) return;

    const rigidBodyRef = controllerRef.current.rigidBodyRef.current;
    const colliderCount = rigidBodyRef.numColliders();
    if (colliderCount <= 0) return;

    for (let i = 0; i < colliderCount; i++) {
      const collider = rigidBodyRef.collider(i);
      collider.setCollisionGroups(interactionGroups([1, 2]));
    }
  }, [controllerRef.current?.rigidBodyRef.current]);

  const addEffect = useEffectStore((state) => state.addEffect);

  // Callback for Player to request a cast
  const spawnEffect = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      // Add effect locally via store
      addEffect(type, account, config);
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

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* player character with controller */}
      <FirstPersonViewController
        ref={controllerRef}
        camInitDis={-5}
        targetHeight={targetHeight}
        followLight={{
          position: [20, 30, 10],
          intensity: 1.2,
        }}
      >
        <Player ref={playerRef} targetHeight={targetHeight} initialState={CharacterState.IDLE} controllerRef={controllerRef} characterKey={characterUrl} />
      </FirstPersonViewController>

      {/* Floor */}
      <Floor />
    </>
  );
}
