// holdInHand / gripFrame on real library hand rigs. hold.fixture.json is trimmed from the
// agent8-library character GLBs: a census of right-hand finger-root sets (most library characters
// are reduced rigs — one index chain, or the hand bone only) and, per class, the node chain
// scene root -> hand plus the finger roots.
import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import * as THREE from 'three';
import { gripFrame, handBones, holdInHand, type Side } from './hold';
import fixture from './hold.fixture.json';

type Node = { name: string; t?: number[]; r?: number[]; s?: number[] };
type RigData = { class: string; chain: Node[]; fingers: Node[] };
const RIGS = fixture.rigs as Record<string, RigData>;

/** The chain as GLTFLoader builds it, finger roots under the hand; `keep` filters the fingers. */
function build(d: RigData, keep: (name: string) => boolean = () => true) {
  const root = new THREE.Group();
  let parent: THREE.Object3D = root;
  const node = (n: Node) => {
    const o = n.name.startsWith('mixamorig') ? new THREE.Bone() : new THREE.Object3D();
    o.name = n.name;
    if (n.t) o.position.fromArray(n.t);
    if (n.r) o.quaternion.fromArray(n.r);
    if (n.s) o.scale.fromArray(n.s);
    return o;
  };
  for (const n of d.chain) {
    const o = node(n);
    parent.add(o);
    parent = o;
  }
  for (const f of d.fingers) if (keep(f.name)) parent.add(node(f));
  root.updateMatrixWorld(true);
  return root;
}
const sideOf = (key: string) => key.split('#')[1] as Side;

/** The grip frame in world space: fist centre and its three axes. */
function worldFrame(root: THREE.Object3D, side: Side) {
  const b = handBones(root, side)!;
  const f = gripFrame(b, side);
  const m = b.hand.matrixWorld.clone().multiply(f.matrix);
  const o = new THREE.Vector3(), x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3();
  m.extractBasis(x, y, z);
  o.setFromMatrixPosition(m);
  return { from: f.from, origin: o, fwd: x.normalize(), up: y.normalize(), palm: z.normalize(), wrist: b.hand.getWorldPosition(new THREE.Vector3()), scale: new THREE.Vector3().setFromMatrixScale(b.hand.matrixWorld).x };
}
const deg = (a: THREE.Vector3, b: THREE.Vector3) => THREE.MathUtils.radToDeg(a.angleTo(b));

let warn: ReturnType<typeof spyOn>;
beforeEach(() => {
  warn = spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('library hand rigs', () => {
  test('census: most characters are reduced rigs, and every class has a sample here', () => {
    const c = fixture.census as Record<string, number>;
    const total = Object.values(c).reduce((s, n) => s + n, 0);
    const full = c['Index+Middle+Pinky+Ring+Thumb'] + c['Index+Middle+Ring+Thumb'];
    expect(total).toBe(327);
    expect(full).toBe(75);
    expect(c['Index']).toBe(124); // knight-templar: RightHandIndex1-4 only
    expect(c['hand only'] + c['no hand bone']).toBe(18);
    const sampled = new Set(Object.values(RIGS).map((r) => r.class));
    for (const k of Object.keys(c)) expect(sampled.has(k)).toBe(true);
  });

  test('every rig with a hand bone gets a hold: in the hand, real size, finite', () => {
    for (const [key, d] of Object.entries(RIGS)) {
      if (d.class === 'no hand bone') continue;
      const side = sideOf(key);
      const root = build(d);
      const held = holdInHand(root, new THREE.Group(), side);
      expect(held).not.toBeNull();
      root.updateMatrixWorld(true);
      // the holder cancels the bone's world scale: the prop keeps its size in metres
      expect(new THREE.Vector3().setFromMatrixScale(held!.holder.matrixWorld).x).toBeCloseTo(1, 4);
      const w = worldFrame(root, side);
      expect(w.from).toBe(/Pinky|Ring|Index\+Middle/.test(d.class) ? 'fingers' : 'hand');
      // the fist centre sits in front of the wrist, about a hand's length out (any character size)
      const hand = handBones(root, side)!.hand;
      const forearm = hand.parent!.getWorldPosition(new THREE.Vector3()).distanceTo(w.wrist);
      const reach = w.origin.distanceTo(w.wrist) / forearm;
      expect(reach).toBeGreaterThan(0.1);
      expect(reach).toBeLessThan(0.8);
      expect(w.origin.clone().sub(w.wrist).dot(w.fwd)).toBeGreaterThan(0);
    }
  });

  test('a rig with no hand bone: one warning, nothing attached, no throw', () => {
    const d = Object.entries(RIGS).find(([, r]) => r.class === 'no hand bone')!;
    const root = build(d[1]);
    root.name = 'trumble';
    expect(holdInHand(root, new THREE.Group())).toBeNull();
    expect(holdInHand(root, new THREE.Group())).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('a full rig read as hand-only stays close to its finger frame', () => {
    for (const [key, d] of Object.entries(RIGS)) {
      if (!/Pinky/.test(d.class)) continue;
      const side = sideOf(key);
      const full = worldFrame(build(d), side);
      const bare = worldFrame(build(d, () => false), side);
      expect(full.from).toBe('fingers');
      expect(bare.from).toBe('hand');
      const handLen = full.origin.distanceTo(full.wrist);
      // palm side agrees; fingers spread up to ~37° off the hand bone's +Y in the library
      expect(deg(full.palm, bare.palm)).toBeLessThan(10);
      expect(deg(full.fwd, bare.fwd)).toBeLessThan(40);
      // fist centre within a quarter of the hand length (measured: 0.05–0.16, ≤ 1.8 cm)
      expect(bare.origin.distanceTo(full.origin)).toBeLessThan(0.25 * handLen);
    }
  });

  // Bind poses differ per character (T / A pose), but a shared clip sets the same hand bone
  // rotations on both, so the frame that matters is the one in the hand bone's own space.
  test('knight-templar (index chain only) is held like the base character, both hands', () => {
    const local = (key: string, side: Side) => {
      const f = gripFrame(handBones(build(RIGS[key]), side)!, side);
      const x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3();
      f.matrix.extractBasis(x, y, z);
      return { from: f.from, x, y, z };
    };
    for (const side of ['Right', 'Left'] as Side[]) {
      const base = local(`characters/realistic style/base-model.glb#${side}`, side);
      const knight = local(`characters/realistic style/knight-templar.glb#${side}`, side);
      expect(base.from).toBe('fingers');
      expect(knight.from).toBe('hand');
      expect(deg(base.x, knight.x)).toBeLessThan(20);
      expect(deg(base.y, knight.y)).toBeLessThan(20);
      expect(deg(base.z, knight.z)).toBeLessThan(5);
    }
  });
});
