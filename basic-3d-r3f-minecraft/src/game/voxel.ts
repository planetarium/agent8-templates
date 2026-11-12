// Voxel world: seeded terrain, block get/set, 10 × 10 chunks, exposed-face
// meshing, the crosshair raycast and the blocks the player collides with.
// Pure (no React, no three) so it can be unit-tested — see voxel.test.ts.
//
// Block (x, y, z) is the unit cube [x, x+1) × [y, y+1) × [z, z+1); its top
// face is at y + 1. The world spans x, z in [VOXEL.min, VOXEL.min + size)
// and y in [0, height). Outside is air, except below y = 0 (never meshed).

import { createNoise2D } from 'simplex-noise';
import { VOXEL } from '../config';
import type { Aabb } from './world';

export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export type Block = typeof AIR | typeof GRASS | typeof DIRT | typeof STONE;

export type World = { data: Uint8Array; size: number; height: number; min: number };

/** The seeded LCG of the Incanto minecraft template: string seed → 0 … 1 sequence. */
export function lcgRandom(seed: string): () => number {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    n = (n * 9301 + 49297) % 233280;
    return n / 233280;
  };
}

/** Column height function for a seed: floor((noise + 1) × 5) + 5, so 5 … 15. gx, gz are 0-based grid indices. */
export function heightFn(seed: string): (gx: number, gz: number) => number {
  const noise = createNoise2D(lcgRandom(seed));
  return (gx, gz) => Math.floor((noise(gx * 0.03, gz * 0.03) + 1) * 5) + 5;
}

export function emptyWorld(size = VOXEL.size, height = VOXEL.height, min = -size / 2): World {
  return { data: new Uint8Array(size * size * height), size, height, min };
}

/** Terrain: grass on top, 3 dirt below it, stone underneath. */
export function createWorld(seed: string = VOXEL.seed): World {
  const w = emptyWorld();
  const h = heightFn(seed);
  for (let gx = 0; gx < w.size; gx++) {
    for (let gz = 0; gz < w.size; gz++) {
      const top = h(gx, gz);
      for (let y = 0; y <= top; y++) setBlock(w, gx + w.min, y, gz + w.min, y === top ? GRASS : y >= top - 3 ? DIRT : STONE);
    }
  }
  return w;
}

function index(w: World, x: number, y: number, z: number) {
  const ix = x - w.min;
  const iz = z - w.min;
  if (ix < 0 || iz < 0 || y < 0 || ix >= w.size || iz >= w.size || y >= w.height) return -1;
  return ix + w.size * (iz + w.size * y);
}

export function inWorld(w: World, x: number, y: number, z: number) {
  return index(w, x, y, z) >= 0;
}

export function blockAt(w: World, x: number, y: number, z: number): Block {
  const i = index(w, x, y, z);
  return (i < 0 ? AIR : w.data[i]) as Block;
}

/** Blocks that hide a neighbor's face. Below the world counts as solid so the bottom layer has no underside. */
function solid(w: World, x: number, y: number, z: number) {
  return y < 0 || blockAt(w, x, y, z) !== AIR;
}

/** Sets a block; returns false outside the world or if nothing changed. */
export function setBlock(w: World, x: number, y: number, z: number, b: Block): boolean {
  const i = index(w, x, y, z);
  if (i < 0 || w.data[i] === b) return false;
  w.data[i] = b;
  return true;
}

/** Highest solid y in a column, or -1. */
export function topAt(w: World, x: number, z: number) {
  for (let y = w.height - 1; y >= 0; y--) if (blockAt(w, x, y, z) !== AIR) return y;
  return -1;
}

/** Feet position on the highest column within ±10 of the origin (the Incanto template's spawn rule). */
export function spawnPoint(w: World): [number, number, number] {
  let best = { x: 0, z: 0, y: -1 };
  for (let x = -10; x < 10; x++) {
    for (let z = -10; z < 10; z++) {
      const y = topAt(w, x, z);
      if (y > best.y) best = { x, z, y };
    }
  }
  return [best.x + 0.5, best.y + 1, best.z + 0.5];
}

