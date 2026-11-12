import * as THREE from 'three';
import { CAMERA } from '../config';
import { FOLLOW, cameraReach, followYawStep, springDistance } from '../game/camera';
import { nowSeconds } from '../game/input';
import { player, rig } from '../game/state';
import { BOXES, FIELDS, RAMPS, boxAabb } from '../game/world';

/** What the camera keeps out of (static level geometry; add moving boxes here if the camera should avoid them). */
const OBSTACLES = { boxes: BOXES.map(boxAabb), ramps: RAMPS, fields: FIELDS };

/** Drag (mouse or touch) on the canvas to orbit, wheel to zoom. Returns the cleanup. */
function bindOrbitControls(el: HTMLElement) {
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
}

/**
 * Freeview: third-person orbit around the player (yaw / pitch / distance in
 * `rig`, framing from CAMERA.free). Swings behind the motion when not
 * dragged (CAMERA.followYaw), pulls in in front of level geometry and eases
 * back out when it clears.
 */
export function createCameraRig(camera: THREE.PerspectiveCamera, el: HTMLElement) {
  let focus: THREE.Vector3 | null = null;
  const target = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const look = new THREE.Vector3();
  const dispose = bindOrbitControls(el);

  function update(delta: number) {
    const dt = Math.min(delta, 0.1);
    const c = CAMERA.free;
    const p = player.pos;

    if (CAMERA.followYaw && nowSeconds() - rig.draggedAt > FOLLOW.holdAfterDrag) {
      rig.yaw = followYawStep(rig.yaw, player.vel.x, player.vel.z, dt);
    }

    target.set(p.x, p.y + c.height, p.z);
    if (!focus) focus = target.clone();
    const f = focus.lerp(target, 1 - Math.exp(-10 * dt));

    // camera direction from the focus, plus the shoulder offset to the camera's right
    const cp = Math.cos(rig.pitch);
    const sy = Math.sin(rig.yaw);
    const cy = Math.cos(rig.yaw);
    look.set(f.x + cy * c.shoulder, f.y, f.z - sy * c.shoulder);
    dir.set(sy * cp, Math.sin(rig.pitch), cy * cp);

    // keep the camera out of the level: cast from the (shoulder-shifted) head toward where the camera wants to be
    const reach = cameraReach(look, dir, rig.distance, OBSTACLES);
    rig.reach = springDistance(rig.reach, reach, dt);
    camera.position.set(look.x + dir.x * rig.reach, look.y + dir.y * rig.reach, look.z + dir.z * rig.reach);
    camera.lookAt(look);

    const fov = camera.aspect < 1 ? c.portraitFov : c.fov;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  return { update, dispose };
}
