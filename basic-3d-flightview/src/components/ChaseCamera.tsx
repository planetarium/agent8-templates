import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '../config';
import { plane } from '../game/state';

/**
 * Chase camera: sits at CAMERA.offset in a lagging copy of the plane's
 * attitude (slerped toward it), so turns swing the view and rolls bank it.
 */
export function ChaseCamera() {
  const { camera } = useThree();
  const started = useRef(false);
  const v = useMemo(
    () => ({
      lagged: new THREE.Quaternion(),
      attitude: new THREE.Quaternion(),
      target: new THREE.Vector3(),
      at: new THREE.Vector3(),
      offset: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = plane.pos;
    v.attitude.set(plane.quat.x, plane.quat.y, plane.quat.z, plane.quat.w);
    // CAMERA.slerp is per 1/60 s; scale it so the lag is the same at any frame rate
    v.lagged.slerp(v.attitude, 1 - Math.pow(1 - CAMERA.slerp, dt * 60));

    const [ox, oy, oz] = CAMERA.offset;
    v.target.copy(v.offset.set(ox, 0, oz).applyQuaternion(v.lagged));
    v.target.y += oy;
    v.target.add(v.at.set(p.x, p.y, p.z));
    if (!started.current) {
      camera.position.copy(v.target);
      started.current = true;
    } else camera.position.lerp(v.target, 1 - Math.exp(-CAMERA.follow * dt));

    // the lagged up vector banks the view with the plane
    camera.up.set(0, 1, 0).applyQuaternion(v.lagged);
    camera.lookAt(v.at);

    const persp = camera as THREE.PerspectiveCamera;
    const fov = persp.aspect < 1 ? CAMERA.portraitFov : CAMERA.fov;
    if (persp.fov !== fov) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
  }, -1);
  return null;
}
