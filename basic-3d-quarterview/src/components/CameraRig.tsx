import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '../config';
import { player, rig } from '../game/state';

/** Wheel to zoom. There is no rotation input. */
function useWheelZoom() {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const c = CAMERA.quarter;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      rig.distance = THREE.MathUtils.clamp(rig.distance + e.deltaY * 0.02, c.minDistance, c.maxDistance);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [gl]);
}

/** Quarterview: fixed-angle camera above and in front (+z) of the player, following it. */
export function CameraRig() {
  const { camera } = useThree();
  const focus = useRef<THREE.Vector3 | null>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  useWheelZoom();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const c = CAMERA.quarter;
    const p = player.pos;
    target.set(p.x, p.y + c.height, p.z);
    if (!focus.current) focus.current = target.clone();
    const f = focus.current.lerp(target, 1 - Math.exp(-8 * dt));

    camera.position.set(f.x, f.y + Math.sin(c.pitch) * rig.distance, f.z + Math.cos(c.pitch) * rig.distance);
    camera.lookAt(f);

    // Portrait screens get a wider FOV so the player is not cramped.
    const persp = camera as THREE.PerspectiveCamera;
    const fov = persp.aspect < 1 ? c.portraitFov : c.fov;
    if (persp.fov !== fov) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
  }, -1);
  return null;
}
