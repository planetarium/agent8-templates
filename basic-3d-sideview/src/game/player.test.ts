// Jump feel checked against real collision grounding (not a mocked flag).
import { describe, expect, test } from 'bun:test';
import { PLAYER } from '../config';
import { createPlayer, stepPlayer, type PlayerState } from './player';
import { boxAabb, rampHeight, rampVertices, updatePlatformAabb, type Aabb, type Box, type HeightField, type Platform, type Ramp } from './world';

const DT = 1 / 120;

// Test course (the stage itself starts empty): stairs and a 0.6 ledge along
// z = 0, a ramp, a moving platform.
const COURSE_BOXES: Box[] = [
  { pos: [0, -0.5, 0], size: [80, 1, 80], color: '' },
  { pos: [2.5, 0.15, 0], size: [1, 0.3, 3], color: '' },
  { pos: [3.5, 0.3, 0], size: [1, 0.6, 3], color: '' },
  { pos: [4.5, 0.45, 0], size: [1, 0.9, 3], color: '' },
  { pos: [6, 0.45, 0], size: [2, 0.9, 3], color: '' },
  { pos: [8.5, 0.75, 0], size: [3, 1.5, 3], color: '' },
];
// 1.5 m over 6 m ≈ 14°.
const COURSE_RAMP: Ramp = { minX: -11, maxX: -5, minZ: -1.5, maxZ: 1.5, height: 1.5, color: '' };
const COURSE_PLATFORM = { size: [3, 0.3, 3], top: 1.5, z: 0, minX: 11.5, maxX: 17.5, speed: 2 } satisfies Platform;
// A ledge whose right edge is at x = 0, top at y = 0.
const LEDGE: Aabb[] = [{ minX: -50, minY: -1, minZ: -5, maxX: 0, maxY: 0, maxZ: 5 }];
const still = { x: 0, z: 0 };

function setup(x: number, y: number) {
  const p = createPlayer();
  Object.assign(p.pos, { x, y, z: 0 });
  return { p, jump: { jumpPressedAt: -Infinity }, t: 0 };
}

/** Runs steps until `until` is true (or a step limit); returns the clock. */
function run(s: { p: PlayerState; jump: { jumpPressedAt: number }; t: number }, move: { x: number; z: number }, until: () => boolean) {
  for (let i = 0; i < 2000 && !until(); i++) {
    s.t += DT;
    stepPlayer(s.p, move, s.jump, s.t, DT, LEDGE, true);
  }
}

describe('ground detection', () => {
  test('falling onto a box top grounds the player', () => {
    const s = setup(-5, 2);
    run(s, still, () => s.p.grounded);
    expect(s.p.grounded).toBe(true);
    expect(s.p.pos.y).toBeCloseTo(0, 5);
  });
});

describe('coyote time', () => {
  function walkOff() {
    const s = setup(-1, 0.01);
    run(s, still, () => s.p.grounded);
    // walk right until the AABB leaves the ledge
    run(s, { x: 1, z: 0 }, () => !s.p.grounded);
    return s;
  }

  test('jump just inside the window works', () => {
    const s = walkOff();
    const leftAt = s.t;
    run(s, { x: 1, z: 0 }, () => s.t - leftAt >= PLAYER.coyoteTime - 0.03);
    s.jump.jumpPressedAt = s.t;
    run(s, { x: 1, z: 0 }, () => s.p.jumps > 0 || s.t - leftAt > 0.5);
    expect(s.p.jumps).toBe(1);
  });

  test('jump after the window does nothing', () => {
    const s = walkOff();
    const leftAt = s.t;
    run(s, { x: 1, z: 0 }, () => s.t - leftAt >= PLAYER.coyoteTime + 0.03);
    s.jump.jumpPressedAt = s.t;
    run(s, { x: 1, z: 0 }, () => s.t - leftAt > 0.5);
    expect(s.p.jumps).toBe(0);
  });
});

