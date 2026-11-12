import * as THREE from 'three';
import { CAMERA } from '../config';
import { loadPhysics } from '../physics/lazyPhysics';
import { createCameraRig } from './cameraRig';
import { createLevel } from './level';
import { createPlayerObject } from './player';

/** Per-frame systems run in this order, then the frame is drawn. */
export type System = { update(dt: number): void };

/**
 * Renderer, scene, camera and the frame loop, mounted into `container`
 * (sized to it, devicePixelRatio capped at 2). Returns the cleanup.
 */
export function createGame(container: HTMLElement, { physics = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  // R3F's `<Canvas shadows>` asks for PCFSoftShadowMap, which three r18x maps to PCFShadowMap (with a warning)
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA.free.fov, 1, 0.1, 500);
  camera.position.set(0, 2, 5);

  const resize = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(container);

  const rig = createCameraRig(camera, canvas);
  // same order as the R3F template: camera first, then lights, player (+ its animation)
  const systems: System[] = [rig, createLevel(scene), createPlayerObject(scene)];

  let disposed = false;
  if (physics) {
    loadPhysics(scene)
      .then((s) => {
        if (disposed) s.dispose();
        else systems.push(s);
      })
      .catch((e) => console.error('physics failed to load', e));
  }

  let last = -1;
  renderer.setAnimationLoop((time) => {
    const dt = last < 0 ? 0 : (time - last) / 1000;
    last = time;
    for (const s of systems) s.update(dt);
    renderer.render(scene, camera);
  });

  return () => {
    disposed = true;
    renderer.setAnimationLoop(null);
    observer.disconnect();
    for (const s of systems) (s as Partial<{ dispose(): void }>).dispose?.();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
    renderer.dispose();
    canvas.remove();
  };
}
