// Split-body aiming (aimRig.ts): which rigs split, how the legs choose a direction, and the upper
// body putting the line between the hands onto the aim.
import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import { aimSpine, findSpine, LEG_MAX, splitClip, spineShares, splitsBody, stepLegs, TWIST_MAX, twistFor, weightedAim, type AimArc, type LegState } from './aimRig';

const deg = (d: number) => (d * Math.PI) / 180;
const diff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

/** Hips → Spine → Spine1 → Spine2 → shoulders → hands (hands in front, left one ahead), legs. */
function rig({ spine = 3 } = {}) {
  const root = new THREE.Group();
  const bone = (name: string, parent: THREE.Object3D, p: [number, number, number]) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(...p);
    parent.add(b);
    return b;
  };
  const hips = bone('mixamorigHips', root, [0, 1, 0]);
  bone('mixamorigLeftUpLeg', hips, [0.1, -0.05, 0]);
  bone('mixamorigRightUpLeg', hips, [-0.1, -0.05, 0]);
  let top: THREE.Object3D = hips;
  for (let i = 0; i < spine; i++) top = bone(i ? `mixamorigSpine${i}` : 'mixamorigSpine', top, [0, 0.12, 0]);
  const arm = (side: 'Right' | 'Left', hand: [number, number, number]) => {
    const s = bone(`mixamorig${side}Shoulder`, top, [side === 'Right' ? -0.15 : 0.15, 0.05, 0]);
    const h = bone(`mixamorig${side}Hand`, s, hand);
    for (const [f, p] of [['Index1', [0.02, 0, 0.09]], ['Middle1', [0, 0, 0.095]], ['Pinky1', [-0.03, 0, 0.085]], ['Thumb1', [0.03, -0.02, 0.03]]] as const) bone(`mixamorig${side}Hand${f}`, h, [...p] as [number, number, number]);
  };
  arm('Right', [0.05, -0.1, 0.25]);
  arm('Left', [-0.1, -0.05, 0.55]);
  root.updateMatrixWorld(true);
  return root;
}

describe('which rigs split', () => {
  test('a mixamo-like rig: hips plus the spine chain; legs stay below the cut', () => {
    const s = findSpine(rig())!;
    expect(s.hips.name).toBe('mixamorigHips');
    expect(s.spine.map((b) => b.name)).toEqual(['mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2']);
    expect(s.upper.has('mixamorigRightHand')).toBe(true);
    expect(s.upper.has('mixamorigLeftUpLeg')).toBe(false);
    expect(s.upper.has('mixamorigHips')).toBe(false);
  });
  test('no spine bone or no hips: null, so the character keeps the whole-body turn', () => {
    expect(findSpine(rig({ spine: 0 }))).toBeNull();
    const noHips = new THREE.Group();
    noHips.add(Object.assign(new THREE.Bone(), { name: 'Spine' }));
    expect(findSpine(noHips)).toBeNull();
  });
  test('a clip splits into disjoint halves: hips and legs below, spine and arms above', () => {
    const s = findSpine(rig())!;
    const track = (n: string) => new THREE.QuaternionKeyframeTrack(`${n}.quaternion`, [0], [0, 0, 0, 1]);
    const clip = new THREE.AnimationClip('walk', 1, [
      new THREE.VectorKeyframeTrack('mixamorigHips.position', [0], [0, 1, 0]),
      track('mixamorigHips'), track('mixamorigLeftUpLeg'), track('mixamorigSpine'), track('mixamorigRightHand'),
    ]);
    const { lower, upper } = splitClip(clip, s);
    expect(lower.name).toBe('walk');
    expect(upper.name).toBe('walk:up');
    expect(lower.tracks.map((t) => t.name)).toEqual(['mixamorigHips.position', 'mixamorigHips.quaternion', 'mixamorigLeftUpLeg.quaternion']);
    expect(upper.tracks.map((t) => t.name)).toEqual(['mixamorigSpine.quaternion', 'mixamorigRightHand.quaternion']);
  });
});

describe('legs', () => {
  const run = (s: LegState, aim: number, move: number, moving: boolean, frames = 60) => {
    for (let i = 0; i < frames; i++) s = stepLegs(s, aim, move, moving, 1 / 60);
    return s;
  };
  const start = (yaw = 0): LegState => ({ yaw, reversed: false, turning: false });
  test('aim 90° off the walk: legs turn at most 45° toward the aim, still walking forward', () => {
    const s = run(start(), deg(90), 0, true);
    expect(s.reversed).toBe(false);
    expect(diff(s.yaw, LEG_MAX)).toBeLessThan(1e-3);
  });
  test('aim behind the walk: legs turn round and walk backwards; hysteresis keeps it there until under 70°', () => {
    let s = run(start(), deg(180), 0, true);
    expect(s.reversed).toBe(true);
    expect(diff(s.yaw, Math.PI)).toBeLessThan(1e-3);
    s = run(s, deg(100), 0, true); // between 70° and 110°: stays backwards
    expect(s.reversed).toBe(true);
    s = run(s, deg(60), 0, true);
    expect(s.reversed).toBe(false);
    s = run(s, deg(100), 0, true); // forward again needs more than 110° to flip
    expect(s.reversed).toBe(false);
  });
  test('standing: small aim changes leave the legs; past 45° they turn in place onto the aim', () => {
    let s = run(start(), deg(30), 0, false);
    expect(s.yaw).toBe(0);
    s = run(s, deg(60), 0, false);
    expect(diff(s.yaw, deg(60))).toBeLessThan(deg(5) + 1e-6);
  });
});

