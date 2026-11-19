// The hold part (hold.ts): a weapon that follows the hand on any rig — full fingers, a few
// fingers, a bare hand bone, no hand at all — without ever throwing, and on the real library hand
// rigs (hold.fixture.json, trimmed from the agent8-library character GLBs: a census of right-hand
// finger-root sets — most library characters are reduced rigs — and per class the node chain
// scene root -> hand plus the finger roots). Grip values: grip.test.ts.
import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import type { Grip } from './grip';
import { clampYaw, findHand, followAim, gripFrame, holdInHand, MAX_BARREL_YAW, type HandFit, type Muzzle, type Side } from './hold';
import fixture from './hold.fixture.json';

type RigOpts = { fingers?: 'all' | 'thumb-index' | 'none'; hands?: boolean; names?: 'mixamo' | 'claythis'; scale?: number };
/**
 * A rig facing +z: right hand at (−0.2, 1.2, 0.3), left hand at (0, 1.25, 0.55) — 0.32 m apart,
 * the left one in front, like the rifle clips hold it.
 */
function rig({ fingers = 'all', hands = true, names = 'mixamo', scale = 1 }: RigOpts = {}) {
  const n = (side: 'Right' | 'Left', part: string) =>
    names === 'mixamo' ? `mixamorig${side}${part}` : `${part === 'Hand' ? 'Hand' : part.replace('Hand', '')}_${side[0]}`;
  const root = new THREE.Group();
  root.scale.setScalar(scale);
  const inner = new THREE.Group();
  root.add(inner);
  // like a mixamo Armature at 0.01: bone offsets in centimetres, world scale 0.01 on every bone
  const k = 1 / scale;
  const at = (o: THREE.Object3D, p: [number, number, number]) => o.position.set(p[0] * k, p[1] * k, p[2] * k);
  const spine = new THREE.Bone();
  spine.name = 'mixamorigSpine';
  at(spine, [0, 1.2, 0]);
  inner.add(spine);
  const arm = (side: 'Right' | 'Left', fore: [number, number, number], hand: [number, number, number]) => {
    const f = new THREE.Bone();
    f.name = n(side, 'ForeArm');
    at(f, fore);
    spine.add(f);
    if (!hands) return;
    const h = new THREE.Bone();
    h.name = n(side, 'Hand');
    at(h, hand);
    f.add(h);
    const add = (part: string, p: [number, number, number]) => {
      const b = new THREE.Bone();
      b.name = names === 'mixamo' ? `mixamorig${side}Hand${part}1` : `${part === 'Pinky' ? 'Little' : part}1_${side[0]}`;
      at(b, p);
      h.add(b);
    };
    if (fingers === 'none') return;
    add('Thumb', [0.03, -0.02, 0.03]);
    add('Index', [0.02, 0, 0.09]);
    if (fingers === 'all') {
      add('Middle', [0, 0, 0.095]);
      add('Ring', [-0.015, 0, 0.09]);
      add('Pinky', [-0.03, 0, 0.085]);
    }
  };
  arm('Right', [-0.2, 0, 0.1], [0, 0, 0.2]);
  arm('Left', [0, 0.05, 0.3], [0, 0, 0.25]);
  root.updateMatrixWorld(true);
  return root;
}

const muzzle = (): Muzzle => ({ x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0, valid: false });
const tipLocal = new THREE.Vector3(0, 0.05, 0.6);
function hold(r: THREE.Object3D, kind: Grip['kind'], extra: Partial<Parameters<typeof holdInHand>[2]> = {}) {
  const m = muzzle();
  const held = holdInHand(r, new THREE.Group(), { kind, muzzle: m, tip: tipLocal, ...extra });
  const scene = new THREE.Scene();
  scene.add(r);
  scene.updateMatrixWorld(true); // what the renderer does before each frame
  const pos = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  held.holder.matrixWorld.decompose(pos, q, s);
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
  return { held, m, pos, fwd, s, scene };
}

