import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '../config';
import { player, rig } from '../game/state';

/**
 * Mouse: click the canvas to lock the pointer, then move to look (Esc frees it).
 * Where pointer lock is refused (some embedded frames) and on touch, drag to look.
 */
function useMouseLook() {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const c = CAMERA.fp;
    let drag: number | null = null;
    let lx = 0;
    let ly = 0;
    const locked = () => document.pointerLockElement === el;
    const turn = (dx: number, dy: number, k: number) => {
      rig.yaw -= dx * k;
      rig.pitch = THREE.MathUtils.clamp(rig.pitch - dy * k, c.minPitch, c.maxPitch);
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && !locked()) {
        try {
          // Newer browsers return a promise that rejects when the lock is refused.
          const request = el.requestPointerLock() as unknown as Promise<void> | undefined;
          request?.catch?.(() => {});
        } catch {
          // refused: dragging still works
        }
      }
      if (drag !== null) return;
      drag = e.pointerId;
      lx = e.clientX;
      ly = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (locked()) {
        turn(e.movementX, e.movementY, c.mouseSensitivity);
        return;
      }
      if (e.pointerId !== drag) return;
      turn(e.clientX - lx, e.clientY - ly, e.pointerType === 'touch' ? c.touchSensitivity : c.mouseSensitivity);
      lx = e.clientX;
      ly = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === drag) drag = null;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      if (locked()) document.exitPointerLock();
    };
  }, [gl]);
}

/** First person: the camera sits at the player's eyes and turns with `rig` (yaw / pitch). */
export function CameraRig() {
  const { camera } = useThree();
  useMouseLook();

  useFrame(() => {
    const p = player.pos;
    camera.position.set(p.x, p.y + CAMERA.fp.eyeHeight, p.z);
    camera.rotation.set(rig.pitch, rig.yaw, 0, 'YXZ');

    // Portrait screens get a wider FOV so the view is not cramped.
    const persp = camera as THREE.PerspectiveCamera;
    const fov = persp.aspect < 1 ? CAMERA.fp.portraitFov : CAMERA.fp.fov;
    if (persp.fov !== fov) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
  }, -1);
  return null;
}