describe('upper body', () => {
  test('twist is capped at 75°', () => {
    expect(twistFor(deg(30), 0)).toBeCloseTo(deg(30), 9);
    expect(twistFor(deg(170), 0)).toBeCloseTo(TWIST_MAX, 9);
    expect(twistFor(deg(-170), 0)).toBeCloseTo(-TWIST_MAX, 9);
    expect(spineShares(3).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });
  test('the line between the hands converges onto the aim (yaw and pitch) in a few frames', () => {
    const r = rig();
    const s = findSpine(r)!;
    const grip = r.getObjectByName('mixamorigRightHand')!;
    const support = r.getObjectByName('mixamorigLeftHand')!;
    const state = { base: [] as THREE.Quaternion[], set: [] as THREE.Quaternion[], corrYaw: 0, corrPitch: 0 };
    const aim = { yaw: deg(40), pitch: deg(20) };
    let err = 1;
    for (let i = 0; i < 6; i++) err = aimSpine(s, { grip, support }, aim, 0, state).err;
    expect(err).toBeLessThan(deg(1));
  });
  test('runs every frame without piling up the turn when the clip does not move the spine', () => {
    const r = rig();
    const s = findSpine(r)!;
    const grip = r.getObjectByName('mixamorigRightHand')!;
    const state = { base: [] as THREE.Quaternion[], set: [] as THREE.Quaternion[], corrYaw: 0, corrPitch: 0 };
    for (let i = 0; i < 10; i++) aimSpine(s, { grip }, { yaw: deg(30), pitch: 0 }, 0, state);
    const q = s.spine[2].quaternion.clone();
    aimSpine(s, { grip }, { yaw: deg(30), pitch: 0 }, 0, state);
    expect(s.spine[2].quaternion.angleTo(q)).toBeLessThan(1e-9);
  });
});

describe('when the body splits', () => {
  const aim = { yaw: 0, pitch: 0, weight: 1 };
  test('a gun with an aim in the right hand (the default) splits', () => {
    expect(splitsBody(true, { aim })).toBe(true);
    expect(splitsBody(true, { aim, side: 'Right' })).toBe(true);
  });
  test('a left-hand gun does not: the spine is turned by the right hand, so it keeps the whole-body turn', () => {
    expect(splitsBody(true, { aim, side: 'Left' })).toBe(false);
  });
  test('no gun, or no aim object: no split — an aim on a sword changes nothing', () => {
    expect(splitsBody(false, { aim })).toBe(false);
    expect(splitsBody(true, {})).toBe(false);
    expect(splitsBody(true, undefined)).toBe(false);
  });
});

describe('aim weight on a split body', () => {
  test('weight is the share of the way from the movement facing to the aim, yaw and pitch', () => {
    const aim = { yaw: deg(60), pitch: deg(20), weight: 0.5 };
    const half = weightedAim(aim, deg(10));
    expect(half.yaw).toBeCloseTo(deg(35), 9); // half of the 50° between facing and aim
    expect(half.pitch).toBeCloseTo(deg(10), 9);
    expect(weightedAim({ ...aim, weight: 1 }, deg(10)).yaw).toBeCloseTo(deg(60), 9);
    const none = weightedAim({ ...aim, weight: 0 }, deg(10));
    expect(none.yaw).toBeCloseTo(deg(10), 9);
    expect(none.pitch).toBe(0);
    expect(none.weight).toBe(0);
  });
  test('the short way round, and weights outside 0–1 are clamped', () => {
    expect(diff(weightedAim({ yaw: deg(-170), pitch: 0, weight: 0.5 }, deg(170)).yaw, deg(180))).toBeLessThan(1e-9);
    expect(weightedAim({ yaw: deg(60), pitch: 0, weight: 3 }, 0).yaw).toBeCloseTo(deg(60), 9);
    expect(weightedAim({ yaw: deg(60), pitch: 0, weight: -1 }, 0).yaw).toBeCloseTo(0, 9);
    expect(weightedAim({ yaw: deg(60), pitch: 0, weight: NaN }, 0).weight).toBe(0);
  });
  test('weight 0.5: the line between the hands ends half way between the facing and the aim', () => {
    const run = (weight: number) => {
      const r = rig();
      const s = findSpine(r)!;
      const grip = r.getObjectByName('mixamorigRightHand')!;
      const support = r.getObjectByName('mixamorigLeftHand')!;
      const state = { base: [] as THREE.Quaternion[], set: [] as THREE.Quaternion[], corrYaw: 0, corrPitch: 0 };
      const to = weightedAim({ yaw: deg(40), pitch: 0, weight }, 0);
      for (let i = 0; i < 6; i++) aimSpine(s, { grip, support }, to, 0, state);
      r.updateMatrixWorld(true);
      const a = grip.getWorldPosition(new THREE.Vector3());
      const b = support.getWorldPosition(new THREE.Vector3()).sub(a);
      return Math.atan2(b.x, b.z);
    };
    // 20° apart: half of the 40° between the facing and the aim
    expect(diff(run(1), run(0.5))).toBeGreaterThan(deg(18));
    expect(diff(run(1), run(0.5))).toBeLessThan(deg(22));
  });
});

describe('an aim that is not a number never reaches the legs', () => {
  /** Thirty frames of the legs following what weightedAim gives, standing and walking. */
  const legsAfter = (aim: { yaw: number; pitch: number; weight: number }) => {
    const arc: AimArc = { delta: 0 };
    let s: LegState = { yaw: deg(10), reversed: false, turning: false };
    const seen: number[] = [];
    for (let i = 0; i < 30; i++) {
      const to = weightedAim(aim, deg(10), arc);
      s = stepLegs(s, to.yaw, deg(10), i >= 15, 1 / 60);
      seen.push(to.yaw, to.pitch, s.yaw);
    }
    return seen;
  };
  test('weight 0 reads nothing of the aim: a NaN yaw or pitch leaves the movement facing, level', () => {
    const to = weightedAim({ yaw: NaN, pitch: NaN, weight: 0 }, deg(10));
    expect(to).toEqual({ yaw: deg(10), pitch: 0, weight: 0 });
    expect(legsAfter({ yaw: NaN, pitch: NaN, weight: 0 }).every(Number.isFinite)).toBe(true);
  });
  test('weight 1 with a yaw or pitch that is not finite is no aim: weight 0, the legs stay finite', () => {
    for (const aim of [{ yaw: Infinity, pitch: 0, weight: 1 }, { yaw: NaN, pitch: 0, weight: 1 }, { yaw: 0.5, pitch: NaN, weight: 0.5 }, { yaw: -Infinity, pitch: Infinity, weight: 1 }]) {
      expect(weightedAim(aim, deg(10))).toEqual({ yaw: deg(10), pitch: 0, weight: 0 });
      expect(legsAfter(aim).every(Number.isFinite)).toBe(true);
    }
  });
});

describe('aiming straight behind at a weight under 1', () => {
  test('the aim wobbling ±1° about straight behind does not throw the target from side to side', () => {
    const arc: AimArc = { delta: 0 };
    let last = weightedAim({ yaw: deg(179), pitch: 0, weight: 0.5 }, 0, arc).yaw;
    expect(last).toBeCloseTo(deg(89.5), 9);
    let widest = 0;
    for (let i = 0; i < 20; i++) {
      const yaw = weightedAim({ yaw: deg(i % 2 ? 179 : -179), pitch: 0, weight: 0.5 }, 0, arc).yaw;
      widest = Math.max(widest, diff(yaw, last));
      last = yaw;
    }
    expect(widest).toBeLessThan(deg(2)); // 1° per frame: half of the 2° wobble (the short way each frame: 179°)
  });
  test('so does the movement facing wobbling under a still aim', () => {
    const arc: AimArc = { delta: 0 };
    let last = weightedAim({ yaw: deg(180), pitch: 0, weight: 0.5 }, deg(1), arc).yaw;
    let widest = 0;
    for (let i = 0; i < 20; i++) {
      const yaw = weightedAim({ yaw: deg(180), pitch: 0, weight: 0.5 }, deg(i % 2 ? 1 : -1), arc).yaw;
      widest = Math.max(widest, diff(yaw, last));
      last = yaw;
    }
    expect(widest).toBeLessThan(deg(4));
  });
  test('it keeps its side past ±180° and changes side only once 45° clear of straight behind', () => {
    const arc: AimArc = { delta: 0 };
    const at = (d: number) => weightedAim({ yaw: deg(d), pitch: 0, weight: 0.5 }, 0, arc).yaw;
    expect(at(170)).toBeCloseTo(deg(85), 9);
    expect(at(-170)).toBeCloseTo(deg(95), 9); // 190° round the same side
    expect(at(-140)).toBeCloseTo(deg(110), 9); // 220°
    expect(at(-130)).toBeCloseTo(deg(-65), 9); // clear of behind: the short way again
    expect(at(-170)).toBeCloseTo(deg(-85), 9);
  });
  test('without the memory, or at full weight, nothing changes: the aim itself', () => {
    expect(weightedAim({ yaw: deg(-179), pitch: 0, weight: 0.5 }, 0).yaw).toBeCloseTo(deg(-89.5), 9);
    const arc: AimArc = { delta: 0 };
    weightedAim({ yaw: deg(179), pitch: 0, weight: 1 }, 0, arc);
    expect(diff(weightedAim({ yaw: deg(-179), pitch: 0, weight: 1 }, 0, arc).yaw, deg(-179))).toBeLessThan(1e-9);
  });
});
