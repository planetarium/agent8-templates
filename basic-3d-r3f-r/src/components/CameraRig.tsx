import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControlsImpl } from '@react-three/drei';
import { EcctrlCameraControls, type EcctrlCameraControlsHandle } from 'ecctrl/camera';
import * as THREE from 'three';
import { CAMERA } from '../config';
import { player } from '../game/state';

const { ACTION } = CameraControlsImpl;
const c = CAMERA.free;

/**
 * ecctrl's camera controls (drei CameraControls) following the player: drag to
 * orbit, wheel / pinch to zoom. Starts at the same pitch and distance as the
 * kinematic variant's orbit camera.
 */
export function CameraRig() {
  const controls = useRef<EcctrlCameraControlsHandle>(null);
  const { camera } = useThree();

  useEffect(() => {
    const ctl = controls.current;
    if (!ctl) return;
    // Orbit and zoom only: panning would pull the camera off the player.
    ctl.mouseButtons.right = ACTION.NONE;
    ctl.mouseButtons.middle = ACTION.NONE;
    ctl.touches.two = ACTION.TOUCH_DOLLY;
    ctl.touches.three = ACTION.NONE;
    const p = player.pos;
    const ty = p.y + c.height;
    ctl.setLookAt(p.x, ty + Math.sin(c.pitch) * c.distance, p.z + Math.cos(c.pitch) * c.distance, p.x, ty, p.z, false);
  }, []);

  useFrame(() => {
    const p = player.pos;
    controls.current?.moveTo(p.x, p.y + c.height, p.z, true);

    // Portrait screens get a wider FOV so the player is not cramped.
    const persp = camera as THREE.PerspectiveCamera;
    const fov = persp.aspect < 1 ? 72 : 55;
    if (persp.fov !== fov) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
  });

  return (
    <EcctrlCameraControls
      ref={controls}
      makeDefault
      smoothTime={0.1}
      minDistance={c.minDistance}
      maxDistance={c.maxDistance}
      // CameraControls measures polar from straight up; pitch is measured from the horizon.
      minPolarAngle={Math.PI / 2 - c.maxPitch}
      maxPolarAngle={Math.PI / 2 - c.minPitch}
    />
  );
}
