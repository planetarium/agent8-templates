// Jump feel checked against real collision grounding (not a mocked flag).
import { describe, expect, test } from 'bun:test';
import { PLAYER } from '../config';
import { createPlayer, stepPlayer, type PlayerState } from './player';
import type { Aabb } from './world';

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
