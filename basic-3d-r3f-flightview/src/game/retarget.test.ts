// retarget() on real verse8 rigs: the shared idle must keep the feet on the
// ground both for a rig whose origin is at its feet (base-model, the player)
// and for one whose origin is the body centre (casual style/02, hips below
// the origin), after fitModel's lift. retarget.fixture.json is trimmed from
// the CDN GLBs: node trees (TRS; skinned meshes keep their POSITION bounds,
// which is the box fitModel measures) and the idle's hips + leg tracks.
import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import { retarget } from './anim';
import fixture from './retarget.fixture.json';

type Node = { name: string; t?: number[]; r?: number[]; s?: number[]; box?: { min: number[]; max: number[] }; skinned?: boolean; children?: Node[] };

const HEIGHT = 1.7;
const FOOT = /(Foot|Toe\w*)$/;

/** The node tree as GLTFLoader builds it (a Group of root nodes). */
function build(nodes: Node[]) {
  const root = new THREE.Group();
  const add = (n: Node, parent: THREE.Object3D) => {
    const o = n.name.startsWith('mixamorig') ? new THREE.Bone() : new THREE.Object3D();
    o.name = n.name;
    if (n.t) o.position.fromArray(n.t);
    if (n.r) o.quaternion.fromArray(n.r);
    if (n.s) o.scale.fromArray(n.s);
    if (n.box) o.userData.box = n.box;
    if (n.skinned) o.userData.skinned = true;
    parent.add(o);
    n.children?.forEach((c) => add(c, o));
  };
  nodes.forEach((n) => add(n, root));
  return root;
}

/** fitModel's unit / lift for HEIGHT, from the mesh boxes (skinned: already in scene space). */
function fit(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  scene.traverse((o) => {
    const b = o.userData.box;
    if (!b) return;
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? b.max[0] : b.min[0], i & 2 ? b.max[1] : b.min[1], i & 4 ? b.max[2] : b.min[2]);
      box.expandByPoint(o.userData.skinned ? p : p.applyMatrix4(o.matrixWorld));
    }
  });
  const unit = HEIGHT / (box.max.y - box.min.y);
  return { unit, lift: -box.min.y * unit };
}

const idle = new THREE.AnimationClip(
  'idle',
  fixture.idle.clip.duration,
  fixture.idle.clip.tracks.map((t) =>
    t.type === 'position' ? new THREE.VectorKeyframeTrack(t.name, t.times, t.values) : new THREE.QuaternionKeyframeTrack(t.name, t.times, t.values),
  ),
);

/** The previous retarget (hips position × rest-offset length ratio), kept to compare the player against. */
function legacyRetarget(clip: THREE.AnimationClip, target: THREE.Object3D, source: THREE.Object3D) {
  const th = target.getObjectByName('mixamorigHips')!;
  const sh = source.getObjectByName('mixamorigHips')!;
  const ratio = th.position.length() / sh.position.length();
  const tracks = clip.tracks
    .filter((t) => target.getObjectByName(t.name.slice(0, t.name.lastIndexOf('.'))))
    .map((t) => {
      if (!t.name.endsWith('.position')) return t;
      const s = t.clone();
      for (let i = 0; i < s.values.length; i++) s.values[i] *= ratio;
      return s;
    });
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

/** Lowest foot bone height (m, after fitModel) at each of 60 frames of the idle at 30 fps. */
function lowestFoot(rig: keyof typeof fixture.rigs, how = retarget) {
  const scene = build(fixture.rigs[rig] as Node[]);
  const { unit, lift } = fit(scene);
  const feet: THREE.Object3D[] = [];
  scene.traverse((o) => FOOT.test(o.name) && feet.push(o));
  const mixer = new THREE.AnimationMixer(scene);
  mixer.clipAction(how(idle, scene, build(fixture.idle.rig as Node[]))).play();
  const v = new THREE.Vector3();
  const ys: number[] = [];
  for (let f = 0; f < 60; f++) {
    mixer.update(1 / 30);
    scene.updateMatrixWorld(true);
    ys.push(Math.min(...feet.map((o) => o.getWorldPosition(v).y)) * unit + lift);
  }
  return ys;
}

describe('retarget keeps the feet on the ground', () => {
  test('origin-at-centre mixamo rig (casual style/02) does not float on the shared idle', () => {
    const ys = lowestFoot('male_grandfather_glasses_green');
    for (const y of ys.slice(5)) expect(Math.abs(y)).toBeLessThan(0.05);
    // the previous retarget lifted this rig ~0.58 m
    expect(Math.min(...lowestFoot('male_grandfather_glasses_green', legacyRetarget))).toBeGreaterThan(0.4);
  });

  test('origin-at-feet rig (base-model) stays on the ground', () => {
    for (const y of lowestFoot('base-model').slice(5)) expect(Math.abs(y)).toBeLessThan(0.05);
  });

  test('the player (base-model) moves as before: within 5 mm of the previous retarget every frame', () => {
    const now = lowestFoot('base-model');
    const before = lowestFoot('base-model', legacyRetarget);
    now.forEach((y, i) => expect(Math.abs(y - before[i])).toBeLessThan(0.005));
  });
});
