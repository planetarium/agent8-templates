/**
 * Minecraft template behaviors:
 * - Terrain: deterministic 80×80 voxel map (simplex over seed 'minecraft123',
 *   the original generator's exact recipe) + chunked trimesh colliders
 *   (10×10 chunks, active within radius 3 of the player)
 * - Builder: crosshair raycast → translucent preview cube → F/left-click
 *   places the selected tile (original parity: removeCube is mapped but
 *   does nothing there either)
 * - FollowLight: the shadow sun tracks the player
 */
import { Behavior } from 'incanto';
import type {
  CharacterController3D,
  MeshInstance3D,
  Node3D,
  RigidBody3D,
  VoxelGrid3D,
} from 'incanto/3d';
import { StaticBody3D, VOXEL_PALETTE } from 'incanto/3d';

const LIGHT_OFFSET: [number, number, number] = [30, 100, 30];

export class FollowLight extends Behavior {
  override update(): void {
    const player = this.node.getRoot().getNodesByName('Player')[0] as Node3D | undefined;
    if (!player) return;
    (this.node as Node3D).position = [
      (player.position[0] ?? 0) + LIGHT_OFFSET[0],
      (player.position[1] ?? 0) + LIGHT_OFFSET[1],
      (player.position[2] ?? 0) + LIGHT_OFFSET[2],
    ];
  }
}

// ---- seeded simplex (the original cubeMapGenerator's recipe) ---------------

function lcgRandom(seedStr: string): () => number {
  let n = 0;
  for (let i = 0; i < seedStr.length; i++) n = (n * 31 + seedStr.charCodeAt(i)) >>> 0;
  return () => {
    n = (n * 9301 + 49297) % 233280;
    return n / 233280;
  };
}

/** 2D simplex noise (Gustavson) seeded by a shuffled permutation table. */
function makeSimplex2D(random: () => number): (x: number, y: number) => number {
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [p[i], p[j]] = [p[j] as number, p[i] as number];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255] as number;
  const grad = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  return (xin: number, yin: number): number => {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const [i1, j1] = x0 > y0 ? [1, 0] : [0, 1];
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    for (const [dx, dy, gi] of [
      [x0, y0, (perm[ii + (perm[jj] as number)] as number) % 8],
      [x1, y1, (perm[ii + i1 + (perm[jj + j1] as number)] as number) % 8],
      [x2, y2, (perm[ii + 1 + (perm[jj + 1] as number)] as number) % 8],
    ] as const) {
      let tt = 0.5 - dx * dx - dy * dy;
      if (tt < 0) continue;
      tt *= tt;
      const g = grad[gi] as number[];
      n += tt * tt * ((g[0] as number) * dx + (g[1] as number) * dy);
    }
    return 70 * n;
  };
}

const GRASS = 1;
const DIRT = 2;
const BEDROCK = 5;
const CHUNK = 10;
const ACTIVE_RADIUS = 3;

export class Terrain extends Behavior {
  private chunkBodies = new Map<string, StaticBody3D>();
  private lastChunk = '';
  private frame = 0;

  private voxels(): VoxelGrid3D {
    return this.node.getRoot().getNodesByName('Voxels')[0] as VoxelGrid3D;
  }

  override onReady(): void {
    const noise = makeSimplex2D(lcgRandom('minecraft123-cubemap'));
    const blocks = [];
    for (let x = 0; x < 80; x++) {
      for (let z = 0; z < 80; z++) {
        const height = Math.floor((noise(x * 0.03, z * 0.03) + 1) * 5) + 5;
        for (let y = 0; y <= height; y++) {
          const tile = y === 0 ? BEDROCK : y === height ? GRASS : DIRT;
          blocks.push({ x: x - 40, y, z: z - 40, tile });
        }
      }
    }
    // The scene JSON bakes structures into `voxels` (the beacon tower at the
    // spawn); they land when the prop does, so they are already in the grid
    // here. `setBlocks` REPLACES the map — put the baked blocks last so a
    // baked block wins over the terrain the noise would have put there.
    this.voxels().setBlocks([...blocks, ...this.voxels().blocks()]);
    // spawn on the highest column near the origin — always above the water
    let bestH = -1;
    let bestX = 0;
    let bestZ = 0;
    for (let x = 30; x < 50; x++) {
      for (let z = 30; z < 50; z++) {
        const h = Math.floor((noise(x * 0.03, z * 0.03) + 1) * 5) + 5;
        if (h > bestH) {
          bestH = h;
          bestX = x - 40;
          bestZ = z - 40;
        }
      }
    }
    const player = this.node.getRoot().getNodesByName('Player')[0] as Node3D | undefined;
    if (player) player.position = [bestX, bestH + 2.5, bestZ];
    this.voxels().on('blocksChanged', () => {
      this.lastChunk = ''; // force collider rebuild around the player
    });
  }

  override update(): void {
    if (++this.frame % 3 !== 0) return; // original throttle: every 3rd frame
    const player = this.node.getRoot().getNodesByName('Player')[0] as Node3D | undefined;
    if (!player) return;
    const cx = Math.floor((player.position[0] ?? 0) / CHUNK);
    const cz = Math.floor((player.position[2] ?? 0) / CHUNK);
    const key = `${cx},${cz}`;
    if (key === this.lastChunk) return;
    this.lastChunk = key;
    this.rebuildColliders(cx, cz);
  }

