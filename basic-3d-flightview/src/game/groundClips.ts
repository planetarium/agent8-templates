// Shared by every R3F template — import it, don't rewrite it.
// Per-clip ground offsets for an animated model: a borrowed clip can bend or
// straighten the legs of a rig whose rest pose differs from the clip's, so the
// lowest point while playing is not the bind-pose lowest point fitModel saw.
import * as THREE from 'three';

/**
 * Where in each clip to sample (fractions of its duration): every 1/8. A walk
 * plants each foot twice per loop; quarters alone missed the low point by 3 cm.
 */
export const GROUND_SAMPLES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

/** Lowest point of the posed model in its own (root) frame, skinning applied (shoes sit below the foot bones). */
export function skinnedMinY(root: THREE.Object3D): number {
  root.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(root, true).min.y;
}

/**
 * For each clip, how far to raise the model (in its own units, before
 * fitModel's `unit`) so the lowest point any sample of that clip reaches
 * stands on y = 0: offset[clip] = −min over samples of `measure(root)`.
 * The clips are posed off screen with a throwaway mixer; every node's
 * transform is put back afterwards. A clip that cannot be measured is left out
 * (use fitModel's `lift` for it).
 */
export function clipGroundOffsets(
  root: THREE.Object3D,
  clips: THREE.AnimationClip[],
  measure: (root: THREE.Object3D) => number = skinnedMinY,
  samples: number[] = GROUND_SAMPLES,
): Record<string, number> {
  const saved: [THREE.Object3D, THREE.Vector3, THREE.Quaternion, THREE.Vector3][] = [];
  root.traverse((o) => saved.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]));
  const mixer = new THREE.AnimationMixer(root);
  const out: Record<string, number> = {};
  try {
    for (const clip of clips) {
      const action = mixer.clipAction(clip);
      action.play();
      let min = Infinity;
      for (const f of samples) {
        action.time = Math.min(clip.duration * f, Math.max(0, clip.duration - 1e-4));
        mixer.update(0);
        min = Math.min(min, measure(root));
      }
      action.stop();
      if (Number.isFinite(min)) out[clip.name] = -min;
    }
  } catch {
    // a model that cannot be posed or measured keeps fitModel's lift
  } finally {
    mixer.stopAllAction();
    mixer.uncacheRoot(root);
    for (const [o, p, q, s] of saved) {
      o.position.copy(p);
      o.quaternion.copy(q);
      o.scale.copy(s);
    }
    root.updateMatrixWorld(true);
  }
  return out;
}
