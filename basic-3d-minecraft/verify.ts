/**
 * Headless proof that a structure BAKED into scene JSON (`VoxelGrid3D.voxels`)
 * is in the world the game builds: present in the grid before the terrain
 * generator runs, kept when the generator sets its blocks, and SOLID — the
 * chunk colliders the Builder makes from `blocks()` include it.
 *
 * `voxels` was set by no example: this template generated everything in
 * TypeScript, and the JSON path had never been asked whether it arrives in
 * time (it did not — it seeded on the first update, a frame after every
 * onReady) or whether it survives a generator (it did not — the late seed
 * replaced the generated world).
 *
 * Run with `bun verify.ts` (or `bun run verify`).
 */
import { registerAllNodes, runScript } from 'incanto/test';
import { Builder, FollowLight, Terrain } from './src/behaviors';
import sceneJson from './src/game.scene.json';

const ok = (label: string, cond: boolean): void => {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`  ok  ${label}`);
  }
};

registerAllNodes();

type Grid = { tileAt(x: number, y: number, z: number): number | undefined; blocks(): unknown[] };
let top: number | undefined;
let inside: number | undefined;
let total = 0;
let hitY: number | null = null;

const run = await runScript(sceneJson as never, {
  behaviors: { FollowLight, Terrain, Builder },
  durationMs: 1200,
  steps: [
    {
      atMs: 600,
      label: 'the baked tower is in the grid and solid',
      do: (ctx) => {
        const grid = ctx.getNode('/root/Voxels') as unknown as Grid;
        top = grid.tileAt(0, 18, -8);
        inside = grid.tileAt(0, 8, -8); // where the noise terrain also had a block
        total = grid.blocks().length;
        const hit = ctx.engine.physics?.castRay([0, 60, -8], [0, -1, 0], 100, undefined, {
          staticOnly: true,
        });
        hitY = hit ? (hit.point[1] ?? 0) : null;
      },
    },
  ],
});

ok('runScript reported no failures', run.ok);
ok(`the tower's top block (grass, tile 1) is in the grid at y 18 — got ${top}`, top === 1);
ok(
  `a baked block beats the terrain at the same column (dirt, tile 2) — got ${inside}`,
  inside === 2,
);
ok(
  `the generated world survived the seed (${total} blocks, terrain alone is ~60k)`,
  total > 40_000,
);
ok(
  `a ray from above lands on the tower (y ${hitY?.toFixed(2) ?? 'nothing'}), well above the terrain's 15`,
  hitY !== null && hitY > 17,
);
console.log(process.exitCode ? '\nVERIFY FAILED' : '\nVERIFY OK — a baked structure is real');
