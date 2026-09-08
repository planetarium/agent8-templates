/**
 * Headless proof that Vanguard actually PLAYS — the browserless half of the
 * agent loop (author → VERIFY → fix). Runs the real `game.scene.json` through
 * `incanto/test`'s `runScript` at a fixed, seeded timestep and asserts the whole
 * built-in + custom composition end to end:
 *
 *   MOVE: holding 'move' walks the player (CharacterController3D `view: 'free'`).
 *   WIN : WaveSpawner drips enemies that Chase the player; an autopilot aims the
 *         third-person camera at the nearest enemy and fires the hitscan `Shoot`
 *         rifle — each kill frees the enemy (Health.freeOnDeath) and scores (+1).
 *         Clearing all three waves emits Spawner.allCleared → HudUpdater
 *         .onAllCleared → AREA SECURED.
 *   LOSE: an enemy hitbox (DamageOnContact targetGroup 'player') drains the
 *         player's Health to 0 → `died` → ScoreKeeper.loseLife → `lost`.
 *
 * Run with `bun verify.ts` (or `bun run verify`). Audio + rendering are no-ops
 * headlessly, so this isolates the gameplay logic.
 */
import type { Node } from 'incanto';
import { registerBehavior } from 'incanto';
import { auditScene, feelReport, registerAllNodes, runScript } from 'incanto/test';
import { HudUpdater, Shoot } from './src/behaviors';
import coverJson from './src/cover.scene.json';
import sceneJson from './src/game.scene.json';
import pillarJson from './src/pillar.scene.json';

/** The prefabs `game.scene.json` places — bun has no `import.meta.glob`, so by name. */
const resolveScene = (path: string): never =>
  (({ 'cover.scene.json': coverJson, 'pillar.scene.json': pillarJson })[path] ?? null) as never;

const behaviors = { Shoot, HudUpdater };

interface Vec {
  position: number[];
}
interface Ctl {
  yaw: number;
  pitch: number;
  eyeHeight: number;
}

function liveEnemies(ctx: { scene: { tree: { getNodesInGroup(g: string): Node[] } } }): Node[] {
  return ctx.scene.tree.getNodesInGroup('enemy');
}

const ok = (label: string, cond: boolean): void => {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`pass: ${label}`);
  }
};

// ---- AUDIT ---------------------------------------------------------------------------
// The check that fails on a WARNING, not just an error. Three of the five
// shipped templates had no audit block, which is how every one of them came to
// ship a scene whose saveable state had no uid to key it under: the save came
// back empty, the load reported no problem, and nothing here asked.
{
  registerAllNodes();
  for (const [name, ctor] of Object.entries(behaviors)) {
    registerBehavior(name, ctor as never, { replace: true });
  }
  const warnings = auditScene(sceneJson as unknown as Parameters<typeof auditScene>[0]);
  ok(`auditScene is clean (${warnings.length} warnings)`, warnings.length === 0);
  for (const w of warnings) console.error(`  warn: ${w}`);
}

