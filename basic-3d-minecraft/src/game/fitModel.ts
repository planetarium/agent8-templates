// Shared by every R3F template — import it, don't rewrite it.
import * as THREE from 'three';

/**
 * Library models come in any size and with their origin anywhere. Fit one to the
 * game: `unit` scales it to `height` metres and `lift` puts its lowest point on
 * y = 0, so a placement's y is where it stands. Draw it with `scale={unit}` and
 * `position-y={lift}` (the object itself is not changed).
 *
 * The world matrices are updated first: a GLB fresh from the loader (or a clone)
 * has not been rendered yet, and a rig with a scaled root (a mixamo Armature at
 * 0.01) would otherwise be measured at its raw size — a 100× wrong scale.
 */
export function fitModel(object: THREE.Object3D, { height }: { height: number }) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const unit = height / Math.max(1e-6, box.max.y - box.min.y);
  return { unit, lift: -box.min.y * unit };
}