describe('input buffer', () => {
  /** Drops the player from height, presses jump `early` s before it lands. */
  function pressBeforeLanding(early: number) {
    const probe = setup(-5, 3);
    run(probe, still, () => probe.p.grounded);
    const landAt = probe.t;

    const s = setup(-5, 3);
    run(s, still, () => s.t >= landAt - early);
    s.jump.jumpPressedAt = s.t;
    run(s, still, () => s.p.jumps > 0 || s.t > landAt + 0.3);
    return s;
  }

  test('press shortly before landing jumps on touchdown', () => {
    expect(pressBeforeLanding(PLAYER.jumpBuffer - 0.03).p.jumps).toBe(1);
  });

  test('press too early is dropped', () => {
    expect(pressBeforeLanding(PLAYER.jumpBuffer + 0.03).p.jumps).toBe(0);
  });

  test('one press makes one jump (consumed)', () => {
    const s = setup(-5, 0.01);
    run(s, still, () => s.p.grounded);
    s.jump.jumpPressedAt = s.t;
    run(s, still, () => s.p.jumps > 0);
    // land again without a new press: no second jump
    run(s, still, () => s.p.grounded && s.p.vel.y === 0 && s.t > 2);
    expect(s.p.jumps).toBe(1);
    expect(s.jump.jumpPressedAt).toBe(-Infinity);
  });
});

/** Steps `p` with a constant move until `until` (or 10 s), on `boxes` + `ramps`; `tick` runs before each step. */
function sim(p: PlayerState, move: { x: number; z: number }, boxes: Aabb[], ramps: Ramp[], until: () => boolean, tick?: (t: number) => void) {
  const jump = { jumpPressedAt: -Infinity };
  let t = 0;
  for (let i = 0; i < 1200 && !until(); i++) {
    t += DT;
    tick?.(t);
    stepPlayer(p, move, jump, t, DT, boxes, false, ramps);
  }
  return t;
}

const FLOOR: Aabb = { minX: -50, minY: -1, minZ: -50, maxX: 50, maxY: 0, maxZ: 50 };
const step = (h: number): Aabb => ({ minX: 1, minY: 0, minZ: -2, maxX: 3, maxY: h, maxZ: 2 });
const onFloor = () => {
  const p = createPlayer();
  Object.assign(p.pos, { x: 0, y: 0, z: 0 });
  return p;
};

describe('step-up', () => {
  test('walks up a 0.3 step without jumping', () => {
    const p = onFloor();
    sim(p, { x: 1, z: 0 }, [FLOOR, step(0.3)], [], () => p.pos.x > 2);
    expect(p.pos.x).toBeGreaterThan(2);
    expect(p.pos.y).toBeCloseTo(0.3, 5);
    expect(p.grounded).toBe(true);
    expect(p.jumps).toBe(0);
  });

  test('a 0.5 step blocks', () => {
    const p = onFloor();
    sim(p, { x: 1, z: 0 }, [FLOOR, step(0.5)], [], () => false);
    expect(p.pos.x).toBeCloseTo(1 - PLAYER.radius, 2);
    expect(p.pos.y).toBeCloseTo(0, 5);
  });

  test('no step-up while rising from a jump', () => {
    const p = onFloor();
    p.vel.y = PLAYER.jumpVelocity;
    p.pos.x = 1 - PLAYER.radius - 0.01;
    // first step goes up: hitting the ledge side now must push back, not lift
    stepPlayer(p, { x: 1, z: 0 }, { jumpPressedAt: -Infinity }, 0, DT, [FLOOR, step(0.3)], false, []);
    expect(p.pos.x).toBeLessThan(1 - PLAYER.radius);
  });
});