// ---- MOVE + WIN path ----------------------------------------------------------
{
  let won = 0;
  let moved = false;
  let upperArmed = false;
  let sawEnemy = false;
  let chaseClosedIn = false;
  let maxScore = 0;

  const result = await runScript(sceneJson, {
    resolveScene,
    durationMs: 60000,
    seed: 1,
    behaviors,
    steps: [
      {
        atMs: 100,
        label: 'subscribe to win + prove movement',
        do: (ctx) => {
          ctx.getNode('/root/Spawner').on('allCleared', () => won++);
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          const x0 = player.position[0] ?? 0;
          ctx.engine.input.setActionVector('move', 1, 0);
          for (let i = 0; i < 30; i++) ctx.engine.step();
          moved = Math.abs((player.position[0] ?? 0) - x0) > 0.2;
          ctx.engine.input.setActionVector('move', 0, 0);
          player.position = [0, 1.4, 16];
        },
      },
      {
        atMs: 2500,
        label: 'enemies spawn, chase, and the hitscan rifle clears every wave → WIN',
        do: (ctx) => {
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          const ctl = ctx.getNode('/root/Player/Controller') as unknown as Ctl;

          const first = liveEnemies(ctx)[0] as unknown as Vec | undefined;
          if (first) {
            sawEnemy = true;
            const d0 = Math.hypot((first.position[0] ?? 0) - 0, (first.position[2] ?? 0) - 16);
            for (let i = 0; i < 20; i++) ctx.engine.step();
            const d1 = Math.hypot((first.position[0] ?? 0) - 0, (first.position[2] ?? 0) - 16);
            chaseClosedIn = d1 < d0;
          }

          const shoot = ctx.getNode('/root/Player/Controller').behavior as unknown as {
            ammo: number;
            reloading: boolean;
          };
          for (let i = 0; i < 5000 && won === 0; i++) {
            player.position = [0, 1.4, 16];
            const enemies = liveEnemies(ctx);
            if (enemies.length) {
              const ex = (enemies[0] as unknown as Vec).position;
              const dx = (ex[0] ?? 0) - 0;
              const dy = (ex[1] ?? 0) - (1.4 + ctl.eyeHeight);
              const dz = (ex[2] ?? 0) - 16;
              // Invert the forward() mapping to point the camera at the target.
              ctl.yaw = Math.atan2(-dx, -dz);
              ctl.pitch = Math.atan2(-dy, Math.hypot(dx, dz));
            }
            if (shoot.ammo <= 0 && !shoot.reloading) {
              ctx.engine.input.pressAction('reload');
              ctx.engine.step();
              ctx.engine.input.releaseAction('reload');
            } else {
              ctx.engine.input.pressAction('fire');
              ctx.engine.step();
              ctx.engine.input.releaseAction('fire');
              // The shot rides the UPPER-BODY layer, so the legs keep running.
              // Headless there is no mixer to clear it, which is exactly what
              // lets this read that the shot ARMED it.
              const skin = ctx.getNode('/root/Player/Skin') as unknown as {
                animationUpper: string;
              };
              if (skin.animationUpper === '$anims/shoot') upperArmed = true;
            }
            ctx.engine.step();
            const score = (ctx.getNode('/root').behavior as unknown as { score: number }).score;
            if (score > maxScore) maxScore = score;
          }
        },
      },
    ],
  });

  ok('holding move walked the player', moved);
  ok(
    'a shot plays on the upper body (animationUpper = $anims/shoot) while the legs keep their clip',
    upperArmed,
  );
  ok('a wave produced enemies', sawEnemy);
  ok('an enemy closed in on the player (Chase.moveParent)', chaseClosedIn);
  ok('hitscan kills scored points', maxScore >= 5);
  ok('clearing all waves emitted allCleared (WIN)', won === 1);
  ok('runScript reported no failures (WIN path)', result.ok);
}

// ---- LOSE path ----------------------------------------------------------------
{
  let lost = 0;
  let damaged = 0;

  const result = await runScript(sceneJson, {
    resolveScene,
    durationMs: 8000,
    seed: 2,
    behaviors,
    steps: [
      {
        atMs: 3000,
        label: 'enemy contact drains the player to 0 HP → LOSE',
        do: (ctx) => {
          ctx.getNode('/root').on('lost', () => lost++);
          ctx.getNode('/root/Player').on('damaged', () => damaged++);
          const enemy = liveEnemies(ctx)[0];
          if (!enemy) return;
          const hitbox = enemy.findChild('Hit') as Node;
          const player = ctx.getNode('/root/Player');
          for (let i = 0; i < 60 && lost === 0; i++) {
            hitbox.emit('triggerEnter', player);
            for (let f = 0; f < 40; f++) ctx.engine.step();
          }
        },
      },
    ],
  });

  ok('player took repeated damage', damaged >= 3);
  ok('player death emitted `lost` once (ScoreKeeper.loseLife)', lost === 1);
  ok('runScript reported no failures (LOSE path)', result.ok);
}

