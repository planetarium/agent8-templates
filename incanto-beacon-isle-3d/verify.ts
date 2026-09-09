/**
 * Beacon Isle plays headlessly: audit → full quest E2E (talk → accept → clear
 * shades → relight 3 wards → report → win) → shades hunt on the terrain nav →
 * death respawns with quest progress kept → record/replay bit-identical.
 * Run with `bun verify.ts`.
 */
import type { UiDialogue, UiText } from 'incanto';
import { Engine, loadScene, registerBehavior, replay, startRecording } from 'incanto';
import { enablePhysics3D } from 'incanto/3d';
import { auditScene, registerAllNodes, runScript } from 'incanto/test';
import { BEHAVIORS, quest, resetQuest } from './src/behaviors';
import gameJson from './src/game.scene.json';

interface Vec {
  position: number[];
}

const ok = (label: string, cond: boolean): void => {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`pass: ${label}`);
  }
};

// ---- AUDIT -------------------------------------------------------------------------
{
  registerAllNodes();
  for (const [name, ctor] of Object.entries(BEHAVIORS)) {
    registerBehavior(name, ctor, { replace: true });
  }
  const warnings = auditScene(gameJson as unknown as Parameters<typeof auditScene>[0]);
  ok(`auditScene is clean (${warnings.length} warnings)`, warnings.length === 0);
  for (const w of warnings) console.error(`  warn: ${w}`);
}

