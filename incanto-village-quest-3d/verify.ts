/**
 * Headless proof that Emberwood actually PLAYS — author → VERIFY → fix,
 * no browser. Three passes:
 *
 *   AUDIT : auditScene finds nothing to warn about in either scene.
 *   QUEST : the full loop — talk to the Elder (UiDialogue), accept via
 *           choose(0), walk the north gate (goToScene → grove), wolves are
 *           walking their A* patrol rings, three sword strikes clear them,
 *           the portal returns home, reporting back completes the quest.
 *   REPLAY: the same recorded inputs replayed into a fresh engine land the
 *           player on the BIT-IDENTICAL position — the determinism contract
 *           (seeded rng + fixed clock) that makes recordings regressions.
 *
 * Run with `bun verify.ts` (or `bun run verify`).
 */
import type { UiBanner, UiDialogue, UiText } from 'incanto';
import { Engine, loadScene, registerBehavior, replay, startRecording } from 'incanto';
import { enablePhysics3D } from 'incanto/3d';
import { auditScene, registerAllNodes, runScript } from 'incanto/test';
import { BEHAVIORS, cellToWorld } from './src/behaviors';
import groveJson from './src/grove.scene.json';
import { quest, resetQuest } from './src/quest';
import villageJson from './src/village.scene.json';

interface Vec {
  position: number[];
}

/**
 * WALK there — do not teleport.
 *
 * This file used to set `player.position` at every quest beat, which proved the
 * quest LOGIC and quietly assumed the thing most likely to be broken: that the
 * player can actually get there. `incanto-playtest` exists because that
 * assumption is the largest bug class in level design, and a verify script that
 * makes it is demonstrating the wrong habit in the repo's own showcase.
 *
 * `move` is camera-relative in the `free` rig, so the heading is CALIBRATED
 * rather than assumed: push one direction, measure the world displacement it
 * produced, and rotate every later aim by the difference. That works whatever
 * the camera is doing and needs no knowledge of the rig.
 */
function walkTo(
  ctx: { engine: Engine; getNode(path: string): unknown },
  target: readonly [number, number],
  opts: { within?: number; timeoutMs?: number; label?: string } = {},
): void {
  const within = opts.within ?? 1.2;
  const budget = Math.round((opts.timeoutMs ?? 20000) / (1000 / 60));
  const player = ctx.getNode('/root/Player') as unknown as Vec;
  const at = (): [number, number] => [player.position[0] ?? 0, player.position[2] ?? 0];
  const dist = (): number => Math.hypot(target[0] - at()[0], target[1] - at()[1]);

  // calibrate: push +x in INPUT space and see where the world went
  const before = at();
  ctx.engine.input.setActionVector('move', 1, 0);
  for (let i = 0; i < 20; i++) ctx.engine.step();
  const after = at();
  ctx.engine.input.setActionVector('move', 0, 0);
  const moved = Math.hypot(after[0] - before[0], after[1] - before[1]);
  if (moved < 0.05) throw new Error(`walkTo(${opts.label ?? ''}): the player cannot move at all`);
  const inputToWorld = Math.atan2(after[1] - before[1], after[0] - before[0]);

  for (let f = 0; f < budget && dist() > within; f++) {
    /*
     * A frozen clock is an ANSWER, not a slow walk.
     *
     * `GameFlow` sets `timeScale = 0` the moment the run is won or lost, and
     * `engine.step()` then advances nothing. Without this the loop burns its
     * whole budget on no-ops and the harness reports "the player cannot reach
     * it on foot" about a player who has already WON — measured, 1100 of 1200
     * steps were no-ops and the run ended `flow=won` one metre short.
     */
    if (ctx.engine.timeScale === 0) break;
    const here = at();
    const want = Math.atan2(target[1] - here[1], target[0] - here[0]);
    const aim = want - inputToWorld;
    ctx.engine.input.setActionVector('move', Math.cos(aim), Math.sin(aim));
    ctx.engine.step();
  }
  ctx.engine.input.setActionVector('move', 0, 0);
  if (ctx.engine.timeScale === 0) return; // the run ended while we were walking
  for (let i = 0; i < 10; i++) ctx.engine.step();
  if (dist() > within) {
    throw new Error(
      `walkTo(${opts.label ?? `${target[0]},${target[1]}`}): still ${dist().toFixed(1)} away ` +
        `after ${opts.timeoutMs ?? 20000}ms — the player cannot reach it on foot`,
    );
  }
}