// ---- can an enemy ACTUALLY kill you? ---------------------------------------
//
// The LOSE path above emits `triggerEnter` by hand 60 times, which proves
// DamageOnContact answers an entry event and nothing about whether the game
// produces those events. It does not: contact fires on ENTRY, so an enemy that
// closes and rests deals ONE hit unless its hitbox carries `repeatEvery`.
// Measured on a player parked against an enemy for six seconds, before that
// prop was added: hp 90. This asserts the drain, from the game's own physics
// and its own Chase AI — no synthetic signals.
{
  let hp = 100;
  let hits = 0;
  const result = await runScript(sceneJson, {
    resolveScene,
    // 26 s, not 20: the first enemy arrives at ~17 s (a spawn pile at z −20,
    // a detour round the 0.6 m Ramp), so a 20 s window made "keeps hurting"
    // an arrival-time test that any extra collider in the arena could tip —
    // adding two slopes at the far corner took it from 3 hits to 2.
    durationMs: 26000,
    seed: 5,
    behaviors,
    steps: [
      {
        atMs: 100,
        label: 'stand still and let the enemies come',
        do: (ctx) => {
          ctx.getNode('/root/Player').on('damaged', () => hits++);
        },
      },
      {
        atMs: 25000,
        label: 'read the health the contact actually took',
        do: (ctx) => {
          hp = (ctx.getNode('/root/Player').behavior as unknown as { current: number }).current;
        },
      },
    ],
  });

  ok(`enemies that reach you keep hurting — ${hits} hits, hp ${hp}`, hits >= 3);
  ok('runScript reported no failures (CONTACT path)', result.ok);
}

// ---- FEEL: the controller's game-feel table, MEASURED -----------------------------
// `jumpCutMultiplier`, `maxJumps`, `airControl` and `fallGravity` were documented
// in the 3D character skill and set by no 3D example; this starter carries them
// now. Each is asserted by its EFFECT — the shape of the jump — never by reading
// the prop back, which is the difference between a scene that declares feel and
// a character that has it.
{
  const feel = await feelReport(sceneJson, { behaviors, resolveScene });
  const tapped = feel.jumpApex ?? 0;
  const held = feel.heldJumpApex ?? tapped;
  ok(
    `jumpCutMultiplier: a tap (${tapped} u) is a shorter hop than a hold (${held} u)`,
    tapped > 0.05 && held > tapped * 1.5,
  );
  ok(
    `maxJumps 2: a second press in the air climbs higher (${feel.doubleJump?.apex ?? '—'} u vs ${tapped} u)`,
    (feel.doubleJump?.apex ?? 0) > tapped * 1.4,
  );
  ok(
    `coyote window is measured with a double jump declared (${feel.coyoteMs} ms)`,
    (feel.coyoteMs ?? 0) >= 50,
  );
  ok(
    `jump buffer is measured with a double jump declared (${feel.jumpBufferMs} ms)`,
    (feel.jumpBufferMs ?? 0) >= 50,
  );
}

// ---- STEP + JUMP: the two controller numbers a level is built against ---------
// `stepHeight` and `jumpVelocity` were set by no example. The arena now has a
// 0.3 m curb and a 0.9 m ledge at z −12, and each is asserted by what the player
// can DO about it — walk over the one, be stopped by the other — and the jump
// by how much higher a faster launch reaches, never by reading a prop back.
{
  type Vec = { position: number[] };
  let curbX = 0;
  let floorY = 0;
  let curbY = 0;
  let ledgeX = 0;
  const result = await runScript(sceneJson, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 6000,
    steps: [
      {
        atMs: 100,
        do: (ctx) => {
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          player.position = [0, 1.4, -12];
          ctx.engine.input.setActionVector('move', 1, 0);
          for (let i = 0; i < 180; i++) {
            ctx.engine.step();
            const [x = 0, y = 0] = player.position;
            if (i === 40) floorY = y; // settled, still short of the curb
            if (x > 5.7 && x < 6.3) curbY = Math.max(curbY, y); // on top of it
          }
          curbX = player.position[0] ?? 0;
          ctx.engine.input.setActionVector('move', 0, 0);
          player.position = [0, 1.4, -12];
          ctx.engine.input.setActionVector('move', -1, 0);
          for (let i = 0; i < 180; i++) ctx.engine.step();
          ledgeX = player.position[0] ?? 0;
          ctx.engine.input.setActionVector('move', 0, 0);
        },
      },
    ],
  });
  ok('runScript reported no failures (STEP path)', result.ok);
  ok(
    `stepHeight 0.4: the player walks OVER the 0.3 m curb at x 6 (reached x ${curbX.toFixed(1)}; floor y ${floorY.toFixed(2)} → curb y ${curbY.toFixed(2)})`,
    curbX > 7 && curbY - floorY > 0.2,
  );
  ok(
    `…and the 0.9 m ledge at x −6 STOPS it (x ${ledgeX.toFixed(1)})`,
    ledgeX > -5.7 && ledgeX < -4.5,
  );
  // The same scene with the launch back at the default: the prop is asserted
  // by the DIFFERENCE it makes, which is the only thing a level cares about.
  const text = JSON.stringify(sceneJson);
  ok(
    'the scene declares jumpVelocity 5 (the comparison needs it)',
    text.includes('"jumpVelocity":5'),
  );
  const slower = JSON.parse(text.replace('"jumpVelocity":5', '"jumpVelocity":4'));
  const fast = await feelReport(sceneJson, { behaviors, resolveScene });
  const slow = await feelReport(slower, { behaviors, resolveScene });
  ok(
    `jumpVelocity 5 vs 4: a faster launch reaches higher (${fast.heldJumpApex ?? fast.jumpApex} u vs ${slow.heldJumpApex ?? slow.jumpApex} u)`,
    (fast.heldJumpApex ?? 0) > (slow.heldJumpApex ?? 0) * 1.3,
  );
}