// ---- QUEST E2E ---------------------------------------------------------------------
{
  resetQuest();
  const keeper = { x: 0, z: 0 };

  const result = await runScript(gameJson, {
    durationMs: 90000,
    seed: 11,
    behaviors: BEHAVIORS,
    steps: [
      {
        atMs: 200,
        label: 'talk to the keeper, accept the quest',
        do: (ctx) => {
          const k = ctx.getNode('/root/Keeper') as unknown as Vec;
          keeper.x = k.position[0] ?? 0;
          keeper.z = k.position[2] ?? 0;
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          player.position = [keeper.x + 1.5, (k.position[1] ?? 0) + 1.2, keeper.z + 1.5];
          for (let i = 0; i < 5; i++) ctx.engine.step();
          ctx.engine.input.pressAction('interact');
          ctx.engine.step();
          ctx.engine.input.releaseAction('interact');
          const talk = ctx.getNode('/root/HUD/Dialogue') as UiDialogue;
          if (!talk.active) throw new Error('dialogue did not open');
          for (let i = 0; i < 200; i++) ctx.engine.step();
          talk.advance();
          for (let i = 0; i < 260; i++) ctx.engine.step();
          talk.choose(0);
          ctx.engine.step();
          if (!quest.accepted) throw new Error('quest not accepted');
          // the E2E teleports through shade packs — don't die mid-script
          (ctx.getNode('/root/Player').behavior as unknown as { current: number }).current = 99999;
        },
      },
      {
        atMs: 5000,
        label: 'shades hunt the player across the terrain nav',
        do: (ctx) => {
          const shade = ctx.getNode('/root/Shade1_1') as unknown as Vec;
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          // stand 6m from the shade (inside aggro)
          player.position = [
            (shade.position[0] ?? 0) + 6,
            (shade.position[1] ?? 0) + 0.4,
            shade.position[2] ?? 0,
          ];
          const gap = () =>
            Math.hypot(
              (shade.position[0] ?? 0) - (player.position[0] ?? 0),
              (shade.position[2] ?? 0) - (player.position[2] ?? 0),
            );
          let reached = false;
          for (let i = 0; i < 700 && !reached; i++) {
            player.position = [
              player.position[0] ?? 0,
              player.position[1] ?? 0,
              player.position[2] ?? 0,
            ];
            ctx.engine.step();
            reached = gap() < 1.6;
          }
          if (!reached) throw new Error(`shade never closed in (gap ${gap().toFixed(1)})`);
        },
      },
      {
        atMs: 12000,
        label: 'clear the guards and relight all three wards',
        do: (ctx) => {
          const engine = ctx.engine;
          const live = () => {
            const root = engine.scene?.tree.root;
            if (!root) throw new Error('no scene');
            return root;
          };
          for (let w = 1; w <= 3; w++) {
            const ward = live().getNode(`Ward${w}`) as unknown as Vec;
            // kill this ward's guards (one strike each)
            for (let round = 0; round < 4; round++) {
              const guards = engine.scene?.tree.getNodesInGroup(`shade-ward${w}`) ?? [];
              const target = guards[0] as unknown as Vec | undefined;
              if (!target) break;
              const player = live().getNode('Player') as unknown as Vec;
              player.position = [
                (target.position[0] ?? 0) + 0.9,
                (target.position[1] ?? 0) + 0.3,
                (target.position[2] ?? 0) + 0.9,
              ];
              engine.step();
              engine.input.pressAction('attack');
              engine.step();
              engine.input.releaseAction('attack');
              for (let i = 0; i < 42; i++) engine.step();
            }
            const left = engine.scene?.tree.getNodesInGroup(`shade-ward${w}`).length ?? -1;
            if (left !== 0) throw new Error(`ward ${w}: ${left} shades survived`);
            // stand at the ward and relight
            const player = live().getNode('Player') as unknown as Vec;
            player.position = [
              (ward.position[0] ?? 0) + 1,
              (ward.position[1] ?? 0) + 1,
              ward.position[2] ?? 0,
            ];
            for (let i = 0; i < 4; i++) engine.step();
            engine.input.pressAction('interact');
            engine.step();
            engine.input.releaseAction('interact');
            for (let i = 0; i < 5; i++) engine.step();
            if (!quest.lit.has(w)) throw new Error(`ward ${w} did not light`);
          }
          if (quest.lit.size !== 3) throw new Error('not all wards lit');
          if (!quest.bossRisen) throw new Error('the Shadeheart never rose');
        },
      },
      {
        atMs: 25000,
        label: 'five strikes fell the Shadeheart',
        do: (ctx) => {
          const engine = ctx.engine;
          const root = engine.scene?.tree.root;
          if (!root) throw new Error('no scene');
          for (let i = 0; i < 60; i++) engine.step(); // boss wakes + starts hunting
          const player = root.getNode('Player') as unknown as Vec;
          for (let round = 0; round < 7 && !quest.bossDown; round++) {
            const boss = engine.scene?.tree.getNodesInGroup('boss')[0] as unknown as
              | Vec
              | undefined;
            if (!boss) break;
            player.position = [
              (boss.position[0] ?? 0) + 1.2,
              (boss.position[1] ?? 0) + 0.3,
              (boss.position[2] ?? 0) + 1.2,
            ];
            engine.step();
            engine.input.pressAction('attack');
            engine.step();
            engine.input.releaseAction('attack');
            for (let i = 0; i < 42; i++) engine.step();
          }
          if (!quest.bossDown) throw new Error('the Shadeheart survived 7 rounds');
          if ((engine.scene?.tree.getNodesInGroup('boss').length ?? -1) !== 0)
            throw new Error('boss node not freed');
        },
      },
      {
        atMs: 30000,
        label: 'report back — quest complete + win banner',
        do: (ctx) => {
          const engine = ctx.engine;
          const root = engine.scene?.tree.root;
          if (!root) throw new Error('no scene');
          const player = root.getNode('Player') as unknown as Vec;
          const k = root.getNode('Keeper') as unknown as Vec;
          player.position = [
            (k.position[0] ?? 0) + 1.5,
            (k.position[1] ?? 0) + 1.2,
            (k.position[2] ?? 0) + 1.5,
          ];
          for (let i = 0; i < 5; i++) engine.step();
          engine.input.pressAction('interact');
          engine.step();
          engine.input.releaseAction('interact');
          const talk = root.getNode('HUD/Dialogue') as UiDialogue;
          for (let i = 0; i < 400; i++) engine.step();
          talk.advance();
          for (let i = 0; i < 500; i++) engine.step();
          talk.advance();
          for (let i = 0; i < 80; i++) engine.step(); // dialogueFinished + fireworks timer
          if (!quest.done) throw new Error('quest never completed');
          const line = (root.getNode('HUD/Quest') as UiText).text;
          if (!line.includes('safe')) throw new Error(`quest line: ${line}`);
        },
      },
    ],
  });
  ok('QUEST: full loop (keeper → hunt → 3 wards → win)', result.ok);
  for (const f of result.failures) console.error(`  ${f.label}: ${f.message}`);
}

// ---- DEATH keeps progress ------------------------------------------------------------
{
  resetQuest();
  quest.accepted = true;
  quest.lit.add(1); // pretend ward 1 was lit before dying
  const result = await runScript(gameJson, {
    durationMs: 60000,
    seed: 5,
    behaviors: BEHAVIORS,
    steps: [
      {
        atMs: 300,
        label: 'death → respawn keeps lit wards',
        do: (ctx) => {
          const engine = ctx.engine;
          const health = () =>
            engine.scene?.tree.root?.getNode('Player')?.behavior as unknown as { current: number };
          for (let i = 0; i < 4000 && (health()?.current ?? 0) > 0; i++) {
            const shades = engine.scene?.tree.getNodesInGroup('shade') ?? [];
            const s = shades[0] as unknown as Vec | undefined;
            if (!s) throw new Error('no shades');
            const p = engine.scene?.tree.root?.getNode('Player') as unknown as Vec;
            p.position = [s.position[0] ?? 0, (s.position[1] ?? 0) + 0.1, s.position[2] ?? 0];
            engine.step();
          }
          if ((health()?.current ?? 1) > 0) throw new Error('shades never killed the player');
          for (let i = 0; i < 130; i++) engine.step(); // respawn countdown
          if ((health()?.current ?? 0) < 100) throw new Error('respawn did not reset HP');
          if (!quest.lit.has(1)) throw new Error('respawn lost the lit ward');
          const shadeCount = engine.scene?.tree.getNodesInGroup('shade').length ?? 0;
          if (shadeCount !== 6) throw new Error(`respawn spawned ${shadeCount} shades`);
        },
      },
    ],
  });
  ok('DEATH: respawn keeps quest progress', result.ok);
  for (const f of result.failures) console.error(`  ${f.label}: ${f.message}`);
}

