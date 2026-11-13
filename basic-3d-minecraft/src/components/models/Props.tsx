// Shared by every R3F template — import it, don't rewrite it.
import { Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { Clone, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { fitModel } from '../../game/fitModel';

/** Where one copy stands: feet at (x, y, z), turned `rotY` rad, × `scale` on top of the fitted size. */
export type Placement = { x: number; y: number; z: number; rotY: number; scale: number };

/** Few copies (≲ 30): one <Clone> each. */
function Clones({ url, at, height }: { url: string; at: Placement[]; height: number }) {
  const { scene } = useGLTF(url);
  const { unit, lift } = useMemo(() => fitModel(scene, { height }), [scene, height]);
  return (
    <>
      {at.map((p, i) => (
        <Clone
          key={i}
          object={scene}
          position={[p.x, p.y + lift * p.scale, p.z]}
          rotation={[0, p.rotY, 0]}
          scale={p.scale * unit}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
}

/** Many copies of a static model: one InstancedMesh per mesh in the GLB → a handful of draw calls for thousands of props. */
function Instanced({ url, at, height, castShadow }: { url: string; at: Placement[]; height: number; castShadow: boolean }) {
  const { scene } = useGLTF(url);
  const { parts, unit, lift } = useMemo(() => {
    const fit = fitModel(scene, { height }); // also updates matrixWorld, read below
    const list: { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[]; local: THREE.Matrix4 }[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || (m as THREE.SkinnedMesh).isSkinnedMesh) return; // skinned meshes can't be instanced — use AnimatedModel
      list.push({ geometry: m.geometry, material: m.material, local: m.matrixWorld.clone() });
    });
    return { parts: list, ...fit };
  }, [scene, height]);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);

  useLayoutEffect(() => {
    const placeM = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const out = new THREE.Matrix4();
    parts.forEach((part, k) => {
      const mesh = refs.current[k];
      if (!mesh) return;
      at.forEach((p, i) => {
        q.setFromAxisAngle(up, p.rotY);
        const s = p.scale * unit;
        placeM.compose(new THREE.Vector3(p.x, p.y + lift * p.scale, p.z), q, new THREE.Vector3(s, s, s));
        mesh.setMatrixAt(i, out.multiplyMatrices(placeM, part.local));
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [parts, at, unit, lift]);

  return (
    <>
      {parts.map((part, k) => (
        <instancedMesh
          key={k}
          ref={(el) => {
            refs.current[k] = el;
          }}
          args={[part.geometry, part.material, at.length]}
          castShadow={castShadow}
          receiveShadow
        />
      ))}
    </>
  );
}

/**
 * Draw a static model (URL from src/assets.json) at every placement.
 * `height` (m) rescales it from its bounding box — library models are not in
 * metres. More than 30 copies are instanced automatically.
 * `fallback` shows while the GLB loads.
 */
export function Props({
  url,
  at,
  height,
  instanced = at.length > 30,
  castShadow = true,
  fallback = null,
}: {
  url: string;
  at: Placement[];
  height: number;
  instanced?: boolean;
  castShadow?: boolean;
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      {instanced ? <Instanced url={url} at={at} height={height} castShadow={castShadow} /> : <Clones url={url} at={at} height={height} />}
    </Suspense>
  );
}