// ---- SLOPE: what an enemy can climb -----------------------------------------------
// `CharacterBody3D.slopeLimitDeg` was set by no example. The enemy prefab now
// declares 50°, and the arena has a 40° hill and a 70° cliff (at z −20, away from
// the fight), each rising 4 m of slab onto a plateau. One enemy is put at the
// foot of each with the player on top: it must climb the hill and reach, and
// must NOT climb the cliff. Asserted by where the enemy GOT, never by the prop.
{
  type Vec = { position: number[] };
  const climb = (
    ctx: { getNode(p: string): unknown; engine: { step(): void } },
    enemy: Vec,
    foot: [number, number],
    top: [number, number, number],
  ): { rose: number; gap: number } => {
    const player = ctx.getNode('/root/Player') as unknown as Vec;
    enemy.position = [foot[0], 0.95, foot[1]];
    player.position = [top[0], top[1] + 0.85, top[2]];
    let rose = 0;
    for (let i = 0; i < 240; i++) {
      ctx.engine.step();
      rose = Math.max(rose, (enemy.position[1] ?? 0) - 0.95);
    }
    const gap = Math.hypot((enemy.position[0] ?? 0) - top[0], (enemy.position[2] ?? 0) - top[2]);
    player.position = [0, 1.4, 18]; // off the plateau before the contact damage adds up
    return { rose, gap };
  };
  let hill = { rose: 0, gap: 99 };
  let cliff = { rose: 0, gap: 99 };
  const result = await runScript(sceneJson, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 6000,
    steps: [
      {
        atMs: 3500,
        label: 'one enemy at the foot of the hill, then of the cliff',
        do: (ctx) => {
          const enemy = liveEnemies(ctx)[0] as unknown as Vec | undefined;
          if (!enemy) return;
          hill = climb(ctx, enemy, [6.97, -20], [13.03, 2.571, -20]);
          cliff = climb(ctx, enemy, [15.82, -20], [20.18, 3.759, -20]);
        },
      },
    ],
  });
  ok('runScript reported no failures (SLOPE path)', result.ok);
  ok(
    `slopeLimitDeg 50: the enemy climbs the 40° hill and reaches the player on top (rose ${hill.rose.toFixed(2)} m, ${hill.gap.toFixed(1)} m short)`,
    hill.rose > 2 && hill.gap < 3,
  );
  ok(
    `…and cannot climb the 70° cliff (rose ${cliff.rose.toFixed(2)} m, ${cliff.gap.toFixed(1)} m short)`,
    cliff.rose < 1 && cliff.gap > 3,
  );
}

