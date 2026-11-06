import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLAYER } from '../config';
import type { ViewMode } from '../config';
import { input, moveAxis, nowSeconds } from '../game/input';
import { stepPlayer } from '../game/player';
import { player, rig } from '../game/state';
import { COLLIDERS } from '../game/world';

const SUBSTEP = 1 / 120;
const axis = { x: 0, y: 0 };
const move = { x: 0, z: 0 };

/** Placeholder body — swap the <mesh>es for a GLTF (drei useGLTF) to get a real character. */
function Body() {
  const r = PLAYER.radius;
  return (
    <>
      <mesh position={[0, PLAYER.height / 2, 0]} castShadow>
        <capsuleGeometry args={[r, PLAYER.height - 2 * r, 6, 16]} />
        <meshStandardMaterial color="#4f8ef7" />
      </mesh>
      {/* visor marks the facing direction (+z) */}
      <mesh position={[0, PLAYER.height - 0.35, r - 0.02]}>
        <boxGeometry args={[0.4, 0.14, 0.12]} />
        <meshStandardMaterial color="#1b1b1b" />
      </mesh>
    </>
  );
}

export function Player({ mode }: { mode: ViewMode }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    moveAxis(axis);
    if (mode === 'sideview') {
      move.x = axis.x;
      move.z = 0;
    } else {
      // camera-relative: forward = away from the camera
      const s = Math.sin(rig.yaw);
      const c = Math.cos(rig.yaw);
      move.x = -s * axis.y + c * axis.x;
      move.z = -c * axis.y - s * axis.x;
    }

    // Fixed substeps keep collision stable on slow frames.
    const dt = Math.min(delta, 0.1);
    const steps = Math.max(1, Math.ceil(dt / SUBSTEP));
    const now = nowSeconds();
    for (let i = 0; i < steps; i++) {
      stepPlayer(player, move, input, now - dt + ((i + 1) * dt) / steps, dt / steps, COLLIDERS, mode === 'sideview');
    }

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
        <Body />
      </group>
    </group>
  );
}