// ---- REPLAY determinism --------------------------------------------------------------
{
  resetQuest();
  const boot = async (): Promise<Engine> => {
    const engine = new Engine({ seed: 42, scheduler: () => () => {} });
    engine.setScene(
      loadScene(structuredClone(gameJson) as Parameters<typeof loadScene>[0], { engine }),
    );
    await enablePhysics3D(engine);
    return engine;
  };
  const a = await boot();
  const rec = startRecording(a);
  for (let frame = 0; frame <= 240; frame++) {
    if (frame === 20) a.input.handleKey('KeyW', true);
    if (frame === 140) a.input.handleKey('KeyA', true);
    if (frame === 200) a.input.handleKey('KeyW', false);
    a.tick(frame * (1000 / 60));
  }
  const recording = rec.stop();
  const posA = (a.scene?.tree.root?.getNode('Player') as unknown as Vec).position;
  resetQuest();
  const b = await boot();
  replay(b, recording);
  const posB = (b.scene?.tree.root?.getNode('Player') as unknown as Vec).position;
  ok(
    `REPLAY: bit-identical after 240 replayed frames (${posA.map((v) => v.toFixed(3)).join(', ')})`,
    posA.length === 3 && posA.every((v, i) => v === posB[i]),
  );
}

console.log(process.exitCode ? '\nVERIFY FAILED' : '\nVERIFY OK');

// ---- HEIGHTFIELD: this round's surfaces, on terrain instead of a flat arena -----
// A trampoline pad snapped to the island (`snapToGround: 0.1` on a StaticBody3D
// with `restitution 1`), a dead ball dropped on it, and a `CharacterBody3D`
// walker chasing the player up the island's slope (`Chase.ground` auto: the
// KCC's slopeLimitDeg and stepHeight decide, gravity keeps it on the ground).
{
  type Vec = { position: number[] };
  type Terrain = { heightAt(x: number, z: number): number };
  const ballY: number[] = [];
  let walkerFrom: number[] = [];
  let walkerTo: number[] = [];
  let groundUnderWalker = 0;
  let targetY = 0;
  let closed = 0;
  const result = await runScript(gameJson, {
    behaviors: BEHAVIORS,
    durationMs: 8000,
    steps: [
      {
        atMs: 100,
        do: (ctx) => {
          const pad = ctx.getNode('/root/Pad') as unknown as Vec;
          const ball = ctx.getNode('/root/Ball') as unknown as Vec;
          ball.position = [pad.position[0] ?? 0, (pad.position[1] ?? 0) + 3, pad.position[2] ?? 0];
        },
      },
      ...Array.from({ length: 30 }, (_, i) => ({
        atMs: 200 + i * 100,
        do: (ctx: { getNode(p: string): unknown }) => {
          ballY.push((ctx.getNode('/root/Ball') as Vec).position[1] ?? 0);
        },
      })),
      {
        atMs: 3300,
        do: (ctx) => {
          const terrain = ctx.getNode('/root/Terrain/Ground/Surface') as unknown as Terrain;
          const walker = ctx.getNode('/root/Walker') as unknown as Vec;
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          const [wx = 0, , wz = 0] = walker.position;
          // the steepest way UP from the walker, 10 m out: that is where the player goes
          let best = { x: wx + 10, z: wz, h: -Infinity };
          for (let a = 0; a < 16; a++) {
            const x = wx + 10 * Math.cos((a / 16) * Math.PI * 2);
            const z = wz + 10 * Math.sin((a / 16) * Math.PI * 2);
            const h = terrain.heightAt(x, z);
            if (h > best.h) best = { x, z, h };
          }
          player.position = [best.x, best.h + 1.4, best.z];
          targetY = best.h;
          walkerFrom = [...walker.position];
          const d0 = Math.hypot(best.x - wx, best.z - wz);
          for (let i = 0; i < 240; i++) ctx.engine.step();
          walkerTo = [...walker.position];
          const [tx = 0, , tz = 0] = walkerTo;
          groundUnderWalker = terrain.heightAt(tx, tz);
          closed = d0 - Math.hypot(best.x - tx, best.z - tz);
          player.position = [-4.5, 18.73, 70.5]; // and back to the spawn for the quest
        },
      },
    ],
  });
  ok('runScript reported no failures (HEIGHTFIELD path)', result.ok);
  let touch = ballY.findIndex((y, i) => i > 0 && y > (ballY[i - 1] ?? 0));
  if (touch < 1) touch = 1;
  const low = ballY[touch - 1] ?? 0;
  const rebound = Math.max(...ballY.slice(touch)) - low;
  ok(
    `a pad snapped to the island with restitution 1 launches a dead ball back up ${rebound.toFixed(2)} m of its 3 m drop`,
    rebound > 1.8,
  );
  const rose = (walkerTo[1] ?? 0) - (walkerFrom[1] ?? 0);
  const gap = targetY - (walkerFrom[1] ?? 0);
  ok(
    `the walker chased the player UP the slope: closed ${closed.toFixed(1)} m of 10, rose ${rose.toFixed(2)} m of a ${gap.toFixed(2)} m climb`,
    closed > 5 && rose > gap * 0.5,
  );
  const hover = (walkerTo[1] ?? 0) - groundUnderWalker;
  ok(
    `…and stayed on the ground while doing it (capsule centre ${hover.toFixed(2)} m over the terrain, 0.95 expected)`,
    hover > 0.5 && hover < 1.6,
  );
}