const ok = (label: string, cond: boolean): void => {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`pass: ${label}`);
  }
};

// ---- AUDIT ------------------------------------------------------------------------
{
  registerAllNodes();
  for (const [name, ctor] of Object.entries(BEHAVIORS)) {
    registerBehavior(name, ctor, { replace: true });
  }
  const w1 = auditScene(villageJson as unknown as Parameters<typeof auditScene>[0]);
  const w2 = auditScene(groveJson as unknown as Parameters<typeof auditScene>[0]);
  ok(`auditScene(village) is clean (${w1.length} warnings)`, w1.length === 0);
  ok(`auditScene(grove) is clean (${w2.length} warnings)`, w2.length === 0);
  for (const w of [...w1, ...w2]) console.error(`  warn: ${w}`);
}

// ---- QUEST — the whole loop through both scenes ------------------------------------
{
  resetQuest();
  let sceneName = (): string => 'unset';
  let wolvesWalked = false;

  let wolfKnock = 0; // metres the first strike shoved the wolf along the blow (Health.knockback)
  let wolfHeld = -1; // metres it walked in the 8 frames AFTER that — its PathFollow is held
  const result = await runScript(villageJson, {
    durationMs: 60000,
    seed: 7,
    behaviors: BEHAVIORS,
    steps: [
      {
        atMs: 100,
        label: 'talk to the Elder and accept the quest',
        do: (ctx) => {
          sceneName = () => ctx.engine.scene?.source?.name as string;
          // the Elder is at [3, 0, -2] with Interactable range 2.8
          walkTo(ctx, [3, -2], { within: 2, label: 'the Elder' });
          ctx.engine.input.pressAction('interact');
          ctx.engine.step();
          ctx.engine.input.releaseAction('interact');
          const talk = ctx.getNode('/root/HUD/Dialogue') as UiDialogue;
          if (!talk.active) throw new Error('dialogue did not open');
          // let line 1 type out, advance, let the choice line type out
          for (let i = 0; i < 150; i++) ctx.engine.step();
          talk.advance();
          for (let i = 0; i < 150; i++) ctx.engine.step();
          talk.choose(0); // "I will go"
          ctx.engine.step();
          if (!quest.accepted) throw new Error('choice did not accept the quest');
        },
      },
      {
        atMs: 6000,
        label: 'north gate swaps to the grove (goToScene)',
        do: (ctx) => {
          walkTo(ctx, [0, -26.4], { label: 'the north gate', timeoutMs: 30000 });
          for (let i = 0; i < 30 && sceneName() !== 'WolfGrove'; i++) ctx.engine.step();
          if (sceneName() !== 'WolfGrove') throw new Error(`still in ${sceneName()}`);
        },
      },
      {
        atMs: 8000,
        label: 'wolves walk their A* patrol rings',
        do: (ctx) => {
          const root = ctx.engine.scene?.tree.root;
          if (!root) throw new Error('no scene');
          const wolf = root.getNode('Wolves/Wolf1') as unknown as Vec;
          const before = [...wolf.position];
          for (let i = 0; i < 90; i++) ctx.engine.step();
          const dx = (wolf.position[0] ?? 0) - (before[0] ?? 0);
          const dz = (wolf.position[2] ?? 0) - (before[2] ?? 0);
          wolvesWalked = Math.hypot(dx, dz) > 0.5;
          if (!wolvesWalked) throw new Error('Wolf1 never moved');
        },
      },
      {
        atMs: 9000,
        label: 'wolves HUNT: player inside aggro range pulls a wolf off patrol',
        do: (ctx) => {
          const engine = ctx.engine;
          const root = engine.scene?.tree.root;
          if (!root) throw new Error('no scene');
          const wolf = root.getNode('Wolves/Wolf2') as unknown as Vec;
          const player = root.getNode('Player') as unknown as Vec;
          // stand on an OPEN cell on Wolf2's patrol row and wait for it to
          // come into aggro range — it should re-path and close to bite range
          const [ox, , oz] = cellToWorld(9, 1, 0);
          const gap = () =>
            Math.hypot((wolf.position[0] ?? 0) - (ox ?? 0), (wolf.position[2] ?? 0) - (oz ?? 0));
          let reached = false;
          for (let i = 0; i < 900 && !reached; i++) {
            player.position = [ox ?? 0, 1.4, oz ?? 0];
            engine.step();
            reached = gap() < 1.2;
          }
          if (!reached) throw new Error(`wolf never closed in (gap ${gap().toFixed(2)})`);
        },
      },
      {
        atMs: 11000,
        label: 'a bite drains HP; 0 HP → YOU FELL → fresh grove respawn',
        do: (ctx) => {
          const engine = ctx.engine;
          const root = () => engine.scene?.tree.root;
          const health = () =>
            root()?.getNode('Player')?.behavior as unknown as { current: number };
          const wolves = () => engine.scene?.tree.getNodesInGroup('wolf') ?? [];
          // stand ON a wolf until dead (invulnerability windows between bites)
          for (let i = 0; i < 3000 && (health()?.current ?? 0) > 0; i++) {
            const w = wolves()[0] as unknown as Vec | undefined;
            if (!w) throw new Error('no wolves left to bite');
            const p = root()?.getNode('Player') as unknown as Vec;
            p.position = [w.position[0] ?? 0, 1.4, w.position[2] ?? 0];
            engine.step();
          }
          if ((health()?.current ?? 1) > 0) throw new Error('wolves never killed the player');
          // respawn countdown (1.6s) → fresh grove with full wolves + full HP
          for (let i = 0; i < 130; i++) engine.step();
          if (wolves().length !== 3) throw new Error(`respawn left ${wolves().length} wolves`);
          if ((health()?.current ?? 0) < 100) throw new Error('respawn did not reset HP');
        },
      },
      {
        atMs: 14000,
        label: 'three strikes clear the grove',
        do: (ctx) => {
          const engine = ctx.engine;
          const root = engine.scene?.tree.root;
          if (!root) throw new Error('no scene');
          const player = root.getNode('Player') as unknown as Vec;
          // wolves take TWO strikes now (first = flinch: `Health.knockback` shoves
          // it along the blow and `staggerSeconds` holds its PathFollow)
          for (let round = 0; round < 6; round++) {
            const wolves = engine.scene?.tree.getNodesInGroup('wolf') ?? [];
            const target = wolves[0] as unknown as Vec | undefined;
            if (!target) break;
            player.position = [
              (target.position[0] ?? 0) + 0.8,
              1.4,
              (target.position[2] ?? 0) + 0.8,
            ];
            engine.step();
            let hitAt = -1;
            let hitPos: number[] = [];
            let cur = 0;
            if (round === 0) {
              const vitals = (
                target as unknown as { getNode(p: string): { behavior: unknown } }
              ).getNode('Vitals').behavior as {
                on(s: string, f: () => void): void;
              };
              vitals.on('damaged', () => {
                hitAt = cur;
                hitPos = [...target.position];
              });
            }
            engine.input.pressAction('attack');
            engine.step();
            engine.input.releaseAction('attack');
            let held: number[] = [];
            for (let i = 0; i < (round === 0 ? 60 : 40); i++) {
              cur = i;
              engine.step();
              if (round === 0 && hitAt >= 0) {
                const away = [
                  (target.position[0] ?? 0) - (player.position[0] ?? 0),
                  (target.position[2] ?? 0) - (player.position[2] ?? 0),
                ];
                const len = Math.hypot(away[0] ?? 0, away[1] ?? 0) || 1;
                const moved = [
                  (target.position[0] ?? 0) - (hitPos[0] ?? 0),
                  (target.position[2] ?? 0) - (hitPos[2] ?? 0),
                ];
                if (i === hitAt + 9) {
                  wolfKnock =
                    ((moved[0] ?? 0) * (away[0] ?? 0) + (moved[1] ?? 0) * (away[1] ?? 0)) / len;
                  held = [...target.position];
                }
                if (i === hitAt + 17)
                  wolfHeld = Math.hypot(
                    (target.position[0] ?? 0) - (held[0] ?? 0),
                    (target.position[2] ?? 0) - (held[2] ?? 0),
                  );
              }
            }
          }
          const left = engine.scene?.tree.getNodesInGroup('wolf').length ?? -1;
          if (left !== 0) throw new Error(`${left} wolves survived`);
          for (let i = 0; i < 5; i++) engine.step(); // director notices → cleared
          if (!quest.cleared) throw new Error('quest.cleared never set');
        },
      },
      {
        atMs: 20000,
        label: 'portal home + report back = QUEST COMPLETE',
        do: (ctx) => {
          const engine = ctx.engine;
          const root = () => engine.scene?.tree.root;
          const player = () => root()?.getNode('Player') as unknown as Vec;
          player().position = [3.5, 1.4, 13.5]; // into the return portal
          for (let i = 0; i < 30 && sceneName() !== 'EmberwoodVillage'; i++) engine.step();
          if (sceneName() !== 'EmberwoodVillage') throw new Error(`still in ${sceneName()}`);
          player().position = [3, 1.4, 0.2];
          for (let i = 0; i < 5; i++) engine.step();
          engine.input.pressAction('interact');
          engine.step();
          engine.input.releaseAction('interact');
          const talk = root()?.getNode('HUD/Dialogue') as UiDialogue;
          for (let i = 0; i < 400; i++) engine.step();
          talk.advance();
          for (let i = 0; i < 400; i++) engine.step();
          talk.advance();
          for (let i = 0; i < 10; i++) engine.step();
          if (!quest.done) throw new Error('quest never completed');
          const bannerText = (root()?.getNode('HUD/Banner') as UiBanner & { text?: string }) ?? {};
          const questLine = (root()?.getNode('HUD/Quest') as UiText).text;
          if (!questLine.includes('safe')) throw new Error(`quest line: ${questLine}`);
          void bannerText;
        },
      },
    ],
  });

  ok('QUEST: full loop (dialogue → grove → wolves → report back)', result.ok);
  ok(
    `QUEST: the first strike MOVED the wolf ${wolfKnock.toFixed(2)} m along the blow (Health.knockback)`,
    wolfKnock > 0.12,
  );
  ok(
    `QUEST: …and HELD it: ${wolfHeld.toFixed(2)} m walked in the 8 frames after (PathFollow staggered; free = 0.32 m)`,
    wolfHeld >= 0 && wolfHeld < 0.05,
  );
  for (const f of result.failures) console.error(`  ${f.label}: ${f.message}`);
}