// ---- RIG: what the controller does about the world around it ---------------------
// `cameraCollision` and `platformCarry` were set by no example. The scene now
// declares both, the arena has a moving `Lift` (a StaticBody3D walked by
// Patrol), and each is asserted by an effect: how close the camera comes when
// a wall is behind you, and whether standing still on a moving floor keeps you
// on it. `floatHeight` was composed too and taken back out: the hover spring
// sags ~0.13 m under gravity, so below that the capsule rests on contact and
// the prop changes nothing (0.01 → y 0.839, 0.05 → 0.840, 0.3 → 1.008) — the
// rest height is reported here, not asserted, and the skill says why.
{
  type Vec = { position: number[] };
  let restY = 0;
  let camGap = 99;
  let liftTravel = 0;
  let riderDrift = 99;
  const result = await runScript(sceneJson, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 8000,
    steps: [
      {
        atMs: 100,
        do: (ctx) => {
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          const cam = ctx.getNode('/root/Camera') as unknown as Vec;
          const lift = ctx.getNode('/root/Arena/Lift') as unknown as Vec;
          // where the capsule rests on open floor (half 0.5 + radius 0.34)
          player.position = [0, 1.4, 12];
          for (let i = 0; i < 120; i++) ctx.engine.step();
          restY = player.position[1] ?? 0;
          // cameraCollision: the boom points +z; 1.25 m from Wall2 (z 24.25) the
          // camera cannot sit 4.2 m back
          player.position = [10, 1.4, 23];
          for (let i = 0; i < 120; i++) ctx.engine.step();
          camGap = Math.hypot(
            (cam.position[0] ?? 0) - (player.position[0] ?? 0),
            (cam.position[2] ?? 0) - (player.position[2] ?? 0),
          );
          // platformCarry: stand on the Lift and do nothing for two seconds
          const [lx = 0, , lz = 0] = lift.position;
          player.position = [lx, 0.6 + 0.9, lz];
          for (let i = 0; i < 30; i++) ctx.engine.step(); // settle
          const x0 = lift.position[0] ?? 0;
          const p0 = player.position[0] ?? 0;
          for (let i = 0; i < 120; i++) ctx.engine.step();
          liftTravel = (lift.position[0] ?? 0) - x0;
          riderDrift = Math.abs((player.position[0] ?? 0) - p0 - liftTravel);
        },
      },
    ],
  });
  ok('runScript reported no failures (RIG path)', result.ok);
  ok(
    `the capsule rests at y ${restY.toFixed(3)} on open floor (0.84 = half 0.5 + radius 0.34)`,
    restY > 0.8 && restY < 0.9,
  );
  ok(
    `cameraCollision: with a wall behind, the camera closes to ${camGap.toFixed(2)} m (4.2 in the open)`,
    camGap < 2.2,
  );
  ok(
    `platformCarry: the Lift travelled ${liftTravel.toFixed(2)} m and the rider drifted only ${riderDrift.toFixed(2)} m off it`,
    Math.abs(liftTravel) > 2.5 && riderDrift < 0.5,
  );
}

// ---- CATCH: an arena you cannot leave for good --------------------------------
// The Hill and Cliff plateaus, the Lift and a double jump at jumpVelocity 5 —
// three compositions of this round — add up to a route over the 3 m walls:
// 24 seeded playtests fell out of the world 3 times. The walls stay; a
// `Respawn` under the player catches anything that gets over them.
{
  type Vec = { position: number[] };
  let caughtAt: number[] = [];
  const result = await runScript(sceneJson, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 4000,
    steps: [
      {
        atMs: 100,
        do: (ctx) => {
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          player.position = [-14, 4.8, -26]; // where the trace put it: over Wall1
          for (let i = 0; i < 240; i++) ctx.engine.step();
          caughtAt = [...player.position];
        },
      },
    ],
  });
  ok('runScript reported no failures (CATCH path)', result.ok);
  ok(
    `a player over the wall is caught and put back in the arena (y ${caughtAt[1]?.toFixed(2)}, z ${caughtAt[2]?.toFixed(1)})`,
    (caughtAt[1] ?? -99) > 0 &&
      Math.abs(caughtAt[2] ?? 99) < 24 &&
      Math.abs(caughtAt[0] ?? 99) < 24,
  );
}

