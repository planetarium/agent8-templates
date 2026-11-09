import { describe, expect, test } from 'bun:test';
import {
  CAMERA_PRESETS,
  CAMERA_RADIUS,
  behindYaw,
  cameraReach,
  followYawStep,
  latchMoveYaw,
  springDistance,
  wrapAngle,
  type MoveLatch,
} from './camera';
import type { Aabb } from './world';

const FLOOR: Aabb = { minX: -50, minY: -1, minZ: -50, maxX: 50, maxY: 0, maxZ: 50 };
const head = { x: 0, y: 1.3, z: 0 };
const back = { x: 0, y: 0, z: 1 }; // yaw 0, level: the camera goes toward +z

describe('presets', () => {
  test('follow is the default framing: 4.5 m, ~10° down, eye height 1.3, FOV 65 / 75', () => {
    const f = CAMERA_PRESETS.follow;
    expect([f.distance, f.pitch, f.height, f.fov, f.portraitFov]).toEqual([4.5, 0.18, 1.3, 65, 75]);
    expect(CAMERA_PRESETS.shoulder.shoulder).toBe(0.6);
    expect(CAMERA_PRESETS.wide.distance).toBe(7);
    for (const p of Object.values(CAMERA_PRESETS)) {
      expect(p.minDistance).toBeLessThanOrEqual(p.distance);
      expect(p.distance).toBeLessThanOrEqual(p.maxDistance);
      expect(p.minPitch).toBeLessThanOrEqual(p.pitch);
      expect(p.pitch).toBeLessThanOrEqual(p.maxPitch);
    }
  });
});

describe('camera collision', () => {
  test('open space: full distance', () => {
    expect(cameraReach(head, back, 4.5, { boxes: [FLOOR] })).toBe(4.5);
  });

  test('a wall behind the player pulls the camera in front of it, radius clear', () => {
    const wall: Aabb = { minX: -5, minY: 0, minZ: 2, maxX: 5, maxY: 4, maxZ: 3 };
    expect(cameraReach(head, back, 4.5, { boxes: [FLOOR, wall] })).toBeCloseTo(2 - CAMERA_RADIUS, 6);
  });

  test('a wall right beside the focus does not collapse the camera', () => {
    const side: Aabb = { minX: 0.1, minY: 0, minZ: -5, maxX: 1, maxY: 4, maxZ: 5 };
    expect(cameraReach(head, back, 4.5, { boxes: [FLOOR, side] })).toBe(4.5);
  });

  test('ramps and height fields block too', () => {
    const hill = { minX: -10, maxX: 10, minZ: 1, maxZ: 10, heightAt: () => 2 };
    expect(cameraReach(head, back, 4.5, { boxes: [], fields: [hill] })).toBeLessThan(1.2);
    const ramp = { minX: -2, maxX: 2, minZ: 2, maxZ: 8, height: 3, color: '', dir: '+z' as const };
    const reach = cameraReach(head, back, 6, { boxes: [], ramps: [ramp] });
    expect(reach).toBeGreaterThan(2);
    expect(reach).toBeLessThan(6);
  });

  test('spring: pull in at once, ease back out', () => {
    expect(springDistance(4.5, 1.5, 1 / 60)).toBe(1.5);
    const d = springDistance(1.5, 4.5, 1 / 60);
    expect(d).toBeGreaterThan(1.5);
    expect(d).toBeLessThan(1.8);
    let x = 1.5;
    for (let i = 0; i < 120; i++) x = springDistance(x, 4.5, 1 / 60);
    expect(x).toBeCloseTo(4.5, 1);
  });
});

describe('follow yaw', () => {
  test('behind the motion: running toward +x puts the camera on −x', () => {
    expect(behindYaw(5, 0)).toBeCloseTo(-Math.PI / 2, 6);
    expect(behindYaw(0, -5)).toBeCloseTo(0, 6); // away from the start camera: already behind
    expect(behindYaw(0.2, 0)).toBeNull();
  });

  test('eases with a ~0.6 s time constant; never flips when backing toward the camera', () => {
    let yaw = 0;
    const steps = (s: number, vx: number, vz: number) => {
      for (let i = 0; i < Math.round(s * 60); i++) yaw = followYawStep(yaw, vx, vz, 1 / 60);
    };
    steps(0.6, 6, 0); // across the view: half strength at first
    expect(yaw).toBeLessThan(0);
    expect(yaw).toBeGreaterThan(-Math.PI / 2);
    steps(3, 6, 0);
    expect(wrapAngle(yaw + Math.PI / 2)).toBeCloseTo(0, 1);
    yaw = 0;
    steps(2, 0, 6); // running at the camera
    expect(yaw).toBe(0);
  });

  test('movement latch: a held direction keeps its basis while the camera swings', () => {
    const l: MoveLatch = { yaw: 0, ax: 0, ay: 0 };
    expect(latchMoveYaw(l, 1, 0, 0, false)).toBe(0); // press D, camera at 0
    expect(latchMoveYaw(l, 1, 0, -1, false)).toBe(0); // camera swung, still D: keep running +x
    expect(latchMoveYaw(l, 0.95, 0.3, -1.1, false)).toBe(0); // smooth stick turn: keep
    expect(latchMoveYaw(l, 0, 1, -1.2, false)).toBe(-1.2); // new direction (W): read the camera
    expect(latchMoveYaw(l, 0, 1, -1.5, true)).toBe(-1.5); // dragging: follow the camera
    latchMoveYaw(l, 0, 0, -1.5, false); // release
    expect(latchMoveYaw(l, 1, 0, -2, false)).toBe(-2);
  });
});
