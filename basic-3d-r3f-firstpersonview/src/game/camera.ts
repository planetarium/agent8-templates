// Third-person camera rules: genre presets, collision (keep the camera out
// of the level), the pull-in / spring-back distance, auto-follow yaw and the
// movement-direction latch that goes with it.
// Pure (no React, no three) so it can be unit-tested — see camera.test.ts.
//
// Orbit convention: the camera sits at focus + distance × (sin yaw · cos
// pitch, sin pitch, cos yaw · cos pitch), so yaw 0 puts it on +z looking
// toward −z.

import { fieldHeight, rampHeight, type Aabb, type HeightField, type Ramp } from './world';

export type CameraPreset = 'follow' | 'shoulder' | 'wide';

export type OrbitCamera = {
  /** Default / min / max distance from the focus (m); the wheel zooms between min and max. */
  distance: number;
  minDistance: number;
  maxDistance: number;
  /** Start / min / max pitch (radians above the horizon; negative looks up from below the focus). */
  pitch: number;
  minPitch: number;
  maxPitch: number;
  /** Focus height above the feet (eye level). */
  height: number;
  /** Sideways offset of the camera and focus to the right (m): an over-the-shoulder view. */
  shoulder: number;
  /** Vertical FOV on landscape / portrait screens (degrees). */
  fov: number;
  portraitFov: number;
};

/** Pick one with `CAMERA.preset` in config.ts. */
export const CAMERA_PRESETS: Record<CameraPreset, OrbitCamera> = {
  /** Behind and a little above the character — platformers, adventure, most games. */
  follow: { distance: 4.5, minDistance: 2.5, maxDistance: 10, pitch: 0.18, minPitch: -0.15, maxPitch: 1.1, height: 1.3, shoulder: 0, fov: 65, portraitFov: 75 },
  /** Over the right shoulder, close — third-person shooters (add a crosshair). */
  shoulder: { distance: 3, minDistance: 1.8, maxDistance: 6, pitch: 0.1, minPitch: -0.4, maxPitch: 1.0, height: 1.45, shoulder: 0.6, fov: 60, portraitFov: 70 },
  /** Further back and higher — exploration, building, seeing the ground around you. */
  wide: { distance: 7, minDistance: 3, maxDistance: 16, pitch: 0.3, minPitch: -0.1, maxPitch: 1.2, height: 1.3, shoulder: 0, fov: 65, portraitFov: 75 },
};

export type Vec3 = { x: number; y: number; z: number };
export type Obstacles = { boxes: Aabb[]; ramps?: Ramp[]; fields?: HeightField[] };

/** Clearance kept between the camera and any surface (m). */
export const CAMERA_RADIUS = 0.3;
/** Sample spacing along the ray for ramps and height fields (m). */
const MARCH = 0.2;

/** Ray parameter where the ray enters box b, or null (also null if the origin is inside). */
function rayBox(o: Vec3, d: Vec3, b: Aabb, pad: number): number | null {
  let t0 = -Infinity;
  let t1 = Infinity;
  for (const [oa, da, lo, hi] of [
    [o.x, d.x, b.minX - pad, b.maxX + pad],
    [o.y, d.y, b.minY - pad, b.maxY + pad],
    [o.z, d.z, b.minZ - pad, b.maxZ + pad],
  ]) {
    if (da === 0) {
      if (oa < lo || oa > hi) return null;
      continue;
    }
    let a = (lo - oa) / da;
    let c = (hi - oa) / da;
    if (a > c) [a, c] = [c, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, c);
  }
  if (t0 > t1 || t1 < 0 || t0 < 0) return null;
  return t0;
}

/**
 * How far from `from` along unit `dir` the camera can sit (≤ maxDist) and
 * still keep `radius` clear of boxes, ramps and height fields. A box the
 * focus is already within `radius` of is tested without the padding, so a
 * wall next to the player does not pull the camera onto the player.
 */
export function cameraReach(from: Vec3, dir: Vec3, maxDist: number, obs: Obstacles, radius = CAMERA_RADIUS): number {
  let reach = maxDist;
  for (const b of obs.boxes) {
    const t = rayBox(from, dir, b, radius) ?? rayBox(from, dir, b, 0);
    if (t !== null && t < reach) reach = t;
  }
  const surfaces = [
    ...(obs.ramps ?? []).map((r) => (x: number, z: number) => rampHeight(r, x, z)),
    ...(obs.fields ?? []).map((f) => (x: number, z: number) => fieldHeight(f, x, z)),
  ];
  if (surfaces.length > 0) {
    for (let t = MARCH; t < reach; t += MARCH) {
      const x = from.x + dir.x * t;
      const y = from.y + dir.y * t;
      const z = from.z + dir.z * t;
      if (surfaces.some((h) => {
        const s = h(x, z);
        return s !== null && y < s + radius;
      })) {
        reach = t - MARCH;
        break;
      }
    }
  }
  return Math.max(0, reach);
}

/** Camera distance this frame: pull in at once when something is in the way, ease back out over ~tau seconds. */
export function springDistance(current: number, target: number, dt: number, tau = 0.3): number {
  if (target <= current) return target;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

// ---- auto-follow ----

export const FOLLOW = {
  /** Time constant (s) of swinging behind the motion. */
  tau: 0.6,
  /** After the player drags the camera, leave it alone this long (s). */
  holdAfterDrag: 2,
  /** Below this horizontal speed (m/s) the camera does not follow. */
  minSpeed: 1,
};

export function wrapAngle(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** Yaw that puts the camera behind a horizontal velocity, or null when slower than FOLLOW.minSpeed. */
export function behindYaw(vx: number, vz: number, minSpeed = FOLLOW.minSpeed): number | null {
  if (Math.hypot(vx, vz) < minSpeed) return null;
  return Math.atan2(-vx, -vz);
}

/**
 * One step of the auto-follow: eases `yaw` toward behind the motion with
 * time constant `tau`. Full strength when moving away from the camera, half
 * when moving across the view, none when running toward it (so backing up
 * never flips the camera).
 */
export function followYawStep(yaw: number, vx: number, vz: number, dt: number, tau = FOLLOW.tau): number {
  const target = behindYaw(vx, vz);
  if (target === null) return yaw;
  const d = wrapAngle(target - yaw);
  const weight = (1 + Math.cos(d)) / 2;
  return wrapAngle(yaw + d * (1 - Math.exp(-dt / tau)) * weight);
}

/** Camera-relative movement basis that holds still while the camera swings. */
export type MoveLatch = { yaw: number; ax: number; ay: number };

/** A stick / key direction that turns more than this in one frame is a new direction. */
const NEW_DIRECTION = Math.PI / 3;

/**
 * The yaw that movement input is relative to. It is the camera yaw when the
 * current input direction began; while the same direction is held (or turned
 * smoothly) it stays, so holding D keeps running the same way while the
 * camera swings behind. Releasing, a sudden new direction or dragging the
 * camera re-reads the camera yaw.
 */
export function latchMoveYaw(l: MoveLatch, ax: number, ay: number, cameraYaw: number, dragging: boolean): number {
  const len = Math.hypot(ax, ay);
  const prev = Math.hypot(l.ax, l.ay);
  const turn = len > 0 && prev > 0 ? Math.acos(Math.max(-1, Math.min(1, (ax * l.ax + ay * l.ay) / (len * prev)))) : Infinity;
  if (len < 0.1 || dragging || prev < 0.1 || turn > NEW_DIRECTION) l.yaw = cameraYaw;
  l.ax = len < 0.1 ? 0 : ax;
  l.ay = len < 0.1 ? 0 : ay;
  return l.yaw;
}
