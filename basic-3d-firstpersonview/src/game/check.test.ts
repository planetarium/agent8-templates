// The preview measuring hook's projection: the player's box on the page.
import { describe, expect, test } from 'bun:test';
import { PerspectiveCamera } from 'three';
import { createCheck, projectBox } from './check';

const canvas = { left: 10, top: 20, width: 400, height: 800 };

function cameraAt(z: number) {
  const camera = new PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 100);
  camera.position.set(0, 1, z);
  camera.lookAt(0, 1, 0);
  camera.updateMatrixWorld();
  return camera;
}

describe('projectBox', () => {
  const player = { pos: { x: 0, y: 0, z: 0 }, radius: 0.35, height: 2 };

  test('a box in front of the camera lands in the middle of the canvas, in page px', () => {
    const r = projectBox(player, cameraAt(5), canvas)!;
    expect(r).not.toBeNull();
    expect(r.x + r.w / 2).toBeCloseTo(canvas.left + canvas.width / 2, 0);
    expect(r.y + r.h / 2).toBeCloseTo(canvas.top + canvas.height / 2, 0);
    expect(r.h).toBeGreaterThan(r.w);
  });

  test('a closer camera makes the box bigger', () => {
    expect(projectBox(player, cameraAt(3), canvas)!.h).toBeGreaterThan(projectBox(player, cameraAt(6), canvas)!.h);
  });

  test('a box half past the right edge is clipped to the canvas edge', () => {
    // Half the view is 0.87 m wide at 3 m with this camera: the box spans 0.55..1.25 m.
    const r = projectBox({ ...player, pos: { x: 0.9, y: 0, z: 0 } }, cameraAt(3), canvas)!;
    expect(r.x).toBeLessThan(canvas.left + canvas.width);
    expect(r.x + r.w).toBe(canvas.left + canvas.width);
  });

  test('a box wholly off to the side has no rectangle', () => {
    expect(projectBox({ ...player, pos: { x: 3, y: 0, z: 0 } }, cameraAt(3), canvas)).toBeNull();
  });

  test('a box behind the camera has no rectangle', () => {
    expect(projectBox({ ...player, pos: { x: 0, y: 0, z: 10 } }, cameraAt(5), canvas)).toBeNull();
  });
});

describe('createCheck', () => {
  const fakeCanvas = { getBoundingClientRect: () => canvas } as unknown as HTMLCanvasElement;

  test('is not ready before the first frame, and reports no player without one', () => {
    const view = { camera: cameraAt(5), canvas: fakeCanvas, frames: 0 };
    const check = createCheck(() => view);
    expect(check.ready()).toBe(false);
    view.frames = 1;
    expect(check.ready()).toBe(true);
    expect(check.player()).toBeNull();
    expect(check.viewport()).toEqual({ x: 10, y: 20, w: 400, h: 800 });
    expect(check.elements()).toEqual([]);
  });

  test('reports the player box on the screen', () => {
    const view = { camera: cameraAt(5), canvas: fakeCanvas, frames: 1 };
    const check = createCheck(() => view, () => ({ pos: { x: 0, y: 0, z: 0 }, radius: 0.35, height: 2 }));
    expect(check.player()?.screen).toEqual(projectBox({ pos: { x: 0, y: 0, z: 0 }, radius: 0.35, height: 2 }, view.camera, canvas));
  });
});
