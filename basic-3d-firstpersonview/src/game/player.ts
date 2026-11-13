// Kinematic player: velocity integration + axis-by-axis AABB collision,
// step-up onto low ledges, ramps and terrain height fields (with a slope
// limit), and riding moving boxes.
// Pure (no React, no three) so it can be unit-tested — see player.test.ts.
//
// Jump feel:
// - coyote time: a jump still works PLAYER.coyoteTime s after leaving a ledge
// - input buffer: a press is remembered PLAYER.jumpBuffer s from the moment it
//   was pressed, so pressing just before landing jumps on touchdown
// - a jump consumes both, so one press = one jump
// "Grounded" only ever comes from collision: the player moved down into a
// box top, stepped up onto one, or stands on a ramp or height field this step.
// Nothing lifts the player into a box: step-up, ramp and height-field snaps
// check headroom first, and a box the player is already inside is ignored
// (never landed on from below).

import { PLAYER } from '../config';
import { fieldHeight, rampHeight, type Aabb, type HeightField, type Ramp } from './world';

export type PlayerState = {
  pos: { x: number; y: number; z: number }; // feet center
  vel: { x: number; y: number; z: number };
  grounded: boolean;
  /** The box stood on this step (null on ramps / in the air). */
  ground: Aabb | null;
  /** Clock time the player was last grounded (-Infinity once a jump used it). */
  groundedAt: number;
  /** Facing yaw (radians, 0 = +z). */
  facing: number;
  /** Increments on every jump — handy for animation / sound triggers. */
  jumps: number;
};

export type JumpInput = { jumpPressedAt: number };

/** While walking down a ramp, stick to it if the surface is at most this far below. */
const RAMP_SNAP = 0.2;

export function createPlayer(): PlayerState {
  const [x, y, z] = PLAYER.spawn;
  return { pos: { x, y, z }, vel: { x: 0, y: 0, z: 0 }, grounded: false, ground: null, groundedAt: -Infinity, facing: 0, jumps: 0 };
}

function overlaps(p: PlayerState['pos'], b: Aabb) {
  const r = PLAYER.radius;
  return (
    p.x + r > b.minX && p.x - r < b.maxX && p.y + PLAYER.height > b.minY && p.y < b.maxY && p.z + r > b.minZ && p.z - r < b.maxZ
  );
}

function land(p: PlayerState, b: Aabb) {
  p.pos.y = b.maxY;
  p.vel.y = 0;
  p.grounded = true;
  p.ground = b;
}

/**
 * Would moving the feet to height y push the player into a collider (other than `except`)
 * it does not already overlap? Checked before every lift (step-up, ramp / height-field
 * snap up) and every snap down. A box the player is already inside does not count, so
 * it never blocks standing on the surface.
 */
function blockedAt(p: PlayerState, y: number, colliders: Aabb[], except?: Aabb) {
  const at = { x: p.pos.x, y, z: p.pos.z };
  return colliders.some((b) => b !== except && overlaps(at, b) && !overlaps(p.pos, b));
}

const EPS = 1e-6;

function moveAxis(p: PlayerState, axis: 'x' | 'y' | 'z', delta: number, colliders: Aabb[]) {
  if (delta === 0) return;
  const from = p.pos[axis];
  p.pos[axis] += delta;
  for (const b of colliders) {
    if (!overlaps(p.pos, b)) continue;
    if (axis === 'y') {
      // Only a box the feet (falling) or the head (rising) were clear of before this move
      // stops it; a box the player was already inside never moves the player onto its top.
      if (delta < 0 && from >= b.maxY - EPS) land(p, b);
      else if (delta > 0 && from + PLAYER.height <= b.minY + EPS) {
        p.pos.y = b.minY - PLAYER.height;
        p.vel.y = 0;
      }
      continue;
    }
    // Step-up: a low ledge hit while standing (or coming down) lifts the player onto it —
    // if there is headroom up there; otherwise the ledge is a wall.
    const rise = b.maxY - p.pos.y;
    if (rise <= PLAYER.stepHeight && (p.grounded || p.vel.y <= 0) && !blockedAt(p, b.maxY, colliders, b)) {
      land(p, b);
      continue;
    }
    const r = PLAYER.radius;
    const min = axis === 'x' ? b.minX : b.minZ;
    const max = axis === 'x' ? b.maxX : b.maxZ;
    p.pos[axis] = delta > 0 ? min - r - 1e-4 : max + r + 1e-4;
    p.vel[axis] = 0;
  }
}

/** Undo this step's horizontal move (a wall). */
function undoHorizontal(p: PlayerState, fromX: number, fromZ: number) {
  p.pos.x = fromX;
  p.pos.z = fromZ;
  p.vel.x = 0;
  p.vel.z = 0;
}

/** Ramps: stand on the surface, or treat a tall side — or a box above the surface — as a wall. */
function resolveRamps(p: PlayerState, ramps: Ramp[], wasGrounded: boolean, fromX: number, fromZ: number, colliders: Aabb[]) {
  for (const r of ramps) {
    let h = rampHeight(r, p.pos.x, p.pos.z);
    if (h === null) continue;
    if (p.pos.y < h - PLAYER.stepHeight) {
      undoHorizontal(p, fromX, fromZ);
      continue;
    }
    if (h > p.pos.y && blockedAt(p, h, colliders)) {
      undoHorizontal(p, fromX, fromZ);
      h = rampHeight(r, fromX, fromZ);
      if (h === null) continue;
    }
    snapTo(p, h, wasGrounded, colliders);
  }
}