// ---- RANGE: a mortar that lobs shells ---------------------------------------------
// `Spawner.at`/`autoStart`, `Projectile.direction`/`gravity` and a `Lifetime`
// riding a clone were set by no example. The arena's far corner has a Mortar
// (autoStart false, at [0,1,0]) whose Shell flies [0.8,0.6,0] at 8 u/s under
// `gravity: 9.81`. A POSITIVE gravity pulls DOWN in the scene's own convention
// now (+y in 2D, −y in 3D); it used to add to +y regardless, and 9.81 in this
// y-up scene LIFTED the shell — measured: y 19.36 at 1.5 s and still climbing
// at 59.8 m when the Lifetime freed it. Asserted by
// where the clone appears, which way its y goes and when it is freed — never
// by reading a prop back.
{
  type Vec = { position: number[] };
  type Sp = { liveCount: number; spawn(): Node | null };
  let idleLive = -1;
  let born: number[] = [];
  const ys: number[] = [];
  const xs: number[] = [];
  let freedAtFrame = -1;
  const result = await runScript(sceneJson, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 8000,
    steps: [
      {
        atMs: 100,
        do: (ctx) => {
          const sp = ctx.getNode('/root/Arena/Mortar').behavior as unknown as Sp;
          for (let i = 0; i < 180; i++) ctx.engine.step(); // 3 s: autoStart false ticks nothing
          idleLive = sp.liveCount;
          const shell = sp.spawn();
          if (!shell) return;
          const s = shell as unknown as Vec;
          born = [...s.position];
          for (let i = 0; i < 240; i++) {
            ctx.engine.step();
            if (shell.parent === null) {
              freedAtFrame = i + 1;
              break;
            }
            xs.push(s.position[0] ?? 0);
            ys.push(s.position[1] ?? 0);
          }
        },
      },
    ],
  });
  ok('runScript reported no failures (RANGE path)', result.ok);
  ok(
    `autoStart false: after 3 s the mortar has spawned ${idleLive} shells on its own`,
    idleLive === 0,
  );
  ok(
    `at [0,1,0]: the shell appears 1 m over the mortar (local ${born.map((v) => v.toFixed(2)).join(', ')})`,
    Math.abs(born[0] ?? 9) < 0.01 &&
      Math.abs((born[1] ?? 9) - 1) < 0.01 &&
      Math.abs(born[2] ?? 9) < 0.01,
  );
  const apex = Math.max(...ys);
  const apexAt = ys.indexOf(apex) / 60;
  const y15 = ys[89] ?? Number.NaN;
  const x15 = xs[89] ?? Number.NaN;
  ok(
    `gravity 9.81 pulls the shell DOWN in a y-up scene: apex ${apex.toFixed(2)} m at ${apexAt.toFixed(2)} s, y ${y15.toFixed(2)} at 1.5 s, x ${x15.toFixed(2)} (a lob at vy 4.8 peaks at 2.17 m at 0.49 s and is under the floor by 1.5 s; +9.81 climbed to 19.4 m)`,
    apex < 2.5 && apexAt < 0.7 && y15 < 0,
  );
  ok(
    `Lifetime 3 s + freeParent frees the shell at frame ${freedAtFrame} (180 = 3 s)`,
    freedAtFrame >= 178 && freedAtFrame <= 184,
  );
}

// ---- FACING: an enemy that turns to look where it walks ---------------------------
// `Chase.facePath`/`turnSpeed` were set by no example. The enemy's AI now points
// `facePath` at its Skin (the Eye rides the Skin, so the turn is visible) at
// 3 rad/s. Asserted by the Skin's yaw: settled on one heading, then how far it
// has turned 0.1 s after the target moves 90° round — a snap would be there already.
{
  type Vec = { position: number[] };
  type Rot = { rotation: number[] };
  let yawSettled = 99;
  let yawAfter100ms = 99;
  let yawAfter1s = 99;
  const result = await runScript(sceneJson, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 6000,
    steps: [
      {
        atMs: 3500,
        do: (ctx) => {
          const enemy = liveEnemies(ctx)[0] as (Node & Vec) | undefined;
          if (!enemy) return;
          const skin = enemy.findChild('Skin') as unknown as Rot;
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          enemy.position = [-16, 0.95, 14];
          player.position = [-16, 1.4, 4]; // travel −z → yaw 180
          for (let i = 0; i < 90; i++) ctx.engine.step();
          yawSettled = skin.rotation[1] ?? 99;
          player.position = [-6, 1.4, enemy.position[2] ?? 10]; // travel +x → yaw 90
          for (let i = 0; i < 6; i++) ctx.engine.step();
          yawAfter100ms = skin.rotation[1] ?? 99;
          for (let i = 0; i < 54; i++) ctx.engine.step();
          yawAfter1s = skin.rotation[1] ?? 99;
          player.position = [0, 1.4, 18];
        },
      },
    ],
  });
  ok('runScript reported no failures (FACING path)', result.ok);
  ok(
    `facePath ../Skin: walking −z the skin settles at yaw ${yawSettled.toFixed(1)}° (180 = +Z-forward turned about)`,
    Math.abs(Math.abs(yawSettled) - 180) < 3,
  );
  ok(
    `turnSpeed 3 rad/s: 0.1 s after the target moves round to +x the skin has turned to ${yawAfter100ms.toFixed(1)}° (≈163 expected — 17° of the 90; 90 would be a snap)`,
    yawAfter100ms > 150 && yawAfter100ms < 175,
  );
  ok(`…and after 1 s it faces +x at ${yawAfter1s.toFixed(1)}°`, Math.abs(yawAfter1s - 90) < 5);
}