describe('holding never takes the game down', () => {
  const cases: [string, RigOpts, string][] = [
    ['mixamo, all fingers', {}, 'fingers'],
    ['claythis names', { names: 'claythis' }, 'fingers'],
    ['thumb + index only (armored-soldier)', { fingers: 'thumb-index' }, 'partial'],
    ['hand bone, no fingers', { fingers: 'none' }, 'hand'],
    ['no hand bones', { hands: false }, 'body'],
    ['0.01-scaled armature', { scale: 0.01 }, 'fingers'],
  ];
  for (const [label, opts, fit] of cases) {
    for (const kind of ['gun', 'blade'] as const) {
      test(`${label} · ${kind}: attaches (${fit}), finite, metre scale, never throws`, () => {
        const r = rig(opts);
        const { held, pos, s, m } = hold(r, kind);
        expect(held.fit).toBe(fit as never);
        expect(held.holder.visible).toBe(true);
        expect(held.holder.matrixWorld.elements.every(Number.isFinite)).toBe(true);
        expect(s.x).toBeCloseTo(1, 4);
        if (opts.hands !== false) {
          // the grip sits within a hand's length of the hand bone
          const hand = findHand(r, 'Right')!.getWorldPosition(new THREE.Vector3());
          expect(pos.distanceTo(hand)).toBeLessThan(0.12);
        } else {
          expect(pos.y).toBeGreaterThan(0.8); // chest height, in front of the body
          expect(pos.z).toBeGreaterThan(0);
        }
        if (kind === 'gun') expect(m.valid).toBe(true);
      });
    }
  }

  test('an error while placing hides the weapon instead of throwing', () => {
    const r = rig();
    const left = findHand(r, 'Left')!;
    left.updateWorldMatrix = () => {
      throw new Error('broken bone');
    };
    const warn = console.warn;
    console.warn = () => {};
    try {
      const { held, m, scene } = hold(r, 'gun');
      expect(held.holder.visible).toBe(false);
      expect(m.valid).toBe(false);
      expect(() => scene.updateMatrixWorld(true)).not.toThrow();
    } finally {
      console.warn = warn;
    }
  });

  test('dispose takes the weapon off the rig', () => {
    const r = rig();
    const { held } = hold(r, 'gun');
    held.dispose();
    expect(held.holder.parent).toBeNull();
  });
});

describe('gun: two hands and aim', () => {
  test('the barrel lies from the grip hand toward the support hand', () => {
    const r = rig();
    const { pos, fwd, m } = hold(r, 'gun');
    const left = findHand(r, 'Left')!;
    const leftFist = new THREE.Vector3().setFromMatrixPosition(gripFrame(left).frame).applyMatrix4(left.matrixWorld);
    expect(fwd.angleTo(leftFist.sub(pos).normalize())).toBeLessThan(1e-3);
    // the muzzle is reported at the tip, along the barrel
    const tip = new THREE.Vector3(m.x, m.y, m.z);
    expect(tip.distanceTo(pos)).toBeCloseTo(tipLocal.length(), 4);
    expect(new THREE.Vector3(m.dx, m.dy, m.dz).angleTo(fwd)).toBeLessThan(1e-4);
  });
  test('a support hand behind the body or out of reach → the body facing', () => {
    const r = rig({ fingers: 'thumb-index' });
    findHand(r, 'Left')!.position.set(0, 0, -1.2); // far behind
    r.updateMatrixWorld(true);
    const { fwd } = hold(r, 'gun');
    expect(fwd.angleTo(new THREE.Vector3(0, 0, 1))).toBeLessThan(1e-3);
  });
  test('aim with weight 1 points the barrel at the aim; the sights stay up', () => {
    const r = rig();
    const yaw = (40 * Math.PI) / 180; // inside the 60° cap, a little up
    const aim = { yaw, pitch: 0.2, weight: 1 };
    const { fwd, held } = hold(r, 'gun', { aim });
    const want = new THREE.Vector3(Math.sin(yaw) * Math.cos(0.2), Math.sin(0.2), Math.cos(yaw) * Math.cos(0.2));
    expect(fwd.angleTo(want)).toBeLessThan(1e-3);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion().setFromRotationMatrix(held.holder.matrixWorld));
    expect(up.y).toBeGreaterThan(0.9);
  });
  test('follows the rig when the body turns', () => {
    const r = rig({ hands: false });
    r.rotation.y = Math.PI / 2; // facing +x
    const { fwd } = hold(r, 'gun');
    expect(fwd.angleTo(new THREE.Vector3(1, 0, 0))).toBeLessThan(1e-3);
  });
});

