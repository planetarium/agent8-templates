import { describe, expect, test } from 'bun:test';
import { PLAYER, VOXEL } from '../config';
import { createPlayer, stepPlayer } from './player';
import type { Aabb } from './world';
import {
  AIR,
  DIRT,
  FACES,
  GRASS,
  STONE,
  activeChunks,
  blockAt,
  blockHitsPlayer,
  buildChunkMesh,
  chunkKey,
  chunksTouching,
  collidersNear,
  createWorld,
  emptyWorld,
  heightFn,
  lcgRandom,
  raycast,
  setBlock,
  spawnPoint,
  topAt,
} from './voxel';

describe('seed and terrain', () => {
  test('same seed, same sequence and world; another seed differs', () => {
    const a = lcgRandom('minecraft123-cubemap');
    const b = lcgRandom('minecraft123-cubemap');
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
    expect(createWorld().data).toEqual(createWorld().data);
    expect(createWorld('other').data).not.toEqual(createWorld().data);
  });

  test('column heights are floor((n + 1) × 5) + 5, so 5 … 15', () => {
    const h = heightFn(VOXEL.seed);
    const seen = new Set<number>();
    for (let x = 0; x < VOXEL.size; x++) for (let z = 0; z < VOXEL.size; z++) seen.add(h(x, z));
    for (const v of seen) expect(v >= 5 && v <= 15 && Number.isInteger(v)).toBe(true);
    expect(seen.size).toBeGreaterThan(3);
  });

  test('layers: grass on top, 3 dirt, stone below; nothing above', () => {
    const w = createWorld();
    const top = topAt(w, 0, 0);
    expect(blockAt(w, 0, top, 0)).toBe(GRASS);
    expect(blockAt(w, 0, top - 1, 0)).toBe(DIRT);
    expect(blockAt(w, 0, top - 3, 0)).toBe(DIRT);
    expect(blockAt(w, 0, top - 4, 0)).toBe(STONE);
    expect(blockAt(w, 0, 0, 0)).toBe(STONE);
    expect(blockAt(w, 0, top + 1, 0)).toBe(AIR);
    expect(blockAt(w, -41, 5, 0)).toBe(AIR); // outside the 80 × 80
  });

  test('spawn stands on the highest column near the origin', () => {
    const w = createWorld();
    const [x, y, z] = spawnPoint(w);
    expect(blockAt(w, Math.floor(x), y - 1, Math.floor(z))).not.toBe(AIR);
    for (let i = -10; i < 10; i++) for (let j = -10; j < 10; j++) expect(topAt(w, i, j) + 1).toBeLessThanOrEqual(y);
  });
});

describe('chunks', () => {
  test('active chunks: a radius-3 circle, clipped to the 8 × 8 world', () => {
    const w = createWorld();
    expect(activeChunks(w, 0, 0).length).toBe(29); // like the Incanto template at spawn
    expect(activeChunks(w, -4, -4).length).toBeLessThan(29);
    expect(activeChunks(w, 0, 0)).toContain(chunkKey(-3, 0));
    expect(activeChunks(w, 0, 0)).not.toContain(chunkKey(-3, -3));
  });

  test('an edit on a chunk border also dirties the neighbor', () => {
    expect(chunksTouching(5, 5)).toEqual([chunkKey(0, 0)]);
    expect(chunksTouching(0, 5)).toEqual([chunkKey(0, 0), chunkKey(-1, 0)]);
    expect(chunksTouching(-1, 9)).toEqual([chunkKey(-1, 0), chunkKey(0, 0), chunkKey(-1, 1)]);
  });
});

describe('meshing', () => {
  test('a lone block has 6 faces, wound counter-clockwise from outside', () => {
    const w = emptyWorld();
    setBlock(w, 3, 5, 3, DIRT);
    const m = buildChunkMesh(w, 0, 0);
    expect(m.faces).toBe(6);
    for (const f of FACES) {
      const [a, b, c] = f.corners;
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]].map((c) => c + 0); // -0 → 0
      expect(n).toEqual(f.n);
    }
  });

  test('hidden faces are culled; the bottom layer has no underside', () => {
    const w = emptyWorld();
    setBlock(w, 3, 0, 3, STONE);
    setBlock(w, 4, 0, 3, STONE);
    // two touching blocks on the floor: 12 - 2 shared - 2 bottoms
    expect(buildChunkMesh(w, 0, 0).faces).toBe(8);
  });

  test('grass uses top / side / dirt slots; groups cover all indices', () => {
    const w = emptyWorld();
    setBlock(w, 3, 5, 3, GRASS);
    const m = buildChunkMesh(w, 0, 0);
    expect(m.groups.map((g) => [g.materialIndex, g.count / 6])).toEqual([
      [0, 1],
      [1, 4],
      [2, 1],
    ]);
    expect(m.groups.reduce((s, g) => s + g.count, 0)).toBe(m.indices.length);
  });

  test('chunk meshes stay small: only exposed faces', () => {
    const w = createWorld();
    const m = buildChunkMesh(w, 0, 0);
    expect(m.faces).toBeGreaterThan(100); // at least every top
    expect(m.faces).toBeLessThan(1500);
  });
});