describe('headroom (nothing lifts the player into a box above)', () => {
  /** Highest feet height reached over 3 s of a constant move. */
  function maxY(p: PlayerState, move: { x: number; z: number }, boxes: Aabb[], ramps: Ramp[] = [], fields: HeightField[] = []) {
    const jump = { jumpPressedAt: -Infinity };
    let top = p.pos.y;
    for (let i = 0, t = 0; i < 360; i++) {
      t += DT;
      stepPlayer(p, move, jump, t, DT, boxes, false, ramps, fields);
      top = Math.max(top, p.pos.y);
    }
    return top;
  }

  test('a 0.3 step under a ceiling 1.45 m above it blocks instead of lifting the player through the ceiling', () => {
    // fits on the floor (1.6 < 1.75), not on the step (0.3 + 1.6 > 1.75)
    const ceiling: Aabb = { minX: -5, minY: 1.75, minZ: -5, maxX: 10, maxY: 2.0, maxZ: 5 };
    const p = onFloor();
    expect(maxY(p, { x: 1, z: 0 }, [FLOOR, step(0.3), ceiling])).toBeLessThan(0.05);
    expect(p.pos.x).toBeLessThan(1 - PLAYER.radius + 0.01);
  });

  test('the same step with room above still steps up', () => {
    const ceiling: Aabb = { minX: -5, minY: 2.0, minZ: -5, maxX: 10, maxY: 2.3, maxZ: 5 };
    const p = onFloor();
    sim(p, { x: 1, z: 0 }, [FLOOR, step(0.3), ceiling], [], () => p.pos.x > 2);
    expect(p.pos.y).toBeCloseTo(0.3, 5);
  });

  test('walking up a ramp under a slab stops below the slab instead of jumping on top of it', () => {
    const slab: Aabb = { minX: -8, minY: 2.9, minZ: -5, maxX: -2, maxY: 3.3, maxZ: 5 };
    const p = onFloor();
    Object.assign(p.pos, { x: COURSE_RAMP.minX - 1, z: 0 });
    const top = maxY(p, { x: 1, z: 0 }, [FLOOR, slab], [COURSE_RAMP]);
    expect(top).toBeLessThan(slab.minY - PLAYER.height + 0.01);
  });

  test('a height field under a slab stops the player below the slab', () => {
    const hill: HeightField = { minX: 0, maxX: 10, minZ: -5, maxZ: 5, heightAt: (x) => x * 0.25 };
    const slab: Aabb = { minX: 3, minY: 2.4, minZ: -5, maxX: 9, maxY: 3.0, maxZ: 5 };
    const p = onFloor();
    Object.assign(p.pos, { x: 0.5, y: 0.125 });
    const top = maxY(p, { x: 1, z: 0 }, [FLOOR, slab], [], [hill]);
    expect(top).toBeLessThan(slab.minY - PLAYER.height + 0.01);
  });

  test('falling while the head is inside a box does not land on top of that box', () => {
    const slab: Aabb = { minX: -2, minY: 2.0, minZ: -2, maxX: 2, maxY: 2.5, maxZ: 2 };
    const p = onFloor();
    Object.assign(p.pos, { x: 0, y: 1.0, z: 0 }); // head at 2.6, inside the slab
    sim(p, still, [FLOOR, slab], [], () => p.grounded);
    expect(p.pos.y).toBeCloseTo(0, 5);
  });
});

describe('the test course', () => {
  test('from the spawn, walking +x on z = 0 climbs the stairs to the 0.9 landing without jumping', () => {
    const p = createPlayer();
    const boxes = COURSE_BOXES.map(boxAabb);
    const jump = { jumpPressedAt: -Infinity };
    let t = 0;
    for (let i = 0; i < 1200 && p.pos.x < 6; i++) {
      t += DT;
      stepPlayer(p, { x: PLAYER.walkSpeed / PLAYER.runSpeed, z: 0 }, jump, t, DT, boxes, true, [COURSE_RAMP]);
    }
    expect(p.pos.x).toBeGreaterThanOrEqual(6);
    expect(p.pos.y).toBeCloseTo(0.9, 5);
    expect(p.jumps).toBe(0);
  });
});

