// The hold part (hold.ts + grip.ts): grip values by URL, and a weapon that follows the hand on any
// rig — full fingers, a few fingers, a bare hand bone, no hand at all — without ever throwing.
import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import { gripForUrl, gripMatrix, kindOf, libraryKey, resolveGrip, validGrip, type Grip } from './grip';
import { clampYaw, findHand, followAim, gripFrame, holdInHand, MAX_BARREL_YAW, type Muzzle } from './hold';

const box = (len: number) => {
  const root = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.05));
  m.position.x = len / 2; // spans x 0..len
  root.add(m);
  return root;
};
const verts = (o: THREE.Object3D) => {
  const out: number[] = [];
  o.updateMatrixWorld(true);
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!m.isMesh) return;
    const p = m.geometry.getAttribute('position');
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      out.push(v.x, v.y, v.z);
    }
  });
  return new Float32Array(out);
};
const G: Grip = { kind: 'gun', point: [0.2, 0, 0], forward: [1, 0, 0], up: [0, 1, 0], lengthM: 0.8 };

describe('grip values', () => {
  test('library key ignores host, 3d / 3D, %20 and case', () => {
    expect(libraryKey('https://agent8-games.verse8.io/assets/3D/objects/weapons%20ranged/Tactical_Frontgrip_Rifle.glb')).toBe('objects/weapons ranged/tactical_frontgrip_rifle.glb');
    expect(libraryKey('https://agent8-games.verse8.io/assets/3d/weapons/ak47.glb')).toBe('weapons/ak47.glb');
    expect(libraryKey('/models/my-sword.glb')).toBeNull();
  });
  test('the table answers by URL; unknown URLs fall back to a kind from the name', () => {
    const g = gripForUrl('https://agent8-games.verse8.io/assets/3D/objects/weapons ranged/tactical_frontgrip_rifle.glb');
    expect(g?.kind).toBe('gun');
    expect(g?.muzzleTip).toHaveLength(3);
    expect(gripForUrl('https://agent8-games.verse8.io/assets/3d/weapons/ak47.glb')?.lengthM).toBeCloseTo(0.88, 5);
    expect(gripForUrl('https://x/assets/3d/objects/weapons ranged/not_in_table_rifle.glb')).toBeNull();
    expect(kindOf('https://x/assets/3d/objects/weapons ranged/not_in_table_rifle.glb')).toBe('gun');
    expect(kindOf('https://x/assets/3d/objects/weapons melee/rusty_axe.glb')).toBe('hafted');
  });
  test('malformed values are rejected', () => {
    expect(validGrip(G)).toEqual(G);
    expect(validGrip({ ...G, forward: [1, 0] })).toBeNull();
    expect(validGrip({ ...G, up: [2, 0, 0] })).toBeNull(); // parallel to forward
    expect(validGrip({ ...G, lengthM: 0 })).toBeNull();
  });
  test('order: game override > library value > estimate', () => {
    const pos = verts(box(1));
    const url = 'https://agent8-games.verse8.io/assets/3d/weapons/ak47.glb';
    expect(resolveGrip(pos, { url }).source).toBe('library');
    const part = resolveGrip(pos, { url, override: { lengthM: 1.2 } });
    expect(part.source).toBe('override');
    expect(part.grip.lengthM).toBe(1.2);
    expect(part.grip.point).toEqual(gripForUrl(url)!.point);
    expect(resolveGrip(pos, { url, override: G }).grip).toEqual(G);
    const est = resolveGrip(pos, { url: 'https://x/unknown_pistol.glb' });
    expect(est.source).toBe('estimate');
    expect(est.grip.kind).toBe('gun');
    expect(est.grip.lengthM).toBe(0.7);
  });
  test('grip point → origin, forward → +Z, real length = lengthM, tip at the front', () => {
    const { matrix, scale, lengthModel, tip } = gripMatrix(verts(box(1)), G);
    expect(lengthModel).toBeCloseTo(1, 5);
    expect(scale).toBeCloseTo(0.8, 5);
    expect(new THREE.Vector3(...G.point).applyMatrix4(matrix).length()).toBeLessThan(1e-6);
    expect(tip.z).toBeCloseTo(0.8 * 0.8, 4); // front is 0.8 model units ahead of the grip
  });
});

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