describe('raycast', () => {
  const w = emptyWorld();
  setBlock(w, 0, 5, -5, STONE);

  test('hits the first block and reports the face normal', () => {
    const hit = raycast(w, [0.5, 5.5, 0.5], [0, 0, -1], 15);
    expect(hit?.block).toEqual([0, 5, -5]);
    expect(hit?.normal).toEqual([0, 0, 1]);
    expect(hit?.distance).toBeCloseTo(4.5, 6);
  });

  test('from above: top face; the place cell is block + normal', () => {
    const hit = raycast(w, [0.5, 10, -4.5], [0, -1, 0], 15)!;
    expect(hit.normal).toEqual([0, 1, 0]);
    expect(hit.block.map((v, i) => v + hit.normal[i])).toEqual([0, 6, -5]);
  });

  test('nothing within range is null', () => {
    expect(raycast(w, [0.5, 5.5, 0.5], [0, 0, -1], 4)).toBeNull();
    expect(raycast(w, [0.5, 5.5, 0.5], [0, 1, 0], 100)).toBeNull();
  });

  test('diagonal rays step through every cell they cross', () => {
    const v = emptyWorld();
    setBlock(v, 2, 0, 1, STONE);
    const hit = raycast(v, [0.5, 0.5, 0.5], [1, 0, 0.4], 10);
    expect(hit?.block).toEqual([2, 0, 1]);
  });
});

describe('player on blocks', () => {
  /** Flat floor at y = 0 … 4 (top 5) with a 1-block step at x ≥ 2. */
  function stepWorld() {
    const w = emptyWorld();
    for (let x = -6; x < 8; x++) {
      for (let z = -3; z < 3; z++) {
        for (let y = 0; y <= 4; y++) setBlock(w, x, y, z, STONE);
        if (x >= 2) setBlock(w, x, 5, z, STONE);
      }
    }
    return w;
  }

  function walk(w: ReturnType<typeof stepWorld>, seconds: number, jumpAt?: number) {
    const p = createPlayer();
    Object.assign(p.pos, { x: 0, y: 5, z: 0.5 });
    const jump = { jumpPressedAt: -Infinity };
    const dt = 1 / 120;
    const colliders: Aabb[] = [];
    for (let i = 0; i < seconds / dt; i++) {
      const now = i * dt;
      if (jumpAt !== undefined && Math.abs(now - jumpAt) < dt / 2) jump.jumpPressedAt = now;
      collidersNear(w, p.pos, PLAYER.height, 2, colliders);
      stepPlayer(p, { x: 1, z: 0 }, jump, now, dt, colliders);
    }
    return p;
  }

  test('a 1-block step is taller than stepHeight: walking stops at its face', () => {
    expect(1).toBeGreaterThan(PLAYER.stepHeight);
    const p = walk(stepWorld(), 1.5);
    expect(p.pos.y).toBe(5);
    expect(p.pos.x).toBeCloseTo(2 - PLAYER.radius, 2);
  });

  test('jumping climbs onto it', () => {
    const p = walk(stepWorld(), 0.9, 0.05);
    expect(p.pos.y).toBe(6);
    expect(p.pos.x).toBeGreaterThan(2);
    expect(p.pos.x).toBeLessThan(8); // still on the platform
  });

  test('the world edge is a wall', () => {
    const w = emptyWorld();
    for (let x = 30; x < 40; x++) for (let z = -2; z < 2; z++) setBlock(w, x, 0, z, STONE);
    const p = createPlayer();
    Object.assign(p.pos, { x: 38, y: 1, z: 0.5 });
    const colliders: Aabb[] = [];
    for (let i = 0; i < 240; i++) {
      collidersNear(w, p.pos, PLAYER.height, 2, colliders);
      stepPlayer(p, { x: 1, z: 0 }, { jumpPressedAt: i === 0 ? 0 : -Infinity }, i / 120, 1 / 120, colliders);
    }
    expect(p.pos.x).toBeCloseTo(40 - PLAYER.radius, 2);
    expect(p.pos.y).toBe(1);
  });

  test('placing into the player is detected', () => {
    const feet = { x: 0.5, y: 5, z: 0.5 };
    expect(blockHitsPlayer(0, 5, 0, feet, PLAYER.radius, PLAYER.height)).toBe(true);
    expect(blockHitsPlayer(0, 6, 0, feet, PLAYER.radius, PLAYER.height)).toBe(true);
    expect(blockHitsPlayer(0, 7, 0, feet, PLAYER.radius, PLAYER.height)).toBe(false);
    expect(blockHitsPlayer(1, 5, 0, feet, PLAYER.radius, PLAYER.height)).toBe(false);
  });
});
