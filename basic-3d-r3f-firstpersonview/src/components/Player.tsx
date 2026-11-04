import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLAYER } from '../config';
import { input, moveAxis, nowSeconds, wantsRun } from '../game/input';
import { stepPlayer } from '../game/player';
import { player, rig } from '../game/state';
import { BOXES, PLATFORM, RAMPS, boxAabb, updatePlatformAabb, type Aabb } from '../game/world';
import { PlatformMesh } from './Level';

const SUBSTEP = 1 / 120;
const axis = { x: 0, y: 0 };
const move = { x: 0, z: 0 };

/** The moving platform as a kinematic box, moved before every player substep. */
const platform: Aabb = { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
updatePlatformAabb(platform, 0);
const COLLIDERS: Aabb[] = [...BOXES.map(boxAabb), platform];

/** Moves with the platform AABB the player collides with. */
function MovingPlatform() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    ref.current?.position.set((platform.minX + platform.maxX) / 2, (platform.minY + platform.maxY) / 2, PLATFORM.z);
  });
  return (
    <group ref={ref}>
      <PlatformMesh />
    </group>
  );
}

/**
 * Kinematic controller (game/player.ts). The local player has no visible body:
 * the camera (CameraRig) is its eyes. Character.tsx is still here for other
 * characters (NPCs, remote players).
 */
export function Player() {
  const clock = useRef(0);

  useFrame((_, delta) => {
    moveAxis(axis);
    // view-relative: forward = where the camera looks (yaw only); walk unless running
    const len = Math.hypot(axis.x, axis.y);
    const k = len > 0 ? (wantsRun() ? 1 : PLAYER.walkSpeed / PLAYER.runSpeed) / len : 0;
    const s = Math.sin(rig.yaw);
    const c = Math.cos(rig.yaw);
    move.x = (-s * axis.y + c * axis.x) * k;
    move.z = (-c * axis.y - s * axis.x) * k;

    // Fixed substeps keep collision stable on slow frames.
    const dt = Math.min(delta, 0.1);
    const steps = Math.max(1, Math.ceil(dt / SUBSTEP));
    const now = nowSeconds();
    for (let i = 0; i < steps; i++) {
      clock.current += dt / steps;
      updatePlatformAabb(platform, clock.current);
      stepPlayer(player, move, input, now - dt + ((i + 1) * dt) / steps, dt / steps, COLLIDERS, false, RAMPS);
    }
    // Before CameraRig (priority -1), so the eyes are at this frame's position.
  }, -2);

  return <MovingPlatform />;
}