// ---- chunks ----

export type ChunkKey = string;
export const chunkKey = (cx: number, cz: number): ChunkKey => `${cx},${cz}`;
export const chunkOf = (v: number) => Math.floor(v / VOXEL.chunk);

export function parseChunkKey(k: ChunkKey): [number, number] {
  const [cx, cz] = k.split(',').map(Number);
  return [cx, cz];
}

/** Chunks within `radius` chunks (a circle, like the Incanto template) of chunk (cx, cz), inside the world. */
export function activeChunks(w: World, cx: number, cz: number, radius = VOXEL.activeRadius): ChunkKey[] {
  const lo = chunkOf(w.min);
  const hi = chunkOf(w.min + w.size - 1);
  const out: ChunkKey[] = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const x = cx + dx;
      const z = cz + dz;
      if (dx * dx + dz * dz <= radius * radius && x >= lo && x <= hi && z >= lo && z <= hi) out.push(chunkKey(x, z));
    }
  }
  return out;
}

/** Chunks whose mesh changes when block (x, z) changes: its own, plus the neighbor across a chunk border it touches. */
export function chunksTouching(x: number, z: number): ChunkKey[] {
  const C = VOXEL.chunk;
  const cx = chunkOf(x);
  const cz = chunkOf(z);
  const out = [chunkKey(cx, cz)];
  const lx = x - cx * C;
  const lz = z - cz * C;
  if (lx === 0) out.push(chunkKey(cx - 1, cz));
  if (lx === C - 1) out.push(chunkKey(cx + 1, cz));
  if (lz === 0) out.push(chunkKey(cx, cz - 1));
  if (lz === C - 1) out.push(chunkKey(cx, cz + 1));
  return out;
}

// ---- meshing ----

/** Texture slots, in the order of the chunk mesh's material array. */
export const MATERIALS = ['grassTop', 'grassSide', 'dirt', 'stone'] as const;
export type MaterialSlot = (typeof MATERIALS)[number];

type Face = { n: [number, number, number]; corners: [number, number, number][] };

