import { describe, expect, test } from 'bun:test';
import { cellAt, cellCenter, type Grid } from './grid';

const ODD: Grid = { cell: 1, cells: 21 };
const EVEN: Grid = { cell: 2, cells: 4 };

describe('odd grid (a cell on the origin)', () => {
  test('the origin is cell (0, 0), centered', () => {
    expect(cellAt(ODD, 0, 0)).toEqual({ i: 0, j: 0 });
    expect(cellAt(ODD, 0.49, -0.49)).toEqual({ i: 0, j: 0 });
    expect(cellCenter(ODD, { i: 0, j: 0 })).toEqual({ x: 0, z: 0 });
  });

  test('neighbors and edges', () => {
    expect(cellAt(ODD, 0.51, 0)).toEqual({ i: 1, j: 0 });
    expect(cellAt(ODD, -10.4, 10.4)).toEqual({ i: -10, j: 10 });
    expect(cellAt(ODD, 10.6, 0)).toBeNull();
    expect(cellAt(ODD, 0, -10.6)).toBeNull();
  });
});

describe('even grid (lines through the origin)', () => {
  test('cells meet at the origin', () => {
    expect(cellAt(EVEN, 0.1, 0.1)).toEqual({ i: 0, j: 0 });
    expect(cellAt(EVEN, -0.1, -0.1)).toEqual({ i: -1, j: -1 });
    expect(cellCenter(EVEN, { i: 0, j: 0 })).toEqual({ x: 1, z: 1 });
    expect(cellCenter(EVEN, { i: -2, j: 1 })).toEqual({ x: -3, z: 3 });
  });

  test('outside is null', () => {
    expect(cellAt(EVEN, 4.1, 0)).toBeNull();
    expect(cellAt(EVEN, -4.1, 0)).toBeNull();
  });
});

test('round trip: every cell center maps back to its cell', () => {
  for (const g of [ODD, EVEN]) {
    const lo = -Math.floor(g.cells / 2);
    for (let i = lo; i < lo + g.cells; i++) {
      for (let j = lo; j < lo + g.cells; j++) {
        const c = cellCenter(g, { i, j });
        expect(cellAt(g, c.x, c.z)).toEqual({ i, j });
      }
    }
  }
});