// ---- FLOATS: what `Buoyancy.water`, `samples` and `drag` do on the open sea --------
// Set by no example: every raft in the repo took the first Water3D, four samples
// and the default drag. Two crates float west of the island (the heightfield
// ends at x −120): the Buoy names its water, samples once and says `drag: 0.1`;
// the Crate keeps the defaults. Both `drift: 0`, so a 3 m/s shove is the only
// thing moving them and drag is the only thing that differs. Asserted by how
// far each travels in 2 s — e^{-drag·t} says 5.4 m against 2.8 m — and by both
// still sitting at the waterline afterwards.
{
  type Vec = { position: number[] };
  type Body = { mass: number; applyImpulse(i: [number, number, number]): void };
  type Water = { heightAt(x: number, z: number): number };
  let buoyRest = 0;
  let crateRest = 0;
  let buoyRun = 0;
  let crateRun = 0;
  let buoyOver = 99;
  let crateOver = 99;
  const result = await runScript(gameJson, {
    behaviors: BEHAVIORS,
    durationMs: 8000,
    steps: [
      {
        atMs: 100,
        do: (ctx) => {
          const sea = ctx.getNode('/root/Terrain/Sea') as unknown as Water;
          const buoy = ctx.getNode('/root/Buoy') as unknown as Vec & Body;
          const crate = ctx.getNode('/root/Crate') as unknown as Vec & Body;
          for (let i = 0; i < 240; i++) ctx.engine.step(); // 4 s to settle on the waterline
          buoyRest = buoy.position[1] ?? 0;
          crateRest = crate.position[1] ?? 0;
          const bx = buoy.position[0] ?? 0;
          const cx = crate.position[0] ?? 0;
          buoy.applyImpulse([3 * buoy.mass, 0, 0]);
          crate.applyImpulse([3 * crate.mass, 0, 0]);
          for (let i = 0; i < 120; i++) ctx.engine.step();
          buoyRun = (buoy.position[0] ?? 0) - bx;
          crateRun = (crate.position[0] ?? 0) - cx;
          buoyOver =
            (buoy.position[1] ?? 0) - sea.heightAt(buoy.position[0] ?? 0, buoy.position[2] ?? 0);
          crateOver =
            (crate.position[1] ?? 0) - sea.heightAt(crate.position[0] ?? 0, crate.position[2] ?? 0);
        },
      },
    ],
  });
  ok('runScript reported no failures (FLOATS path)', result.ok);
  ok(
    `water "/root/Terrain/Sea", samples 1: the Buoy settles at y ${buoyRest.toFixed(2)} (sea 9.19 + draft 0.35 ≈ 9.54), the Crate at ${crateRest.toFixed(2)}`,
    Math.abs(buoyRest - 9.54) < 0.5 && Math.abs(crateRest - 9.54) < 0.5,
  );
  ok(
    `drag 0.1 vs 0.9: the same 3 m/s shove carries the Buoy ${buoyRun.toFixed(2)} m and the Crate ${crateRun.toFixed(2)} m in 2 s (5.4 vs 2.8 expected)`,
    buoyRun > crateRun * 1.5 && buoyRun > 4 && crateRun > 1.5 && crateRun < 3.5,
  );
  ok(
    `…and both still ride the waterline (${buoyOver.toFixed(2)} m and ${crateOver.toFixed(2)} m over the sea)`,
    Math.abs(buoyOver - 0.35) < 0.5 && Math.abs(crateOver - 0.35) < 0.5,
  );
}