/** Each face's corners counter-clockwise seen from outside: bottom-left, bottom-right, top-right, top-left (uv 0,0 → 1,1; side faces keep +y up). */
export const FACES: Face[] = [
  { n: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { n: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { n: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];
const UV = [0, 0, 1, 0, 1, 1, 0, 1];

function slotOf(b: Block, ny: number): number {
  if (b === GRASS) return ny > 0 ? 0 : ny < 0 ? 2 : 1;
  return b === DIRT ? 2 : 3;
}

export type ChunkMesh = {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
  /** Index ranges per material slot (for BufferGeometry.addGroup). */
  groups: { start: number; count: number; materialIndex: number }[];
  faces: number;
};

/** Faces of chunk (cx, cz) that touch air, grouped by material slot. */
export function buildChunkMesh(w: World, cx: number, cz: number): ChunkMesh {
  const C = VOXEL.chunk;
  const bySlot = MATERIALS.map(() => ({ positions: [] as number[], normals: [] as number[], uvs: [] as number[] }));
  for (let x = cx * C; x < (cx + 1) * C; x++) {
    for (let z = cz * C; z < (cz + 1) * C; z++) {
      for (let y = 0; y < w.height; y++) {
        const b = blockAt(w, x, y, z);
        if (b === AIR) continue;
        for (const f of FACES) {
          if (solid(w, x + f.n[0], y + f.n[1], z + f.n[2])) continue;
          const s = bySlot[slotOf(b, f.n[1])];
          for (const [ox, oy, oz] of f.corners) {
            s.positions.push(x + ox, y + oy, z + oz);
            s.normals.push(...f.n);
          }
          s.uvs.push(...UV);
        }
      }
    }
  }
  const out: ChunkMesh = { positions: [], normals: [], uvs: [], indices: [], groups: [], faces: 0 };
  bySlot.forEach((s, materialIndex) => {
    const quads = s.positions.length / 12;
    if (quads === 0) return;
    const start = out.indices.length;
    for (let q = 0; q < quads; q++) {
      const v = out.positions.length / 3 + q * 4;
      out.indices.push(v, v + 1, v + 2, v, v + 2, v + 3);
    }
    out.positions.push(...s.positions);
    out.normals.push(...s.normals);
    out.uvs.push(...s.uvs);
    out.groups.push({ start, count: quads * 6, materialIndex });
    out.faces += quads;
  });
  return out;
}

// ---- raycast ----

export type RayHit = {
  /** The block hit. */
  block: [number, number, number];
  /** Outward normal of the face hit; block + normal is where a new block goes. */
  normal: [number, number, number];
  distance: number;
};

/**
 * First solid block along a ray (voxel traversal, Amanatides & Woo), within
 * maxDist. The block the ray starts in is skipped. `dir` need not be unit length.
 */
export function raycast(w: World, origin: [number, number, number], dir: [number, number, number], maxDist: number): RayHit | null {
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  if (len === 0) return null;
  const d = [dir[0] / len, dir[1] / len, dir[2] / len];
  const cell = [Math.floor(origin[0]), Math.floor(origin[1]), Math.floor(origin[2])];
  const step = d.map((v) => (v > 0 ? 1 : v < 0 ? -1 : 0));
  const tDelta = d.map((v) => (v !== 0 ? Math.abs(1 / v) : Infinity));
  const tMax = d.map((v, i) => {
    if (v === 0) return Infinity;
    const edge = v > 0 ? cell[i] + 1 : cell[i];
    return (edge - origin[i]) / v;
  });
  let t = 0;
  while (true) {
    const a = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : tMax[1] < tMax[2] ? 1 : 2;
    t = tMax[a];
    if (t > maxDist) return null;
    cell[a] += step[a];
    tMax[a] += tDelta[a];
    if (blockAt(w, cell[0], cell[1], cell[2]) !== AIR) {
      const normal: [number, number, number] = [0, 0, 0];
      normal[a] = -step[a];
      return { block: [cell[0], cell[1], cell[2]], normal, distance: t };
    }
    // the ray left the world box and moves away from it: nothing more to hit
    if (cell[1] >= w.height && step[1] >= 0) return null;
  }
}

// ---- collision ----

const blockBox = (x: number, y: number, z: number): Aabb => ({ minX: x, minY: y, minZ: z, maxX: x + 1, maxY: y + 1, maxZ: z + 1 });

/**
 * Solid blocks around a player standing at `feet` (radius `r` blocks
 * sideways, from 2 below the feet to 1 above the head), as AABBs for
 * stepPlayer. Columns outside the world are walls, so the player cannot
 * walk off the edge. Refill every frame; `out` is reused.
 */
export function collidersNear(w: World, feet: { x: number; y: number; z: number }, height: number, r = 2, out: Aabb[] = []): Aabb[] {
  out.length = 0;
  const fx = Math.floor(feet.x);
  const fz = Math.floor(feet.z);
  const y0 = Math.max(0, Math.floor(feet.y) - 2);
  const y1 = Math.floor(feet.y + height) + 1;
  const max = w.min + w.size;
  for (let x = fx - r; x <= fx + r; x++) {
    for (let z = fz - r; z <= fz + r; z++) {
      if (x < w.min || x >= max || z < w.min || z >= max) {
        out.push({ minX: x, minY: -1000, minZ: z, maxX: x + 1, maxY: 1000, maxZ: z + 1 });
        continue;
      }
      for (let y = y0; y <= y1; y++) if (blockAt(w, x, y, z) !== AIR) out.push(blockBox(x, y, z));
    }
  }
  return out;
}

/** Does block (x, y, z) intersect the player's box? (Placing there would bury the player.) */
export function blockHitsPlayer(x: number, y: number, z: number, feet: { x: number; y: number; z: number }, radius: number, height: number) {
  return x < feet.x + radius && x + 1 > feet.x - radius && z < feet.z + radius && z + 1 > feet.z - radius && y < feet.y + height && y + 1 > feet.y;
}
