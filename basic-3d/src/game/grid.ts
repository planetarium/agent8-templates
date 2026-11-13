// Ground grid math for tile / board / placement games. Pure (no React, no
// three) so it can be unit-tested — see grid.test.ts.
// Cells are indexed (i, j) along (x, z); cell (0, 0) is centered on the
// origin when `cells` is odd and touches it at a corner when even.

export type Grid = { cell: number; cells: number };
export type Cell = { i: number; j: number };

/** Lowest cell index, so indices run first … first + cells - 1. */
function first(g: Grid) {
  return -Math.floor(g.cells / 2);
}

/** Offset that puts the grid's outer edge at ±cells·cell/2. */
function offset(g: Grid) {
  return g.cells % 2 === 0 ? 0 : g.cell / 2;
}

/** The cell under world point (x, z), or null outside the grid. */
export function cellAt(g: Grid, x: number, z: number): Cell | null {
  const i = Math.floor((x + offset(g)) / g.cell);
  const j = Math.floor((z + offset(g)) / g.cell);
  const lo = first(g);
  const hi = lo + g.cells - 1;
  if (i < lo || i > hi || j < lo || j > hi) return null;
  return { i, j };
}

/** World-space center (x, z) of a cell. */
export function cellCenter(g: Grid, c: Cell): { x: number; z: number } {
  return { x: (c.i + 0.5) * g.cell - offset(g), z: (c.j + 0.5) * g.cell - offset(g) };
}