describe('aiming: the body follows, the barrel never goes through the body', () => {
  const deg = (r: number) => (r * 180) / Math.PI;
  const yawOfDir = (v: THREE.Vector3) => Math.atan2(v.x, v.z);
  const diff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

  for (const off of [0, 90, 180]) {
    test(`aim ${off}° off the facing: the body turns onto it within 0.5 s`, () => {
      const parentYaw = 0.3; // where the movement code points the body
      const aim = { yaw: parentYaw + (off * Math.PI) / 180, pitch: 0, weight: 1 };
      let y = 0;
      for (let t = 0; t < 0.5; t += 1 / 60) y = followAim(y, parentYaw, aim, 1 / 60);
      expect(deg(diff(parentYaw + y, aim.yaw))).toBeLessThan(1);
    });
    test(`aim ${off}° off a body that does not turn: barrel within ${Math.round(deg(MAX_BARREL_YAW))}° of the body`, () => {
      const r = rig();
      const aim = { yaw: (off * Math.PI) / 180, pitch: 0, weight: 1 };
      const { fwd } = hold(r, 'gun', { aim });
      expect(deg(diff(yawOfDir(fwd), 0))).toBeLessThanOrEqual(deg(MAX_BARREL_YAW) + 1e-6);
      if (off === 0) expect(deg(diff(yawOfDir(fwd), 0))).toBeLessThan(0.1);
    });
  }
  test('half weight turns the body half way; no aim or weight 0 eases back to the facing', () => {
    let y = 0;
    for (let i = 0; i < 120; i++) y = followAim(y, 0, { yaw: 1, pitch: 0, weight: 0.5 }, 1 / 60);
    expect(y).toBeCloseTo(0.5, 3);
    for (let i = 0; i < 120; i++) y = followAim(y, 0, undefined, 1 / 60);
    expect(Math.abs(y)).toBeLessThan(1e-3);
    expect(followAim(0, 0, { yaw: 2, pitch: 0, weight: 0 }, 1 / 60)).toBe(0);
  });
  test('the cap keeps pitch and leaves directions inside it alone', () => {
    const body = new THREE.Vector3(0, 0, 1);
    const inside = new THREE.Vector3(Math.sin(0.5), 0.2, Math.cos(0.5));
    expect(clampYaw(inside.clone(), body).distanceTo(inside)).toBeLessThan(1e-9);
    const behind = clampYaw(new THREE.Vector3(0, 0.3, -1), body);
    expect(behind.y).toBe(0.3);
    expect(deg(diff(yawOfDir(behind), 0))).toBeCloseTo(60, 5);
  });
});

describe('melee: follows the wrist', () => {
  test('turning the hand bone turns the blade with it', () => {
    const r = rig();
    const { held, fwd, scene } = hold(r, 'blade');
    const hand = findHand(r, 'Right')!;
    hand.rotateY(Math.PI / 2); // the blade runs along the knuckle line (hand x): turn about y
    scene.updateMatrixWorld(true);
    const q = new THREE.Quaternion().setFromRotationMatrix(held.holder.matrixWorld);
    const after = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    expect(after.angleTo(fwd)).toBeCloseTo(Math.PI / 2, 2);
  });
});

describe('bow: by the riser, no muzzle', () => {
  test('the arrow points where the fingers point, the upper limb out of the top of the fist; muzzle not valid', () => {
    const r = rig();
    const { held, m } = hold(r, 'bow');
    const hand = findHand(r, 'Right')!;
    const frame = hand.matrixWorld.clone().multiply(gripFrame(hand, 'Right').frame);
    const fx = new THREE.Vector3(), fy = new THREE.Vector3(), fz = new THREE.Vector3();
    frame.extractBasis(fx, fy, fz);
    const q = new THREE.Quaternion().setFromRotationMatrix(held.holder.matrixWorld);
    expect(new THREE.Vector3(0, 0, 1).applyQuaternion(q).angleTo(fx.normalize())).toBeLessThan(1e-3);
    expect(new THREE.Vector3(0, 1, 0).applyQuaternion(q).angleTo(fy.normalize())).toBeLessThan(1e-3);
    expect(m.valid).toBe(false);
  });
});

// ---- the real library hand rigs (hold.fixture.json) ----
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
const fullFit = (cls: string): HandFit => (/Pinky|Ring|Index\+Middle/.test(cls) ? 'fingers' : cls === 'hand only' ? 'hand' : 'partial');

/** The grip frame in world space: fist centre and its three axes. */
function worldFrame(root: THREE.Object3D, side: Side) {
  const hand = findHand(root, side)!;
  const f = gripFrame(hand, side);
  const m = hand.matrixWorld.clone().multiply(f.frame);
  const o = new THREE.Vector3(), x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3();
  m.extractBasis(x, y, z);
  o.setFromMatrixPosition(m);
  return { fit: f.fit, origin: o, fwd: x.normalize(), up: y.normalize(), palm: z.normalize(), wrist: hand.getWorldPosition(new THREE.Vector3()) };
}
const angle = (a: THREE.Vector3, b: THREE.Vector3) => THREE.MathUtils.radToDeg(a.angleTo(b));