  private rebuildColliders(cx: number, cz: number): void {
    const wanted = new Set<string>();
    for (let dx = -ACTIVE_RADIUS; dx <= ACTIVE_RADIUS; dx++) {
      for (let dz = -ACTIVE_RADIUS; dz <= ACTIVE_RADIUS; dz++) {
        if (dx * dx + dz * dz <= ACTIVE_RADIUS * ACTIVE_RADIUS) wanted.add(`${cx + dx},${cz + dz}`);
      }
    }
    for (const [key, body] of this.chunkBodies) {
      if (!wanted.has(key)) {
        body.parent?.removeChild(body);
        this.chunkBodies.delete(key);
      }
    }
    const voxels = this.voxels();
    for (const key of wanted) {
      if (this.chunkBodies.has(key)) continue;
      const [kx, kz] = key.split(',').map(Number) as [number, number];
      const body = this.buildChunkBody(voxels, kx, kz);
      if (body) {
        this.node.addChild(body);
        this.chunkBodies.set(key, body);
      }
    }
  }

  /** Trimesh of EXPOSED faces only (hidden-face culling like the original). */
  private buildChunkBody(voxels: VoxelGrid3D, cx: number, cz: number): StaticBody3D | null {
    const vertices: number[] = [];
    const indices: number[] = [];
    const FACES: [number, number, number, number[][]][] = [
      [
        0,
        1,
        0,
        [
          [-0.5, 0.5, -0.5],
          [0.5, 0.5, -0.5],
          [0.5, 0.5, 0.5],
          [-0.5, 0.5, 0.5],
        ],
      ],
      [
        0,
        -1,
        0,
        [
          [-0.5, -0.5, 0.5],
          [0.5, -0.5, 0.5],
          [0.5, -0.5, -0.5],
          [-0.5, -0.5, -0.5],
        ],
      ],
      [
        1,
        0,
        0,
        [
          [0.5, -0.5, -0.5],
          [0.5, 0.5, -0.5],
          [0.5, 0.5, 0.5],
          [0.5, -0.5, 0.5],
        ],
      ],
      [
        -1,
        0,
        0,
        [
          [-0.5, -0.5, 0.5],
          [-0.5, 0.5, 0.5],
          [-0.5, 0.5, -0.5],
          [-0.5, -0.5, -0.5],
        ],
      ],
      [
        0,
        0,
        1,
        [
          [-0.5, -0.5, 0.5],
          [0.5, -0.5, 0.5],
          [0.5, 0.5, 0.5],
          [-0.5, 0.5, 0.5],
        ],
      ],
      [
        0,
        0,
        -1,
        [
          [0.5, -0.5, -0.5],
          [-0.5, -0.5, -0.5],
          [-0.5, 0.5, -0.5],
          [0.5, 0.5, -0.5],
        ],
      ],
    ];
    for (let x = cx * CHUNK; x < (cx + 1) * CHUNK; x++) {
      for (let z = cz * CHUNK; z < (cz + 1) * CHUNK; z++) {
        for (let y = 0; y < 40; y++) {
          if (voxels.tileAt(x, y, z) === undefined) continue;
          for (const [nx, ny, nz, quad] of FACES) {
            if (voxels.tileAt(x + nx, y + ny, z + nz) !== undefined) continue; // hidden
            const base = vertices.length / 3;
            for (const [qx, qy, qz] of quad as number[][]) {
              vertices.push(x + (qx as number), y + (qy as number), z + (qz as number));
            }
            indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
          }
        }
      }
    }
    if (indices.length === 0) return null;
    const body = new StaticBody3D(`Chunk${cx},${cz}`);
    body.collider = { shape: 'trimesh', vertices, indices };
    return body;
  }
}

const PLACE_RANGE = 15;

export class Builder extends Behavior {
  /** Tile the next cube uses; the tile bar UI writes this. */
  selectedTile = GRASS;

  override update(): void {
    const body = this.node as RigidBody3D;
    const controller = this.node.getNodeOrNull('Controller') as CharacterController3D | null;
    const physics = body._physics3d;
    const voxels = this.node.getRoot().getNodesByName('Voxels')[0] as VoxelGrid3D | undefined;
    const preview = this.node.getRoot().getNodesByName('Preview')[0] as MeshInstance3D | undefined;
    if (!controller || !physics || !voxels || !preview) return;

    const { yaw, pitch } = controller;
    const cp = Math.cos(pitch);
    const dir: [number, number, number] = [
      -Math.sin(yaw) * cp,
      -Math.sin(pitch),
      -Math.cos(yaw) * cp,
    ];
    const eye: [number, number, number] = [
      body.position[0] ?? 0,
      (body.position[1] ?? 0) + controller.eyeHeight,
      body.position[2] ?? 0,
    ];
    const hit = physics.castRay(eye, dir, PLACE_RANGE, body);
    if (!hit) {
      preview.visible = false;
      return;
    }
    const point: [number, number, number] = [
      eye[0] + dir[0] * hit.distance,
      eye[1] + dir[1] * hit.distance,
      eye[2] + dir[2] * hit.distance,
    ];
    const cube = [
      Math.round(point[0] - hit.normal[0] * 0.5),
      Math.round(point[1] - hit.normal[1] * 0.5),
      Math.round(point[2] - hit.normal[2] * 0.5),
    ];
    const place: [number, number, number] = [
      cube[0] + Math.round(hit.normal[0]),
      cube[1] + Math.round(hit.normal[1]),
      cube[2] + Math.round(hit.normal[2]),
    ];
    preview.visible = true;
    preview.position = place;
    const top = VOXEL_PALETTE[this.selectedTile]?.[4] ?? [1, 1, 1];
    preview.material = {
      color: `rgb(${Math.round((top[0] as number) * 255)}, ${Math.round((top[1] as number) * 255)}, ${Math.round((top[2] as number) * 255)})`,
      roughness: 1,
    };

    if (this.engine.input.justPressed('addCube')) {
      voxels.addBlock({ x: place[0], y: place[1], z: place[2], tile: this.selectedTile });
    }
  }
}
