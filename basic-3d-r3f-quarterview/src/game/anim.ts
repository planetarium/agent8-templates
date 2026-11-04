// Character animation: the shared state the movement code writes and
// <Character> plays, plus the clip retargeting for separate-GLB mixamo clips.
import * as THREE from 'three';

export type AnimState = 'idle' | 'walk' | 'run' | 'jump' | 'fall';

/** Written by the player controller every frame, read by <Character>. */
export const anim = {
  state: 'idle' as AnimState,
  /** Bump on every take-off so a second jump restarts the clip. */
  jumps: 0,
};

const HIPS = 'mixamorigHips';

/**
 * Makes a clip from a separate animation GLB play on `target`:
 * - drops tracks for bones the target does not have
 * - keeps rotations (quaternion) only, plus the hips position
 * - scales the hips position by the hips-height ratio, so a shorter or taller
 *   character does not float or sink
 */
export function retarget(clip: THREE.AnimationClip, target: THREE.Object3D, source: THREE.Object3D): THREE.AnimationClip {
  const bones = new Set<string>();
  target.traverse((o) => bones.add(o.name));
  const th = target.getObjectByName(HIPS);
  const sh = source.getObjectByName(HIPS);
  const ratio = th && sh && sh.position.length() > 0 ? th.position.length() / sh.position.length() : 1;

  const tracks: THREE.KeyframeTrack[] = [];
  for (const t of clip.tracks) {
    const dot = t.name.lastIndexOf('.');
    const node = t.name.slice(0, dot);
    const prop = t.name.slice(dot + 1);
    if (!bones.has(node)) continue;
    if (prop === 'quaternion') tracks.push(t);
    else if (prop === 'position' && node === HIPS) {
      const s = t.clone();
      for (let i = 0; i < s.values.length; i++) s.values[i] *= ratio;
      tracks.push(s);
    }
  }
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
