// Jump feel checked against real collision grounding (not a mocked flag).
import { describe, expect, test } from 'bun:test';
import { PLAYER } from '../config';
import { createPlayer, stepPlayer, type PlayerState } from './player';
import { PLATFORM, RAMPS, updatePlatformAabb, type Aabb, type Ramp } from './world';

const DT = 1 / 120;
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

describe('ramp', () => {
  const ramp = RAMPS[0];
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
    const plat: Aabb = { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
    const center = () => (plat.minX + plat.maxX) / 2;
    updatePlatformAabb(plat, 0);
    const p = createPlayer();
    Object.assign(p.pos, { x: center(), y: PLATFORM.top + 0.2, z: PLATFORM.z });
    const jump = { jumpPressedAt: -Infinity };
    let offset: number | null = null;
    let drift = 0;
    // one full back-and-forth cycle plus the drop
    const end = (2 * (PLATFORM.maxX - PLATFORM.minX)) / PLATFORM.speed + 0.5;
    for (let t = DT; t < end; t += DT) {
      updatePlatformAabb(plat, t);
      stepPlayer(p, still, jump, t, DT, [plat], false, []);
      if (!p.grounded) continue;
      offset ??= p.pos.x - center();
      drift = Math.max(drift, Math.abs(p.pos.x - center() - offset));
    }
    expect(p.grounded).toBe(true);
    expect(p.pos.y).toBeCloseTo(PLATFORM.top, 5);
    expect(drift).toBeLessThan(0.01);
  });
});