describe('library hand rigs', () => {
  test('census: most characters are reduced rigs, and every class has a sample here', () => {
    const c = fixture.census as Record<string, number>;
    const total = Object.values(c).reduce((s, n) => s + n, 0);
    expect(total).toBe(327);
    expect(c['Index+Middle+Pinky+Ring+Thumb'] + c['Index+Middle+Ring+Thumb']).toBe(75);
    expect(c['Index']).toBe(124); // knight-templar: RightHandIndex1-4 only
    expect(c['hand only'] + c['no hand bone']).toBe(18);
    const sampled = new Set(Object.values(RIGS).map((r) => r.class));
    for (const k of Object.keys(c)) expect(sampled.has(k)).toBe(true);
  });

  test('every rig with a hand bone holds a weapon in the hand: real size, finite, in front of the wrist', () => {
    for (const [key, d] of Object.entries(RIGS)) {
      if (d.class === 'no hand bone') continue;
      const side = sideOf(key);
      const root = build(d);
      const held = holdInHand(root, new THREE.Group(), { kind: 'blade', side });
      const scene = new THREE.Scene();
      scene.add(root);
      scene.updateMatrixWorld(true);
      expect(held.hand).toBeDefined();
      expect(held.holder.visible).toBe(true);
      // the holder cancels the bone's world scale: the weapon keeps its size in metres
      expect(new THREE.Vector3().setFromMatrixScale(held.holder.matrixWorld).x).toBeCloseTo(1, 4);
      const w = worldFrame(root, side);
      expect(w.fit).toBe(fullFit(d.class));
      // the fist centre sits in front of the wrist, about a hand's length out (any character size)
      const forearm = held.hand!.parent!.getWorldPosition(new THREE.Vector3()).distanceTo(w.wrist);
      const reach = w.origin.distanceTo(w.wrist) / forearm;
      expect(reach).toBeGreaterThan(0.1);
      expect(reach).toBeLessThan(0.8);
      expect(w.origin.clone().sub(w.wrist).dot(w.fwd)).toBeGreaterThan(0);
    }
  });

  test('a rig with no hand bone: held in front of the body, no throw', () => {
    const d = Object.values(RIGS).find((r) => r.class === 'no hand bone')!;
    const root = build(d);
    const held = holdInHand(root, new THREE.Group(), { kind: 'gun' });
    expect(held.fit).toBe('body');
    const scene = new THREE.Scene();
    scene.add(root);
    expect(() => scene.updateMatrixWorld(true)).not.toThrow();
    expect(held.holder.matrixWorld.elements.every(Number.isFinite)).toBe(true);
  });

  test('a full rig read as a bare hand stays close to its finger frame', () => {
    for (const [key, d] of Object.entries(RIGS)) {
      if (!/Pinky/.test(d.class)) continue;
      const side = sideOf(key);
      const full = worldFrame(build(d), side);
      const bare = worldFrame(build(d, () => false), side);
      expect(full.fit).toBe('fingers');
      expect(bare.fit).toBe('hand');
      const handLen = full.origin.distanceTo(full.wrist);
      // fingers spread up to ~37° off the hand bone's +Y in the library
      expect(angle(full.fwd, bare.fwd)).toBeLessThan(40);
      expect(angle(full.up, bare.up)).toBeLessThan(40);
      // fist centre within a third of the hand length
      expect(bare.origin.distanceTo(full.origin)).toBeLessThan(0.35 * handLen);
    }
  });

  // Bind poses differ per character (T / A pose), but a shared clip sets the same hand bone
  // rotations on both, so the frame that matters is the one in the hand bone's own space.
  for (const [name, cls] of [['knight-templar', 'index chain only']] as const) {
    test(`${name} (${cls}) is held like the base character, both hands`, () => {
      const local = (key: string, side: Side) => {
        const f = gripFrame(findHand(build(RIGS[key]), side)!, side);
        const x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3();
        f.frame.extractBasis(x, y, z);
        return { fit: f.fit, x, y, z };
      };
      for (const side of ['Right', 'Left'] as Side[]) {
        const key = `characters/realistic style/${name}.glb#${side}`;
        if (!RIGS[key]) throw new Error(`fixture has no ${key}`);
        const base = local(`characters/realistic style/base-model.glb#${side}`, side);
        const other = local(key, side);
        expect(base.fit).toBe('fingers');
        expect(other.fit).toBe('partial');
        expect(angle(base.x, other.x)).toBeLessThan(20);
        expect(angle(base.y, other.y)).toBeLessThan(20);
        expect(angle(base.z, other.z)).toBeLessThan(20);
      }
    });
  }
});
