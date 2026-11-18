// Which grip a held prop uses: game override > info file grip > shape estimate, and how the
// override and the weapon kind are read.
import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import * as THREE from 'three';
import type { AssetMeta } from './assetMeta';
import { gripFromMeta, gripMatrix, kindOf, resolveGrip, type Grip, type GripOverride } from './grip';

/** A 2-unit long box along +X with a 0.5 node scale: 1 model unit long after the node transform. */
function stick() {
  const root = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.1));
  m.scale.setScalar(0.5);
  m.position.x = 0.5; // spans x 0..1 in scene coordinates
  root.add(m);
  return root;
}
const G: Grip = { kind: 'gun', point: [0.2, 0, 0], forward: [1, 0, 0], up: [0, 1, 0], lengthM: 0.8, review: 'checked' };
const meta = (extra: Record<string, unknown>) => ({ v: 1, ...extra }) as AssetMeta;

let warn: ReturnType<typeof spyOn>;
beforeEach(() => {
  warn = spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('grip from the info file', () => {
  test('a valid grip is used as-is', () => {
    expect(gripFromMeta(meta({ grip: G }))).toEqual(G);
    const r = resolveGrip(stick(), { grip: G });
    expect(r.source).toBe('meta');
    expect(r.grip).toEqual(G);
  });
  test('malformed grips are no grip', () => {
    expect(gripFromMeta(meta({ grip: { ...G, forward: [1, 0] } }))).toBeNull();
    expect(gripFromMeta(meta({ grip: { ...G, up: [2, 0, 0] } }))).toBeNull(); // parallel to forward
    expect(gripFromMeta(meta({ grip: { ...G, lengthM: 0 } }))).toBeNull();
    expect(gripFromMeta(meta({}))).toBeNull();
    expect(gripFromMeta(null)).toBeNull();
  });
  test('a kind this code does not know is no grip: its pose is not used, the estimate holds it', () => {
    const unknown = meta({ grip: { ...G, kind: 'sling' }, tags: ['3d', 'objects', 'weapons ranged'] });
    expect(gripFromMeta(unknown)).toBeNull();
    const kind = kindOf(unknown, 'https://agent8-games.verse8.io/assets/3d/objects/weapons%20ranged/sling.glb');
    expect(kind).toBe('gun'); // from the tags, not the unknown kind
    const r = resolveGrip(stick(), { grip: gripFromMeta(unknown), kind });
    expect(r.source).toBe('estimate');
    expect(r.grip.point).not.toEqual(G.point);
  });
  test('no grip -> shape estimate', () => {
    const est = resolveGrip(stick(), { grip: null, kind: 'gun' });
    expect(est.source).toBe('estimate');
    expect(est.grip.kind).toBe('gun');
    expect(est.grip.lengthM).toBe(0.7);
  });
});

describe('game override', () => {
  test('length and kind replace the info file values one by one', () => {
    const o = resolveGrip(stick(), { grip: G, override: { lengthM: 1.2 } });
    expect(o.source).toBe('override');
    expect(o.overridden).toEqual(['lengthM']);
    expect(o.grip).toEqual({ ...G, lengthM: 1.2 });
  });
  test('the pose replaces point, forward and up together', () => {
    const pose = { point: [0.5, 0, 0], forward: [-1, 0, 0], up: [0, 0, 1] } as const;
    const o = resolveGrip(stick(), { grip: G, override: { ...pose } as GripOverride });
    expect(o.grip.point).toEqual([0.5, 0, 0]);
    expect(o.grip.forward).toEqual([-1, 0, 0]);
    expect(o.grip.up).toEqual([0, 0, 1]);
    expect(o.grip.lengthM).toBe(G.lengthM);
    // without an info file the pose override needs no estimate
    expect(resolveGrip(stick(), { grip: null, kind: 'blade', override: { ...pose } as GripOverride }).grip.point).toEqual([0.5, 0, 0]);
  });
  test('half a pose is ignored with one warning, the info file pose stays', () => {
    const half = { point: [0.5, 0, 0], lengthM: 1 } as unknown as GripOverride; // what untyped game code could pass
    const o = resolveGrip(stick(), { grip: G, override: half });
    expect(o.grip.point).toEqual(G.point);
    expect(o.grip.lengthM).toBe(1);
    expect(o.overridden).toEqual(['lengthM']);
    resolveGrip(stick(), { grip: G, override: half });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('weapon kind without a grip', () => {
  test('info file kind and tags win over the URL', () => {
    const url = 'https://agent8-games.verse8.io/assets/3d/objects/weapons%20melee/x.glb';
    expect(kindOf(meta({ grip: { kind: 'polearm' } }), url)).toBe('polearm');
    expect(kindOf(meta({ kind: 'gun' }), url)).toBe('gun');
    expect(kindOf(meta({ tags: ['3d', 'objects', 'weapons ranged'] }), url)).toBe('gun');
    expect(kindOf(meta({ tags: ['3d', 'objects', 'weapons melee'] }), 'https://x/rifle.glb')).toBe('blade');
  });
  test('no info file: words in the file name, else held like a blade (torch, staff)', () => {
    expect(kindOf(null, 'https://x/assets/my_rifle.glb')).toBe('gun');
    expect(kindOf(null, 'https://agent8-games.verse8.io/assets/3d/weapons/ak47.glb')).toBe('gun');
    expect(kindOf(null, 'https://x/assets/war_axe.glb')).toBe('hafted');
    expect(kindOf(null, 'https://x/assets/long_spear.glb')).toBe('polearm');
    expect(kindOf(null, 'https://x/assets/torch.glb')).toBe('blade');
  });
  test('bows: from the file name under ranged tags or alone; crossbows are guns', () => {
    const ranged = meta({ tags: ['3d', 'objects', 'weapons ranged'] });
    expect(kindOf(ranged, 'https://x/assets/blue_gem_recurve_bow.glb')).toBe('bow');
    expect(kindOf(ranged, 'https://x/assets/gem_inlaid_crossbow.glb')).toBe('gun');
    expect(kindOf(null, 'https://x/assets/longbow.glb')).toBe('bow');
    expect(kindOf(null, 'https://x/assets/simple_wood_crossbow.glb')).toBe('gun');
  });
});

describe('model -> hand frame', () => {
  test('point maps to the hand-frame origin, forward to hand +X (gun), real length = lengthM', () => {
    const s = stick();
    const { matrix, lengthModel, scale } = gripMatrix(s, G);
    expect(lengthModel).toBeCloseTo(1, 5);
    expect(scale).toBeCloseTo(0.8, 5);
    const p = new THREE.Vector3(...G.point).applyMatrix4(matrix);
    expect(p.length()).toBeLessThan(1e-6);
    const tip = new THREE.Vector3(1, 0, 0).applyMatrix4(matrix);
    expect(tip.x).toBeCloseTo(0.8 * 0.8, 5); // tip is 0.8 model units ahead of the grip
  });
  test('bow: held like a gun (arrow along the finger, upper limb up), scale = lengthM / extent along forward', () => {
    // a bow 0.5 units deep along -X (string -> riser, the arrow's way) and 2 units tall (the limbs)
    const bow = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.05));
    m.position.set(-0.25, 1, 0);
    bow.add(m);
    const B: Grip = { kind: 'bow', point: [-0.1, 1, 0], forward: [-1, 0, 0], up: [0, 1, 0], lengthM: 0.547 };
    expect(gripFromMeta(meta({ grip: B }))).toEqual(B);
    const { matrix, lengthModel, scale } = gripMatrix(bow, B);
    expect(lengthModel).toBeCloseTo(0.5, 5); // along forward, not the 2-unit limb span
    expect(scale).toBeCloseTo(0.547 / 0.5, 5);
    const ahead = new THREE.Vector3(-0.5, 1, 0).applyMatrix4(matrix); // the riser front, 0.4 ahead of the grip
    expect(ahead.x).toBeCloseTo(0.4 * scale, 5);
    const top = new THREE.Vector3(-0.1, 2, 0).applyMatrix4(matrix); // upper limb tip
    expect(top.y).toBeCloseTo(1 * scale, 5);
    expect(Math.abs(top.x)).toBeLessThan(1e-6);
  });
});
