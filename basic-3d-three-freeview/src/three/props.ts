// Shared part — import it, don't rewrite it.
import * as THREE from 'three';
import { fitModel } from '../game/fitModel';
import { loadGLTF } from './gltf';

/** Where one copy stands: feet at (x, y, z), turned `rotY` rad, × `scale` on top of the fitted size. */
export type Placement = { x: number; y: number; z: number; rotY: number; scale: number };

export type PropsOptions = {
  url: string;
  at: Placement[];
  /** Height (m) of one copy at scale 1 — library models are not in metres. */
  height: number;
  /** One InstancedMesh per mesh in the GLB (default: more than 30 copies). */
  instanced?: boolean;
  castShadow?: boolean;
};

/** Few copies (≲ 30): one clone each. */
function clones(group: THREE.Group, model: THREE.Object3D, at: Placement[], unit: number, lift: number) {
  for (const p of at) {
    const c = model.clone();
    c.position.set(p.x, p.y + lift * p.scale, p.z);
    c.rotation.set(0, p.rotY, 0);
    c.scale.setScalar(p.scale * unit);
    c.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    group.add(c);
  }
}

/** Many copies of a static model: one InstancedMesh per mesh in the GLB → a handful of draw calls for thousands of props. */
function instances(group: THREE.Group, model: THREE.Object3D, at: Placement[], unit: number, lift: number, castShadow: boolean) {
  // fitModel already updated matrixWorld, read below
  const placeM = new THREE.Matrix4();
  const out = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.SkinnedMesh).isSkinnedMesh) return; // skinned meshes can't be instanced — use createAnimatedModel
    const local = m.matrixWorld.clone();
    const mesh = new THREE.InstancedMesh(m.geometry, m.material, at.length);
    at.forEach((p, i) => {
      q.setFromAxisAngle(up, p.rotY);
      const s = p.scale * unit;
      placeM.compose(pos.set(p.x, p.y + lift * p.scale, p.z), q, scl.set(s, s, s));
      mesh.setMatrixAt(i, out.multiplyMatrices(placeM, local));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
}

/**
 * Draw a static model (URL from src/assets.json) at every placement and add it
 * to `scene`. `height` (m) rescales it from its bounding box. More than 30
 * copies are instanced automatically. `object3d` is in the scene at once and
 * fills when the GLB has loaded (`ready`).
 */
export function addProps(scene: THREE.Object3D, { url, at, height, instanced = at.length > 30, castShadow = true }: PropsOptions) {
  const object3d = new THREE.Group();
  scene.add(object3d);
  const ready = loadGLTF(url).then(({ scene: model }) => {
    const { unit, lift } = fitModel(model, { height });
    if (instanced) instances(object3d, model, at, unit, lift, castShadow);
    else clones(object3d, model, at, unit, lift);
  });
  ready.catch((e) => console.error(`props failed to load: ${url}`, e));
  return { object3d, ready };
}
