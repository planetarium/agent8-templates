import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '../config';
import { FOLLOW, followYawStep, springDistance } from '../game/camera';
import { nowSeconds } from '../game/input';
import { player, rig, world } from '../game/state';
import { raycast } from '../game/voxel';

/** Drag (mouse or touch) on the canvas to orbit, wheel to zoom. */
function useOrbitControls() {
  const { gl } = useThree();
  useEffect(() => {
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
      if (e.clientX !== lx || e.clientY !== ly) rig.draggedAt = nowSeconds();
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
  }, [gl]);
}

/**
 * Third-person orbit around the player (yaw / pitch / distance in `rig`,
 * framing from CAMERA.free). Swings behind the motion when not dragged
 * (CAMERA.followYaw), pulls in in front of blocks and eases back out.
 */
export function CameraRig() {
  const { camera } = useThree();
  const focus = useRef<THREE.Vector3 | null>(null);
  const v = useMemo(() => ({ target: new THREE.Vector3(), look: new THREE.Vector3() }), []);
  useOrbitControls();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const c = CAMERA.free;
    const p = player.pos;

    if (CAMERA.followYaw && nowSeconds() - rig.draggedAt > FOLLOW.holdAfterDrag) {
      rig.yaw = followYawStep(rig.yaw, player.vel.x, player.vel.z, dt);
    }

    v.target.set(p.x, p.y + c.height, p.z);
    if (!focus.current) focus.current = v.target.clone();
    const f = focus.current.lerp(v.target, 1 - Math.exp(-10 * dt));

    const cp = Math.cos(rig.pitch);
    const sy = Math.sin(rig.yaw);
    const cy = Math.cos(rig.yaw);
    const dx = sy * cp;
    const dy = Math.sin(rig.pitch);
    const dz = cy * cp;
    v.look.set(f.x + cy * c.shoulder, f.y, f.z - sy * c.shoulder);
    // pull in in front of the first block between the player and the camera, ease back out
    const hit = raycast(world, [v.look.x, v.look.y, v.look.z], [dx, dy, dz], rig.distance);
    rig.reach = springDistance(rig.reach, hit ? Math.max(0.3, hit.distance - 0.3) : rig.distance, dt);
    const d = rig.reach;
    camera.position.set(v.look.x + dx * d, v.look.y + dy * d, v.look.z + dz * d);
    camera.lookAt(v.look);

    const persp = camera as THREE.PerspectiveCamera;
    const fov = persp.aspect < 1 ? c.portraitFov : c.fov;
    if (persp.fov !== fov) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
  }, -1);
  return null;
}
