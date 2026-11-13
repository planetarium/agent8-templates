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
/** Foot bones (mixamorigLeftFoot, …ToeBase, …Toe_End): the lowest one stands for the ground. */
const FOOT = /(Foot|Toe\w*)$/;

const _v = new THREE.Vector3();

/**
 * Hips height above the lowest foot bone in the bind pose, in the units of the
 * hips' parent (where the hips position track lives), or null without feet.
 */
function legHeight(root: THREE.Object3D, hips: THREE.Object3D): number | null {
  root.updateWorldMatrix(true, true);
  let foot = Infinity;
  root.traverse((o) => {
    if (o !== hips && FOOT.test(o.name)) foot = Math.min(foot, o.getWorldPosition(_v).y);
  });
  if (!Number.isFinite(foot)) return null;
  const height = hips.getWorldPosition(_v).y - foot;
  const s = hips.parent ? hips.parent.getWorldScale(_v) : _v.set(1, 1, 1);
  const scale = (Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.z)) / 3;
  return height > 0 && scale > 0 ? height / scale : null;
}

/**
 * Makes a clip from a separate animation GLB play on `target`:
 * - drops tracks for bones the target does not have
 * - keeps rotations (quaternion) only, plus the hips position
 * - moves the hips around the TARGET's rest hips position: each key becomes
 *   targetRest + (key − sourceRest) × k, so a rig whose origin is the body
 *   centre (hips below the origin) does not float, and k — the ratio of the
 *   two rigs' hips-above-feet heights — keeps a shorter or taller character
 *   from floating or sinking. Without foot bones k falls back to the ratio of
 *   the hips' rest offsets.
 * Call it on the rig in its bind pose (a fresh load or clone, before playing).
 */
export function retarget(clip: THREE.AnimationClip, target: THREE.Object3D, source: THREE.Object3D): THREE.AnimationClip {
  const bones = new Set<string>();
  target.traverse((o) => bones.add(o.name));
  const th = target.getObjectByName(HIPS);
  const sh = source.getObjectByName(HIPS);
  const ratio = th && sh && sh.position.length() > 0 ? th.position.length() / sh.position.length() : 1;
  const tl = th && legHeight(target, th);
  const sl = sh && legHeight(source, sh);
  const k = tl && sl ? tl / sl : ratio;
  const tr = th ? th.position.toArray() : [0, 0, 0];
  const sr = sh ? sh.position.toArray() : [0, 0, 0];

  const tracks: THREE.KeyframeTrack[] = [];
  for (const t of clip.tracks) {
    const dot = t.name.lastIndexOf('.');
    const node = t.name.slice(0, dot);
    const prop = t.name.slice(dot + 1);
    if (!bones.has(node)) continue;
    if (prop === 'quaternion') tracks.push(t);
    else if (prop === 'position' && node === HIPS) {
      const s = t.clone();
      for (let i = 0; i < s.values.length; i++) s.values[i] = tr[i % 3] + (s.values[i] - sr[i % 3]) * k;
      tracks.push(s);
    }
  }
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