// ---- LIFT: a deck that turns to face where it travels (Patrol.facePath/turnSpeed) ---
// The same pair on `Patrol`, set by no example either. The Lift's Skin now turns
// toward its travel at 2 rad/s; a pingpong reversal is a 180° turn that should
// take π/2 s. Asserted by how far the deck has turned 0.25 s and 2 s after the
// reversal the harness watches for.
{
  type Vec = { position: number[] };
  type Rot = { rotation: number[] };
  let flipAtFrame = -1;
  let yawBefore = 99;
  let yawQuarter = 99;
  let yawLater = 99;
  const result = await runScript(sceneJson, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 12000,
    steps: [
      {
        atMs: 100,
        do: (ctx) => {
          const lift = ctx.getNode('/root/Arena/Lift') as Node & Vec;
          const skin = lift.findChild('Skin') as unknown as Rot;
          let prev = lift.position[0] ?? 0;
          let dir = 0;
          for (let i = 0; i < 600; i++) {
            ctx.engine.step();
            const x = lift.position[0] ?? 0;
            const d = Math.sign(x - prev);
            prev = x;
            if (d !== 0 && dir !== 0 && d !== dir) {
              flipAtFrame = i;
              break;
            }
            if (d !== 0) dir = d;
          }
          yawBefore = skin.rotation[1] ?? 99;
          for (let i = 0; i < 15; i++) ctx.engine.step();
          yawQuarter = skin.rotation[1] ?? 99;
          for (let i = 0; i < 105; i++) ctx.engine.step();
          yawLater = skin.rotation[1] ?? 99;
        },
      },
    ],
  });
  const turned = (a: number, b: number): number => Math.abs(((b - a + 540) % 360) - 180);
  ok('runScript reported no failures (LIFT path)', result.ok);
  ok(
    `the Lift reversed at frame ${flipAtFrame} (8 m at 2 m/s ≈ 4 s = 240)`,
    flipAtFrame > 200 && flipAtFrame < 280,
  );
  ok(
    `turnSpeed 2 rad/s: 0.25 s after the reversal the deck has turned ${turned(yawBefore, yawQuarter).toFixed(1)}° of 180 (≈29 expected)`,
    turned(yawBefore, yawQuarter) > 20 && turned(yawBefore, yawQuarter) < 40,
  );
  ok(
    `…and 2 s after it has turned the full ${turned(yawBefore, yawLater).toFixed(1)}°`,
    turned(yawBefore, yawLater) > 170,
  );
}