/**
 * Stand on a surface height h if falling onto it (or walking down it while grounded) —
 * unless that height pushes the player into a box. That holds going down too: a player
 * just stepped up onto a landing box at the top of a slope stays on the box instead of
 * being pulled down into its side (where every later snap would be refused).
 */
function snapTo(p: PlayerState, h: number, wasGrounded: boolean, colliders: Aabb[]) {
  if (p.vel.y <= 0 && p.pos.y <= h + (wasGrounded ? RAMP_SNAP : 0) && !blockedAt(p, h, colliders)) {
    p.pos.y = h;
    p.vel.y = 0;
    p.grounded = true;
    p.ground = null;
  }
}

/**
 * Height fields: like ramps, plus a slope limit. Walking up a slope steeper
 * than PLAYER.maxSlope, into a face more than stepHeight above the feet, or
 * up under a box with no headroom undoes this step's horizontal move.
 */
function resolveFields(p: PlayerState, fields: HeightField[], wasGrounded: boolean, fromX: number, fromZ: number, colliders: Aabb[]) {
  const maxRise = Math.tan(PLAYER.maxSlope);
  for (const f of fields) {
    let h = fieldHeight(f, p.pos.x, p.pos.z);
    if (h === null) continue;
    const run = Math.hypot(p.pos.x - fromX, p.pos.z - fromZ);
    const from = fieldHeight(f, fromX, fromZ);
    const tooSteep = wasGrounded && from !== null && run > 1e-9 && (h - from) / run > maxRise;
    const noHeadroom = h > p.pos.y && blockedAt(p, h, colliders);
    if (tooSteep || noHeadroom || p.pos.y < h - PLAYER.stepHeight) {
      undoHorizontal(p, fromX, fromZ);
      h = fieldHeight(f, fromX, fromZ);
      if (h === null) continue;
    }
    snapTo(p, h, wasGrounded, colliders);
  }
}

/**
 * Advance one step.
 * @param move desired horizontal velocity as a fraction of PLAYER.runSpeed, in WORLD space (length ≤ 1)
 * @param jump shared input; its jumpPressedAt is cleared when a jump uses it
 * @param now clock in seconds (same clock as jump.jumpPressedAt)
 * @param colliders boxes; moving ones carry `moved` and must already be at this step's position
 * @param lockZ keep the player on the z = 0 plane (side-scrolling views, and the tests)
 * @param ramps wedge surfaces, see world.ts
 * @param fields terrain height fields, see world.ts
 */
export function stepPlayer(
  p: PlayerState,
  move: { x: number; z: number },
  jump: JumpInput,
  now: number,
  dt: number,
  colliders: Aabb[],
  lockZ = false,
  ramps: Ramp[] = [],
  fields: HeightField[] = [],
) {
  // Ride the box we stood on last step.
  const carrier = p.grounded ? p.ground?.moved : undefined;
  if (carrier) {
    p.pos.x += carrier.x;
    p.pos.y += carrier.y;
    p.pos.z += carrier.z;
  }

  // Horizontal: accelerate toward the target velocity.
  const tx = move.x * PLAYER.runSpeed;
  const tz = lockZ ? 0 : move.z * PLAYER.runSpeed;
  const accel = (p.grounded ? PLAYER.groundAccel : PLAYER.airAccel) * dt;
  const dvx = tx - p.vel.x;
  const dvz = tz - p.vel.z;
  const dl = Math.hypot(dvx, dvz);
  if (dl <= accel) {
    p.vel.x = tx;
    p.vel.z = tz;
  } else {
    p.vel.x += (dvx / dl) * accel;
    p.vel.z += (dvz / dl) * accel;
  }
  if (Math.hypot(tx, tz) > 0.2) p.facing = Math.atan2(tx, tz);

  // Jump: buffered press + coyote window, both consumed.
  if (now - jump.jumpPressedAt <= PLAYER.jumpBuffer && now - p.groundedAt <= PLAYER.coyoteTime) {
    p.vel.y = PLAYER.jumpVelocity;
    jump.jumpPressedAt = -Infinity;
    p.groundedAt = -Infinity;
    p.jumps++;
  }

  p.vel.y = Math.max(p.vel.y - PLAYER.gravity * dt, -PLAYER.maxFall);

  const wasGrounded = p.grounded;
  p.grounded = false;
  p.ground = null;
  moveAxis(p, 'y', p.vel.y * dt, colliders);
  const fromX = p.pos.x;
  const fromZ = p.pos.z;
  moveAxis(p, 'x', p.vel.x * dt, colliders);
  moveAxis(p, 'z', p.vel.z * dt, colliders);
  if (lockZ) p.pos.z = 0;
  resolveRamps(p, ramps, wasGrounded, fromX, fromZ, colliders);
  resolveFields(p, fields, wasGrounded, fromX, fromZ, colliders);
  if (p.grounded) p.groundedAt = now;

  if (p.pos.y < PLAYER.killY) {
    const [x, y, z] = PLAYER.spawn;
    Object.assign(p.pos, { x, y, z });
    Object.assign(p.vel, { x: 0, y: 0, z: 0 });
  }
}