describe('ramp', () => {
  const ramp = COURSE_RAMP;
  const mid = (ramp.minZ + ramp.maxZ) / 2;

  test('walking up follows the surface and stays grounded', () => {
    const p = onFloor();
    Object.assign(p.pos, { x: ramp.minX - 1, z: mid });
    const target = (ramp.minX + ramp.maxX) / 2;
    sim(p, { x: 1, z: 0 }, [FLOOR], [ramp], () => p.pos.x >= target);
    expect(p.pos.y).toBeCloseTo(ramp.height / 2, 1);
    expect(p.grounded).toBe(true);
  });

  test('walking down sticks to the surface (no airborne hops)', () => {
    const p = onFloor();
    Object.assign(p.pos, { x: ramp.maxX - 0.5, y: ramp.height, z: mid });
    sim(p, still, [FLOOR], [ramp], () => p.grounded);
    let airborne = 0;
    sim(p, { x: -1, z: 0 }, [FLOOR], [ramp], () => {
      if (!p.grounded) airborne++;
      return p.pos.x < ramp.minX + 0.5;
    });
    expect(airborne).toBe(0);
  });

  test('the tall side is a wall', () => {
    const p = onFloor();
    Object.assign(p.pos, { x: ramp.maxX - 0.5, z: ramp.minZ - 1 });
    sim(p, { x: 0, z: 1 }, [FLOOR], [ramp], () => false);
    expect(p.pos.z).toBeLessThan(ramp.minZ);
    expect(p.pos.y).toBeCloseTo(0, 5);
  });
});