// ---- REPLAY — recorded inputs are a regression test ---------------------------------
{
  resetQuest();
  const boot = async (): Promise<Engine> => {
    const engine = new Engine({ seed: 42, scheduler: () => () => {} });
    engine.setScene(
      loadScene(structuredClone(villageJson) as Parameters<typeof loadScene>[0], { engine }),
    );
    await enablePhysics3D(engine);
    return engine;
  };

  const a = await boot();
  const rec = startRecording(a);
  for (let frame = 0; frame <= 300; frame++) {
    if (frame === 20) a.input.handleKey('KeyW', true);
    if (frame === 160) a.input.handleKey('KeyD', true);
    if (frame === 240) a.input.handleKey('KeyW', false);
    a.tick(frame * (1000 / 60));
  }
  const recording = rec.stop();
  const posA = (a.scene?.tree.root?.getNode('Player') as unknown as Vec).position;

  resetQuest();
  const b = await boot();
  replay(b, recording);
  const posB = (b.scene?.tree.root?.getNode('Player') as unknown as Vec).position;

  ok(
    `REPLAY: bit-identical player position after 300 replayed frames (${posA.join(', ')})`,
    posA.length === 3 && posA.every((v, i) => v === posB[i]),
  );
  ok('REPLAY: the player actually moved', Math.hypot(posA[0] ?? 0, (posA[2] ?? 0) - 10) > 1);
}

console.log(process.exitCode ? '\nVERIFY FAILED' : '\nVERIFY OK');
