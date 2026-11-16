import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '../config';
import { player } from '../game/state';

/** Sideview: fixed side camera on +z, tracking x / y with a little look-ahead. No rotation input. */
export function CameraRig() {
  const { camera } = useThree();
  const focus = useRef<THREE.Vector3 | null>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const ahead = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const c = CAMERA.side;
    const p = player.pos;
    // look ahead toward where the player faces (sin(facing) is ±1 when running sideways)
    ahead.current += (Math.sin(player.facing) * c.lookAhead - ahead.current) * (1 - Math.exp(-3 * dt));
    target.set(p.x + ahead.current, p.y + c.focusHeight, 0);
    if (!focus.current) focus.current = target.clone();
    const f = focus.current.lerp(target, 1 - Math.exp(-10 * dt));

    camera.position.set(f.x, f.y + c.height, c.distance);
    camera.lookAt(f);

    // Portrait screens get a wider FOV so the player is not cramped.
    const persp = camera as THREE.PerspectiveCamera;
    const fov = persp.aspect < 1 ? 72 : 55;
    if (persp.fov !== fov) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
  }, -1);
  return null;
}