// ---- MINE: a fuse that starts when stepped on (Lifetime.startOnSignal) -------------
// A 1.5 s `Lifetime` with `startOnSignal` sits at the far corner with a Trigger
// area wired `triggerEnter → startTimer` under `filter: { group: "player" }` —
// the 1 m sphere overlaps the floor, and without the filter the FLOOR lit the
// fuse on frame 1. Asserted by the node still being there after 3 s, then going
// 1.5 s after the player steps on it.
{
  type Vec = { position: number[] };
  let expired = 0;
  let aliveAfter3s = false;
  let framesToExpire = -1;
  const result = await runScript(sceneJson, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 8000,
    steps: [
      {
        atMs: 100,
        do: (ctx) => {
          const mine = ctx.getNode('/root/Arena/Mine');
          mine.on('expired', () => expired++);
          for (let i = 0; i < 180; i++) ctx.engine.step();
          aliveAfter3s = mine.parent !== null && expired === 0;
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          player.position = [20, 1.4, 20];
          for (let i = 0; i < 240; i++) {
            ctx.engine.step();
            if (expired > 0) {
              framesToExpire = i + 1;
              break;
            }
          }
          player.position = [0, 1.4, 18];
        },
      },
    ],
  });
  ok('runScript reported no failures (MINE path)', result.ok);
  ok(
    `startOnSignal: a 1.5 s Lifetime is still in the tree after 3 s (${aliveAfter3s})`,
    aliveAfter3s,
  );
  ok(
    `…and stepping on its trigger starts the fuse: expired ${framesToExpire} frames after (90 = 1.5 s, plus the contact frame or two)`,
    framesToExpire >= 89 && framesToExpire <= 100,
  );
}

// ---- BAIT: a pickup only the enemies take (Pickup.collectorGroup) ---------------------
// `collectorGroup` was set by no example — every pickup in the repo is the
// player's. A Bait area near Wall4 says `collectorGroup: "enemy"`. Asserted by who
// collects it: the player standing on it must not, an enemy walked onto it must.
{
  type Vec = { position: number[] };
  let collected = 0;
  let playerTook = -1;
  let enemyTook = -1;
  let baitGone = false;
  const result = await runScript(sceneJson, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 6000,
    steps: [
      {
        atMs: 3500,
        do: (ctx) => {
          const bait = ctx.getNode('/root/Arena/Bait');
          bait.on('collected', () => collected++);
          const player = ctx.getNode('/root/Player') as unknown as Vec;
          player.position = [21, 1.4, 12];
          for (let i = 0; i < 30; i++) ctx.engine.step();
          playerTook = collected;
          player.position = [0, 1.4, 18];
          const enemy = liveEnemies(ctx)[0] as unknown as Vec | undefined;
          if (!enemy) return;
          enemy.position = [21, 0.95, 12];
          for (let i = 0; i < 30; i++) ctx.engine.step();
          enemyTook = collected;
          baitGone = bait.parent === null;
        },
      },
    ],
  });
  ok('runScript reported no failures (BAIT path)', result.ok);
  ok(
    `collectorGroup enemy: the player standing on the bait collected ${playerTook} of it`,
    playerTook === 0,
  );
  ok(
    `…and an enemy walked onto it collected ${enemyTook} (bait freed: ${baitGone})`,
    enemyTook === 1 && baitGone,
  );
}

// ---- WAVES ON A SIGNAL: `WaveSpawner.autoStart` (measured, not composed) ----------
// Set by no example — every wave in the repo starts at ready. This starter's
// waves ARE the game, so the prop is measured on a copy of the JSON with
// `autoStart: false` rather than composed into it: five seconds must produce no
// enemy, and `start()` must then produce the first wave on its own schedule.
{
  const text = JSON.stringify(sceneJson);
  const key = '"name":"WaveSpawner","props":{';
  ok('the scene declares its waves (the comparison needs them)', text.includes(key));
  const held = JSON.parse(text.replace(key, `${key}"autoStart":false,`));
  let idle = -1;
  let after = -1;
  const result = await runScript(held, {
    resolveScene: resolveScene as never,
    behaviors,
    durationMs: 12000,
    steps: [
      {
        atMs: 5000,
        do: (ctx) => {
          idle = liveEnemies(ctx).length;
          (ctx.getNode('/root/Spawner').behavior as unknown as { start(): void }).start();
          for (let i = 0; i < 330; i++) ctx.engine.step(); // delayBefore 2 + 4 × 1.1 = 6.4 s
          after = liveEnemies(ctx).length;
        },
      },
    ],
  });
  ok('runScript reported no failures (WAVES path)', result.ok);
  ok(`autoStart false: five seconds in, ${idle} enemies`, idle === 0);
  ok(`…and start() brings the first wave: ${after} enemies 5.5 s later (4 declared)`, after === 4);
}

console.log(process.exitCode ? '\nVERIFY FAILED' : '\nVERIFY OK — Vanguard plays end to end');
