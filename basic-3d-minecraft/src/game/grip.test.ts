// Which grip a held weapon uses: game override > asset info file grip > shape estimate, how the
// override and the weapon kind are read, and the model → held frame matrix with its muzzle tip.
import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import * as THREE from 'three';
import type { AssetMeta } from './assetMeta';
import { gripFromMeta, gripMatrix, kindOf, resetGripWarnings, resolveGrip, sceneVertices, type Grip, type GripOverride } from './grip';

/** A box along +X spanning x 0..len (scene coordinates), 0.1 tall. */
const box = (len: number) => {
  const root = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.05));
  m.position.x = len / 2;
  root.add(m);
  return sceneVertices(root);
};
const G: Grip = { kind: 'gun', point: [0.2, 0, 0], forward: [1, 0, 0], up: [0, 1, 0], lengthM: 0.8 };
const meta = (extra: Record<string, unknown>) => ({ v: 1, ...extra }) as AssetMeta;
// the production info file of weapons/ak47_lowpoly.glb (2026-11-18)
const AK47 = { forward: [1, 0, 0], kind: 'gun', lengthM: 0.88, muzzleTip: [0.47026, 0.02947, 0], point: [-0.02105, -0.05023, 0], review: 'checked', up: [0, 1, 0] };

let warn: ReturnType<typeof spyOn>;
beforeEach(() => {
  resetGripWarnings(); // the once-per-message warnings are module state: start each test (and each rerun) clean
  warn = spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('grip from the info file', () => {
  test('a valid grip is used as-is, muzzle tip included', () => {
    const g = gripFromMeta(meta({ grip: AK47, tags: ['3d', 'weapons'] }))!;
    expect(g).toEqual(AK47 as Grip);
    const r = resolveGrip(box(1), { grip: g });
    expect(r.source).toBe('meta');
    expect(r.grip).toEqual(g);
  });
  test('malformed grips are no grip', () => {
    expect(gripFromMeta(meta({ grip: { ...G, forward: [1, 0] } }))).toBeNull();
    expect(gripFromMeta(meta({ grip: { ...G, up: [2, 0, 0] } }))).toBeNull(); // parallel to forward
    expect(gripFromMeta(meta({ grip: { ...G, lengthM: 0 } }))).toBeNull();
    expect(gripFromMeta(meta({}))).toBeNull();
    expect(gripFromMeta(null)).toBeNull();
  });
  test('muzzleTip is a gun value only; a malformed one is dropped, the grip kept', () => {
    expect(gripFromMeta(meta({ grip: { ...G, kind: 'bow', muzzleTip: [1, 0, 0] } }))!.muzzleTip).toBeUndefined();
    expect(gripFromMeta(meta({ grip: { ...G, kind: 'blade', muzzleTip: [1, 0, 0] } }))!.muzzleTip).toBeUndefined();
    const bad = gripFromMeta(meta({ grip: { ...G, muzzleTip: [1, 0] } }))!;
    expect(bad.kind).toBe('gun');
    expect(bad.muzzleTip).toBeUndefined();
  });
  test('a kind this code does not know is no grip: its pose is not used, the estimate holds it', () => {
    const unknown = meta({ grip: { ...G, kind: 'sling' }, tags: ['3d', 'objects', 'weapons ranged'] });
    expect(gripFromMeta(unknown)).toBeNull();
    const kind = kindOf(unknown, 'https://agent8-games.verse8.io/assets/3d/objects/weapons%20ranged/sling.glb');
    expect(kind).toBe('gun'); // from the tags, not the unknown kind
    const r = resolveGrip(box(1), { grip: gripFromMeta(unknown), kind });
    expect(r.source).toBe('estimate');
    expect(r.grip.point).not.toEqual(G.point);
  });
  test('no grip -> shape estimate', () => {
    const est = resolveGrip(box(1), { grip: null, kind: 'gun' });
    expect(est.source).toBe('estimate');
    expect(est.grip.kind).toBe('gun');
    expect(est.grip.lengthM).toBe(0.7);
  });
});

describe('game override', () => {
  test('length, kind and muzzle tip replace the info file values one by one', () => {
    const o = resolveGrip(box(1), { grip: G, override: { lengthM: 1.2 } });
    expect(o.source).toBe('override');
    expect(o.overridden).toEqual(['lengthM']);
    expect(o.grip).toEqual({ ...G, lengthM: 1.2 });
    expect(resolveGrip(box(1), { grip: G, override: { muzzleTip: [0.9, 0, 0] } }).grip.muzzleTip).toEqual([0.9, 0, 0]);
    // a gun overridden into a blade loses its muzzle tip
    expect(resolveGrip(box(1), { grip: { ...G, muzzleTip: [1, 0, 0] }, override: { kind: 'blade' } }).grip.muzzleTip).toBeUndefined();
  });
  test('the pose replaces point, forward and up together', () => {
    const pose = { point: [0.5, 0, 0], forward: [-1, 0, 0], up: [0, 0, 1] } as const;
    const o = resolveGrip(box(1), { grip: G, override: { ...pose } as GripOverride });
    expect(o.grip.point).toEqual([0.5, 0, 0]);
    expect(o.grip.forward).toEqual([-1, 0, 0]);
    expect(o.grip.up).toEqual([0, 0, 1]);
    expect(o.grip.lengthM).toBe(G.lengthM);
    // without an info file the pose override needs no estimate
    expect(resolveGrip(box(1), { grip: null, kind: 'blade', override: { ...pose } as GripOverride }).grip.point).toEqual([0.5, 0, 0]);
  });
  test('half a pose is ignored with one warning, the info file pose stays', () => {
    const half = { point: [0.5, 0, 0], lengthM: 1 } as unknown as GripOverride; // what untyped game code could pass
    const o = resolveGrip(box(1), { grip: G, override: half });
    expect(o.grip.point).toEqual(G.point);
    expect(o.grip.lengthM).toBe(1);
    expect(o.overridden).toEqual(['lengthM']);
    resolveGrip(box(1), { grip: G, override: half });
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
  test('no info file: words in the file name or the library gun folder, else held like a blade (torch, staff)', () => {
    expect(kindOf(null, 'https://x/assets/my_rifle.glb')).toBe('gun');
    expect(kindOf(null, 'https://agent8-games.verse8.io/assets/3d/weapons/ak47.glb')).toBe('gun');
    expect(kindOf(null, 'https://agent8-games.verse8.io/assets/3d/weapons/p90_lowpoly.glb')).toBe('gun');
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

describe('model -> held frame', () => {
  test('grip point → origin, forward → +Z, real length = lengthM', () => {
    const { matrix, scale, lengthModel } = gripMatrix(box(1), G);
    expect(lengthModel).toBeCloseTo(1, 5);
    expect(scale).toBeCloseTo(0.8, 5);
    expect(new THREE.Vector3(...G.point).applyMatrix4(matrix).length()).toBeLessThan(1e-6);
  });
  test('muzzle: the info file muzzleTip when it has one', () => {
    const { tip } = gripMatrix(box(1), { ...G, muzzleTip: [0.9, 0.04, 0] });
    expect(tip.z).toBeCloseTo(0.7 * 0.8, 5);
    expect(tip.y).toBeCloseTo(0.04 * 0.8, 5);
  });
  test('muzzle without muzzleTip: the front end along forward, on the line through the grip point', () => {
    const { tip } = gripMatrix(box(1), G);
    expect(tip.z).toBeCloseTo(0.8 * 0.8, 4); // front is 0.8 model units ahead of the grip
    expect(Math.hypot(tip.x, tip.y)).toBeLessThan(1e-6);
  });
  test('bow: scale = lengthM / extent along forward (not the limb span)', () => {
    // a bow 0.5 units deep along -X (string -> riser, the arrow's way) and 2 units tall (the limbs)
    const root = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.05));
    m.position.set(-0.25, 1, 0);
    root.add(m);
    const B: Grip = { kind: 'bow', point: [-0.1, 1, 0], forward: [-1, 0, 0], up: [0, 1, 0], lengthM: 0.547 };
    expect(gripFromMeta(meta({ grip: B }))).toEqual(B);
    const { matrix, lengthModel, scale } = gripMatrix(sceneVertices(root), B);
    expect(lengthModel).toBeCloseTo(0.5, 5);
    expect(scale).toBeCloseTo(0.547 / 0.5, 5);
    const top = new THREE.Vector3(-0.1, 2, 0).applyMatrix4(matrix); // upper limb tip: canonical +Y
    expect(top.y).toBeCloseTo(1 * scale, 5);
    expect(Math.abs(top.z)).toBeLessThan(1e-6);
  });
});
