// Static level geometry: axis-aligned boxes. The renderer (Level.tsx) and the
// player collision (player.ts) both read this list, so adding a box here adds
// a visible, standable surface.

export type Box = {
  /** Center [x, y, z] and full size [w, h, d]. */
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
};

export const BOXES: Box[] = [
  // Floor: top face at y = 0.
  { pos: [0, -0.5, 0], size: [80, 1, 80], color: '#7fb069' },
  // Steps along the x axis (z = 0) so they are reachable in sideview too.
  { pos: [4, 0.5, 0], size: [2, 1, 2], color: '#e6aa68' },
  { pos: [7, 1.25, 0], size: [2, 2.5, 2], color: '#ca3c25' },
  { pos: [10.5, 2.5, 0], size: [3, 0.5, 2], color: '#4f6d7a' },
  { pos: [-5, 0.75, 0], size: [2.5, 1.5, 2.5], color: '#e6aa68' },
  // Freeview-only scenery: behind the z = 0 line, so it is background in sideview.
  { pos: [-6, 1, -7], size: [3, 2, 3], color: '#4f6d7a' },
  { pos: [6, 0.5, -9], size: [4, 1, 2], color: '#ca3c25' },
];

export type Aabb = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number };

export const COLLIDERS: Aabb[] = BOXES.map(({ pos: [x, y, z], size: [w, h, d] }) => ({
  minX: x - w / 2,
  minY: y - h / 2,
  minZ: z - d / 2,
  maxX: x + w / 2,
  maxY: y + h / 2,
  maxZ: z + d / 2,
}));
