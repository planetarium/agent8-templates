// Kinematic airplane: throttle → speed, stick → attitude (a quaternion),
// fly along the nose, never below the ground. No physics body.
// Pure (no React, no three) so it can be unit-tested — see flight.test.ts.
//
// Frame: the plane's nose points along local -z, its up is local +y, its
// right wing local +x (three.js camera convention).
// - pitch and roll turn about the plane's LOCAL x / z axes
// - yaw turns about the WORLD y axis, as an accelerated rate that decays
//   when the key is released
// - on the ground, all three scale with speed up to FLIGHT.fullRotationSpeed,
//   so a parked plane cannot spin in place

import { FLIGHT, GUN } from '../config';

export type Vec3 = { x: number; y: number; z: number };
export type Quat = { x: number; y: number; z: number; w: number };

export type FlightState = {
  /** Plane origin (the wheels are FLIGHT.restHeight below it). */
  pos: Vec3;
  /** Attitude. Identity = level, nose toward -z. */
  quat: Quat;
  /** Airspeed along the nose (m/s), 0 … FLIGHT.maxSpeed. */
  speed: number;
  /** Current yaw rate (rad/s). */
  yawVel: number;
  /** Distance and time of the last few steps, for measuredSpeed(). */
  samples: { d: number; t: number }[];
};

export type FlightInput = {
  /** Stick forward / back, -1 … 1. Forward (+1) pushes the nose down, like a real stick. */
  pitch: number;
  /** Stick right / left, -1 … 1. Right (+1) rolls the right wing down. */
  roll: number;
  /** Rudder: -1 left, 0, +1 right. */
  yaw: number;
  /** -1 slow down, 0 hold, +1 speed up. */
  throttle: number;
};

/** Ground height under (x, z). The default is flat ground at y = 0. */
export type GroundAt = (x: number, z: number) => number;
const FLAT: GroundAt = () => 0;

/** Steps averaged by measuredSpeed(). */
const SAMPLES = 5;

export function createFlight(): FlightState {
  return { pos: { x: 0, y: FLIGHT.restHeight, z: 0 }, quat: { x: 0, y: 0, z: 0, w: 1 }, speed: 0, yawVel: 0, samples: [] };
}

/** Back on the runway start, level, stopped. */
export function resetFlight(s: FlightState) {
  Object.assign(s.pos, { x: 0, y: FLIGHT.restHeight, z: 0 });
  Object.assign(s.quat, { x: 0, y: 0, z: 0, w: 1 });
  s.speed = 0;
  s.yawVel = 0;
  s.samples.length = 0;
}

// ---- quaternion helpers (Hamilton product, unit quaternions) ----

