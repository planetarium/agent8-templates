import { describe, expect, test } from 'bun:test';
import { FLIGHT, GUN } from '../config';
import {
  altitude,
  authority,
  createFlight,
  createGun,
  fire,
  forwardOf,
  measuredSpeed,
  resetFlight,
  stepBullets,
  stepFlight,
  type FlightInput,
  type FlightState,
} from './flight';
import { RUNWAY_CLEARANCE, makeDecor, skyPosition } from './decor';

const DT = 1 / 60;
const idle = (): FlightInput => ({ pitch: 0, roll: 0, yaw: 0, throttle: 0 });

function run(s: FlightState, input: Partial<FlightInput>, seconds: number) {
  const i = { ...idle(), ...input };
  const steps = Math.round(seconds / DT);
  for (let n = 0; n < steps; n++) stepFlight(s, i, DT);
}

/** Full throttle down the runway until airborne speed, then pull up. */
function takeOff() {
  const s = createFlight();
  run(s, { throttle: 1 }, 3.5);
  run(s, { throttle: 1, pitch: -1 }, 1.2);
  return s;
}

describe('speed', () => {
  test('throttle up at speedUp, capped at maxSpeed', () => {
    const s = createFlight();
    run(s, { throttle: 1 }, 1);
    expect(s.speed).toBeCloseTo(FLIGHT.speedUp, 0);
    run(s, { throttle: 1 }, 10);
    expect(s.speed).toBe(FLIGHT.maxSpeed);
    expect(s.speed * 3.6).toBeCloseTo(432, 5);
  });

  test('throttle down at speedDown, never below 0; no input holds speed', () => {
    const s = createFlight();
    s.speed = 100;
    run(s, {}, 1);
    expect(s.speed).toBe(100);
    run(s, { throttle: -1 }, 0.5);
    expect(s.speed).toBeCloseTo(100 - FLIGHT.speedDown * 0.5, 0);
    run(s, { throttle: -1 }, 5);
    expect(s.speed).toBe(0);
  });

  test('measured speed averages the real movement', () => {
    const s = createFlight();
    s.speed = 50;
    run(s, {}, 0.5);
    expect(measuredSpeed(s)).toBeCloseTo(50, 3);
  });
});

describe('attitude', () => {
  test('a parked plane does not turn; authority grows with speed on the ground', () => {
    const s = createFlight();
    run(s, { pitch: -1, roll: 1, yaw: 1 }, 1);
    expect(s.quat).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    s.speed = FLIGHT.fullRotationSpeed / 2;
    expect(authority(s)).toBeCloseTo(0.5, 6);
    s.speed = FLIGHT.fullRotationSpeed * 2;
    expect(authority(s)).toBe(1);
  });

  test('stick back raises the nose at pitchSpeed (in the air)', () => {
    const s = createFlight();
    s.pos.y = 100;
    run(s, { pitch: -1 }, 1);
    const f = forwardOf(s.quat);
    expect(Math.asin(f.y)).toBeCloseTo(FLIGHT.pitchSpeed, 1);
    expect(f.z).toBeLessThan(0);
  });

  test('stick right rolls the right wing down at rollSpeed × 0.5', () => {
    const s = createFlight();
    s.pos.y = 100;
    run(s, { roll: 1 }, 1);
    // the plane's right wing (+x) after the roll
    const q = s.quat;
    const rightY = 2 * (q.x * q.y + q.w * q.z);
    expect(Math.asin(rightY)).toBeCloseTo(-FLIGHT.rollSpeed * 0.5, 1);
  });

  test('yaw is an accelerated rate that decays when released', () => {
    const s = createFlight();
    s.pos.y = 100;
    run(s, { yaw: -1 }, 1);
    expect(s.yawVel).toBeCloseTo(FLIGHT.yawAccel, 1);
    expect(forwardOf(s.quat).x).toBeLessThan(0); // turned left
    run(s, {}, 2);
    expect(Math.abs(s.yawVel)).toBeLessThan(FLIGHT.yawAccel * 0.01);
  });

  test('banking and pulling back turns the plane', () => {
    const s = createFlight();
    s.pos.y = 300;
    s.speed = 80;
    run(s, { roll: 1 }, 1);
    run(s, { pitch: -1 }, 3);
    expect(forwardOf(s.quat).x).toBeGreaterThan(0.3); // heading swung right
  });
});

describe('ground', () => {
  test('the plane never sinks below the ground', () => {
    const s = createFlight();
    s.pos.y = 20;
    s.speed = 60;
    run(s, { pitch: 1 }, 5); // dive
    expect(s.pos.y).toBeCloseTo(FLIGHT.restHeight, 6);
    expect(altitude(s)).toBeCloseTo(0, 6);
  });

  test('follows a custom ground height', () => {
    const s = createFlight();
    s.speed = 10;
    stepFlight(s, idle(), DT, () => 50);
    expect(s.pos.y).toBe(50 + FLIGHT.restHeight);
  });

  test('take-off: full throttle 3.5 s then pull up 1.2 s climbs over 30 m', () => {
    const s = takeOff();
    expect(altitude(s)).toBeGreaterThan(30);
    expect(authority(s)).toBe(1);
  });

  test('reset puts the plane back on the runway', () => {
    const s = takeOff();
    resetFlight(s);
    expect(s.pos).toEqual({ x: 0, y: FLIGHT.restHeight, z: 0 });
    expect(s.speed).toBe(0);
  });
});

describe('gun', () => {
  test('cooldown between shots', () => {
    const s = createFlight();
    const g = createGun();
    expect(fire(g, s, 0)).toBe(true);
    expect(fire(g, s, GUN.cooldownMs - 1)).toBe(false);
    expect(fire(g, s, GUN.cooldownMs)).toBe(true);
    expect(g.bullets.length).toBe(2);
  });

  test('bullets fly along the nose at bulletSpeed and expire after bulletLifeMs', () => {
    const s = createFlight();
    s.pos.y = 100;
    const g = createGun();
    fire(g, s, 0);
    const z0 = g.bullets[0].pos.z;
    stepBullets(g, 100, 0.1);
    expect(g.bullets[0].pos.z).toBeCloseTo(z0 - GUN.bulletSpeed * 0.1, 6);
    stepBullets(g, GUN.bulletLifeMs, DT);
    expect(g.bullets.length).toBe(0);
  });

  test('bullets that hit the ground are dropped', () => {
    const s = createFlight();
    s.pos.y = 2;
    s.speed = 50;
    run(s, { pitch: 1 }, 0.3); // nose down
    const g = createGun();
    fire(g, s, 0);
    for (let t = 1; t <= 20; t++) stepBullets(g, t * 10, 0.01);
    expect(g.bullets.length).toBe(0);
  });
});

describe('decor', () => {
  test('same seed, same layout; counts; ground decor stays off the runway', () => {
    const a = makeDecor(12345, 500, 150);
    const b = makeDecor(12345, 500, 150);
    expect(a).toEqual(b);
    expect(a.ground.length).toBe(500);
    expect(a.sky.length).toBe(150);
    for (const d of a.ground) expect(Math.abs(d.x)).toBeGreaterThanOrEqual(RUNWAY_CLEARANCE);
    for (const d of a.sky) expect(skyPosition(d, 10).y).toBeGreaterThan(90);
  });
});
