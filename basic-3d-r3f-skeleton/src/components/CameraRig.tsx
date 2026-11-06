import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '../config';
import type { ViewMode } from '../config';
import { player, rig } from '../game/state';

/** Freeview: drag (mouse or touch) on the canvas to orbit, wheel to zoom. */
function useOrbitControls(enabled: boolean) {
  const { gl } = useThree();
  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    const c = CAMERA.free;
    let active: number | null = null;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      if (active !== null) return;
      active = e.pointerId;
      lx = e.clientX;
      ly = e.clientY;
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      const k = e.pointerType === 'touch' ? 0.009 : 0.005;
      rig.yaw -= (e.clientX - lx) * k;
      rig.pitch = THREE.MathUtils.clamp(rig.pitch + (e.clientY - ly) * k * 0.8, c.minPitch, c.maxPitch);
      lx = e.clientX;
      ly = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === active) active = null;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      rig.distance = THREE.MathUtils.clamp(rig.distance + e.deltaY * 0.01, c.minDistance, c.maxDistance);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [enabled, gl]);
}

/**
 * Follows the player.
 * - freeview: third-person orbit around the player (yaw / pitch / distance in `rig`)
 * - sideview: fixed side camera on +z, tracking x / y with a little look-ahead
 */
export function CameraRig({ mode }: { mode: ViewMode }) {
  const { camera } = useThree();
  const focus = useRef<THREE.Vector3 | null>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const ahead = useRef(0);
  useOrbitControls(mode === 'freeview');

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = player.pos;
    if (mode === 'freeview') {
      target.set(p.x, p.y + CAMERA.free.height, p.z);
    } else {
      // look ahead toward where the player faces (sin(facing) is ±1 when running sideways)
      ahead.current += (Math.sin(player.facing) * CAMERA.side.lookAhead - ahead.current) * (1 - Math.exp(-3 * dt));
      target.set(p.x + ahead.current, p.y + 1, 0);
    }
    if (!focus.current) focus.current = target.clone();
    const f = focus.current.lerp(target, 1 - Math.exp(-10 * dt));

    if (mode === 'freeview') {
      const cp = Math.cos(rig.pitch);
      camera.position.set(
        f.x + Math.sin(rig.yaw) * cp * rig.distance,
        f.y + Math.sin(rig.pitch) * rig.distance,
        f.z + Math.cos(rig.yaw) * cp * rig.distance,
      );
    } else {
      camera.position.set(f.x, f.y + CAMERA.side.height, CAMERA.side.distance);
    }
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