/** a × b (apply b first, then a). */
export function quatMul(a: Quat, b: Quat): Quat {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

/** Rotation of `angle` radians about a unit axis. */
export function quatAxisAngle(ax: number, ay: number, az: number, angle: number): Quat {
  const s = Math.sin(angle / 2);
  return { x: ax * s, y: ay * s, z: az * s, w: Math.cos(angle / 2) };
}

function normalize(q: Quat) {
  const l = Math.hypot(q.x, q.y, q.z, q.w) || 1;
  q.x /= l;
  q.y /= l;
  q.z /= l;
  q.w /= l;
}

/** v rotated by q. */
export function rotate(q: Quat, v: Vec3): Vec3 {
  // t = 2 (q.xyz × v); v' = v + w t + q.xyz × t
  const tx = 2 * (q.y * v.z - q.z * v.y);
  const ty = 2 * (q.z * v.x - q.x * v.z);
  const tz = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

/** Unit vector along the nose. */
export function forwardOf(q: Quat): Vec3 {
  return rotate(q, { x: 0, y: 0, z: -1 });
}

/** Height of the plane origin over the ground. */
export function altitude(s: FlightState, groundAt: GroundAt = FLAT) {
  return s.pos.y - groundAt(s.pos.x, s.pos.z) - FLIGHT.restHeight;
}

/** Share of full pitch / roll / yaw authority: 1 in the air, growing with speed on the ground. */
export function authority(s: FlightState, groundAt: GroundAt = FLAT) {
  if (s.pos.y - groundAt(s.pos.x, s.pos.z) > FLIGHT.groundAltitude) return 1;
  return s.speed < 0.01 ? 0 : Math.min(1, s.speed / FLIGHT.fullRotationSpeed);
}

/** Advance one step of dt seconds. */
export function stepFlight(s: FlightState, input: FlightInput, dt: number, groundAt: GroundAt = FLAT) {
  // throttle
  if (input.throttle > 0) s.speed = Math.min(FLIGHT.maxSpeed, s.speed + FLIGHT.speedUp * dt);
  else if (input.throttle < 0) s.speed = Math.max(0, s.speed - FLIGHT.speedDown * dt);

  const k = authority(s, groundAt);
  const pitch = -input.pitch * FLIGHT.pitchSpeed * dt * k;
  const roll = -input.roll * FLIGHT.rollSpeed * 0.5 * dt * k;
  if (input.yaw !== 0) s.yawVel += -Math.sign(input.yaw) * FLIGHT.yawAccel * dt;
  else s.yawVel *= Math.exp(-3 * dt);

  // pitch / roll about the plane's own axes, yaw about world up
  let q = quatMul(s.quat, quatMul(quatAxisAngle(1, 0, 0, pitch), quatAxisAngle(0, 0, 1, roll)));
  q = quatMul(quatAxisAngle(0, 1, 0, s.yawVel * dt * k), q);
  normalize(q);
  Object.assign(s.quat, q);

  // fly along the nose; the ground is solid
  const f = forwardOf(s.quat);
  const from = { ...s.pos };
  s.pos.x += f.x * s.speed * dt;
  s.pos.y += f.y * s.speed * dt;
  s.pos.z += f.z * s.speed * dt;
  const floor = groundAt(s.pos.x, s.pos.z) + FLIGHT.restHeight;
  if (s.pos.y < floor) s.pos.y = floor;

  s.samples.push({ d: Math.hypot(s.pos.x - from.x, s.pos.y - from.y, s.pos.z - from.z), t: dt });
  if (s.samples.length > SAMPLES) s.samples.shift();
}

/** Ground speed averaged over the last few steps (what the HUD shows; lower than `speed` while pressed into the ground). */
export function measuredSpeed(s: FlightState) {
  let d = 0;
  let t = 0;
  for (const x of s.samples) {
    d += x.d;
    t += x.t;
  }
  return t > 0 ? d / t : 0;
}

// ---- gun ----

export type Bullet = { pos: Vec3; dir: Vec3; quat: Quat; born: number };
export type Gun = { lastShot: number; bullets: Bullet[] };

export function createGun(): Gun {
  return { lastShot: -Infinity, bullets: [] };
}

/** Fire from 2 m ahead of the nose if the cooldown allows. `now` in ms. Returns whether a bullet left. */
export function fire(g: Gun, s: FlightState, now: number): boolean {
  if (now - g.lastShot < GUN.cooldownMs) return false;
  g.lastShot = now;
  const dir = forwardOf(s.quat);
  const up = rotate(s.quat, { x: 0, y: 0.5, z: 0 });
  g.bullets.push({
    pos: { x: s.pos.x + up.x + dir.x * 2, y: s.pos.y + up.y + dir.y * 2, z: s.pos.z + up.z + dir.z * 2 },
    dir,
    quat: { ...s.quat },
    born: now,
  });
  return true;
}

/** Move bullets along their direction; drop them after GUN.bulletLifeMs or below the ground. `now` in ms. */
export function stepBullets(g: Gun, now: number, dt: number, groundAt: GroundAt = FLAT) {
  const d = GUN.bulletSpeed * dt;
  g.bullets = g.bullets.filter((b) => {
    if (now - b.born >= GUN.bulletLifeMs) return false;
    b.pos.x += b.dir.x * d;
    b.pos.y += b.dir.y * d;
    b.pos.z += b.dir.z * d;
    return b.pos.y >= groundAt(b.pos.x, b.pos.z);
  });
}
