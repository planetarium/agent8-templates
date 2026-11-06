import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLAYER } from '../config';
import { anim } from '../game/anim';
import { input, moveAxis, nowSeconds, wantsRun } from '../game/input';
import { stepPlayer } from '../game/player';
import { player, rig, world } from '../game/state';
import { collidersNear } from '../game/voxel';
import type { Aabb } from '../game/world';
import { Character } from './Character';

const SUBSTEP = 1 / 120;
const axis = { x: 0, y: 0 };
const move = { x: 0, z: 0 };

/** Solid blocks around the player, refilled every substep from the voxel world (so edits collide at once). */
const colliders: Aabb[] = [];

function animState() {
  const speed = Math.hypot(player.vel.x, player.vel.z);
  const airborne = !player.grounded && (player.vel.y > 0 || nowSeconds() - player.groundedAt > 0.1);
  if (airborne) return player.vel.y > 0 ? 'jump' : 'fall';
  if (speed > (PLAYER.walkSpeed + PLAYER.runSpeed) / 2) return 'run';
  return speed > 0.3 ? 'walk' : 'idle';
}

/** Kinematic controller (game/player.ts) on the voxel blocks + the shared character model. */
export function Player() {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    moveAxis(axis);
    // camera-relative: forward = away from the camera; walk unless running
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
      collidersNear(world, player.pos, PLAYER.height, 2, colliders);
      stepPlayer(player, move, input, now - dt + ((i + 1) * dt) / steps, dt / steps, colliders);
    }

    anim.state = animState();
    anim.jumps = player.jumps;

    const g = group.current;
    const b = body.current;
    if (!g || !b) return;
    g.position.set(player.pos.x, player.pos.y, player.pos.z);
    let d = player.facing - b.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    b.rotation.y += d * Math.min(1, dt * 14);
  });

  return (
    <group ref={group}>
      <group ref={body}>
        <Character />
      </group>
    </group>
  );
}