describe('moving platform', () => {
  test('a player standing on it is carried along, both directions', () => {
    const PLATFORM = COURSE_PLATFORM;
    const plat: Aabb = { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
    const center = () => (plat.minX + plat.maxX) / 2;
    updatePlatformAabb(plat, PLATFORM, 0);
    const p = createPlayer();
    Object.assign(p.pos, { x: center(), y: PLATFORM.top + 0.2, z: PLATFORM.z });
    const jump = { jumpPressedAt: -Infinity };
    let offset: number | null = null;
    let drift = 0;
    // one full back-and-forth cycle plus the drop
    const end = (2 * (PLATFORM.maxX - PLATFORM.minX)) / PLATFORM.speed + 0.5;
    for (let t = DT; t < end; t += DT) {
      updatePlatformAabb(plat, PLATFORM, t);
      stepPlayer(p, still, jump, t, DT, [plat], false, []);
      if (!p.grounded) continue;
      offset ??= p.pos.x - center();
      drift = Math.max(drift, Math.abs(p.pos.x - center() - offset));
    }
    expect(p.grounded).toBe(true);
    expect(p.pos.y).toBeCloseTo(PLATFORM.top, 5);
    expect(drift).toBeLessThan(0.01);
  });

  test('a platform sliding along z (down a forward course) carries the rider too', () => {
    const FERRY = { size: [3, 0.3, 3], top: 1.5, x: 0, minZ: -12, maxZ: -4, speed: 2 } satisfies Platform;
    const plat: Aabb = { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
    updatePlatformAabb(plat, FERRY, 0);
    const p = createPlayer();
    Object.assign(p.pos, { x: 0, y: FERRY.top + 0.2, z: FERRY.minZ });
    const jump = { jumpPressedAt: -Infinity };
    for (let t = DT; t < 3; t += DT) {
      updatePlatformAabb(plat, FERRY, t);
      stepPlayer(p, still, jump, t, DT, [plat], false, []);
    }
    expect(p.grounded).toBe(true);
    // landed a few frames after the start, then rode along: still on the platform, far from where it began
    expect(Math.abs(p.pos.z - (plat.minZ + plat.maxZ) / 2)).toBeLessThan(0.5);
    expect(p.pos.z).toBeGreaterThan(FERRY.minZ + 4);
  });
});

describe('ramp directions', () => {
  // The same 6 × 3 footprint rising each way; walking up it from the low edge reaches the top.
  const base = { height: 1.5, color: '' };
  const cases: [Ramp, { x: number; z: number }, { x: number; z: number }][] = [
    [{ ...base, minX: -1.5, maxX: 1.5, minZ: -9, maxZ: -3, dir: '-z' }, { x: 0, z: -2 }, { x: 0, z: -1 }],
    [{ ...base, minX: -1.5, maxX: 1.5, minZ: 3, maxZ: 9, dir: '+z' }, { x: 0, z: 2 }, { x: 0, z: 1 }],
    [{ ...base, minX: -9, maxX: -3, minZ: -1.5, maxZ: 1.5, dir: '-x' }, { x: -2, z: 0 }, { x: -1, z: 0 }],
  ];
  for (const [ramp, start, move] of cases) {
    test(`'${ramp.dir}' rises away from its low edge and is walkable`, () => {
      const p = onFloor();
      Object.assign(p.pos, start);
      sim(p, move, [FLOOR], [ramp], () => Math.abs(p.pos.x) > 8.5 || Math.abs(p.pos.z) > 8.5);
      expect(p.grounded).toBe(true);
      expect(p.pos.y).toBeGreaterThan(1.3); // near the high edge
      expect(p.pos.y).toBeCloseTo(rampHeight(ramp, p.pos.x, p.pos.z)!, 2);
    });
  }

  test('every direction is the +x wedge turned: same winding (signed volume)', () => {
    const vol = (v: number[]) => {
      const p = (i: number) => [v[i * 3], v[i * 3 + 1], v[i * 3 + 2]];
      const [a, b, c, d] = [p(0), p(1), p(2), p(4)];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const h = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      return u[0] * (w[1] * h[2] - w[2] * h[1]) - u[1] * (w[0] * h[2] - w[2] * h[0]) + u[2] * (w[0] * h[1] - w[1] * h[0]);
    };
    const r = { minX: 0, maxX: 6, minZ: 0, maxZ: 3, height: 1.5, color: '' };
    const sign = Math.sign(vol(rampVertices(r)));
    for (const dir of ['-x', '+z', '-z'] as const) expect(Math.sign(vol(rampVertices({ ...r, dir })))).toBe(sign);
    // high top corners sit at `height`
    for (const dir of ['+x', '-x', '+z', '-z'] as const) {
      const v = rampVertices({ ...r, dir });
      expect(rampHeight({ ...r, dir }, v[12], v[14])).toBeCloseTo(1.5, 6);
      expect(rampHeight({ ...r, dir }, v[0], v[2])).toBeCloseTo(0, 6);
    }
  });
});

describe('height field', () => {
  /** Steps with a constant move on the floor box + `fields` until `until` (or 10 s). */
  function onField(p: PlayerState, move: { x: number; z: number }, fields: HeightField[], until: () => boolean) {
    const jump = { jumpPressedAt: -Infinity };
    let t = 0;
    for (let i = 0; i < 1200 && !until(); i++) {
      t += DT;
      stepPlayer(p, move, jump, t, DT, [FLOOR], false, [], fields);
    }
  }
  const area = { minX: 0, maxX: 10, minZ: -5, maxZ: 5 };

  test('flat: lands on the surface and walks on it grounded', () => {
    const plateau: HeightField = { ...area, heightAt: () => 1 };
    const p = onFloor();
    Object.assign(p.pos, { x: 3, y: 3 });
    onField(p, still, [plateau], () => p.grounded);
    expect(p.pos.y).toBeCloseTo(1, 5);
    onField(p, { x: 1, z: 0 }, [plateau], () => p.pos.x > 6);
    expect(p.pos.y).toBeCloseTo(1, 5);
    expect(p.grounded).toBe(true);
  });

  test('a 20° hill is walked up from the floor, feet on the surface', () => {
    const k = Math.tan((20 * Math.PI) / 180);
    const hill: HeightField = { ...area, heightAt: (x) => x * k };
    const p = onFloor();
    Object.assign(p.pos, { x: -1 });
    onField(p, { x: 1, z: 0 }, [hill], () => p.pos.x >= 5);
    expect(p.pos.y).toBeCloseTo(p.pos.x * k, 5);
    expect(p.grounded).toBe(true);
    expect(p.jumps).toBe(0);
  });

  test('a 75° cliff (steeper than maxSlope) is a wall', () => {
    const k = Math.tan((75 * Math.PI) / 180);
    const cliff: HeightField = { ...area, heightAt: (x) => Math.max(0, x - 2) * k };
    const p = onFloor();
    Object.assign(p.pos, { x: 0.5 });
    onField(p, { x: 1, z: 0 }, [cliff], () => false);
    expect(p.pos.x).toBeLessThan(2.06);
    expect(p.pos.y).toBeLessThan(0.25);
    expect(p.grounded).toBe(true);
  });
});
