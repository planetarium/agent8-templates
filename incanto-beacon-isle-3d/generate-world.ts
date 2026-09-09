/**
 * Beacon Isle world builder — run `bun generate-world.ts` to (re)emit
 * `src/game.scene.json`. Deterministic: same seeds, same island. This is the
 * template's authoring story: the WORLD is generated (terrain, sea, groves,
 * grass, flowers, ward sites picked on walkable ground), the GAME is authored
 * (quest, enemies, HUD) — regenerate the world without touching the game.
 */

import { newUid } from 'incanto';
import { buildTerrainNav, Terrain3D } from 'incanto/3d';
import { generateTerrain } from 'incanto/env';

const SEED = 7411;
const SIZE = 240;
const MAX_HEIGHT = 16;

// ---- 1. the island ----------------------------------------------------------------
const terrain = generateTerrain({ seed: SEED, theme: 'island', size: SIZE, maxHeight: MAX_HEIGHT });
const surfaceProps = (terrain.children ?? []).find((c) => c.name === 'Ground')?.children?.[0]
  ?.props as Record<string, unknown>;
const seaY =
  ((terrain.children ?? []).find((c) => c.name === 'Sea')?.props?.position as number[])?.[1] ?? 0;

// headless height sampler — the SAME surface the game will load
const sampler = new Terrain3D('S');
Object.assign(sampler, surfaceProps);
const heightAt = (x: number, z: number): number => sampler.heightAt(x, z);
const nav = buildTerrainNav(sampler, { cellSize: 3, maxSlopeDeg: 38, minHeight: seaY + 0.6 });

/** Deterministic LCG so placement never shifts between runs. */
let rngState = SEED;
const rand = (): number => {
  rngState = (rngState * 1664525 + 1013904223) >>> 0;
  return rngState / 0xffffffff;
};

/** Find a walkable spot near (x, z), spiralling outward on the nav grid. */
function walkableNear(x: number, z: number): [number, number, number] {
  const [cx, cy] = nav.toCell(x, z);
  for (let r = 0; r < 25; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!nav.grid.solid(cx + dx, cy + dy)) return nav.toWorld(cx + dx, cy + dy);
      }
    }
  }
  throw new Error(`no walkable ground near ${x},${z}`);
}

// ---- 2. key sites ------------------------------------------------------------------
const keeperSite = walkableNear(-18, 62); // south coast bluff
const playerSpawn = walkableNear(keeperSite[0] + 12, keeperSite[2] + 10);
const wardSites = [walkableNear(-62, -38), walkableNear(58, -52), walkableNear(66, 44)];

// ---- 3. dressing -------------------------------------------------------------------
const dressing: unknown[] = [];
const CANOPIES = ['#4a7c3f', '#56883c', '#b8862f', '#2c5740', '#86a346'];
const TRUNKS = ['#7a5a3a', '#806044', '#5f4530', '#a39c8e'];
let placed = 0;
for (let i = 0; i < 600 && placed < 22; i++) {
  const x = (rand() - 0.5) * (SIZE - 40);
  const z = (rand() - 0.5) * (SIZE - 40);
  const y = heightAt(x, z);
  if (y < seaY + 1.2) continue;
  const [wcx, wcy] = nav.toCell(x, z);
  if (nav.grid.solid(wcx, wcy)) continue;
  // keep groves clear of the quest sites
  const sites = [keeperSite, ...wardSites];
  if (sites.some(([sx, , sz]) => Math.hypot(sx - x, sz - z) < 16)) continue;
  placed++;
  dressing.push({
    name: `Grove${placed}`,
    type: 'Tree3D',
    props: {
      type: rand() > 0.4 ? 'broadleaf' : 'conifer',
      seed: Math.floor(rand() * 1e9),
      height: 5 + rand() * 3,
      position: [round2(x), round2(y), round2(z)],
      count: 7,
      area: [14, 14],
      canopyColor: CANOPIES[Math.floor(rand() * CANOPIES.length)],
      trunkColor: TRUNKS[Math.floor(rand() * TRUNKS.length)],
      leafFadeStart: 160,
      leafFadeEnd: 420,
    },
  });
}
let grassPlaced = 0;
for (let i = 0; i < 400 && grassPlaced < 14; i++) {
  const x = (rand() - 0.5) * (SIZE - 60);
  const z = (rand() - 0.5) * (SIZE - 60);
  const y = heightAt(x, z);
  if (y < seaY + 1) continue;
  grassPlaced++;
  dressing.push({
    name: `Grass${grassPlaced}`,
    type: 'Foliage3D',
    props: {
      kind: 'grass',
      style: 'mesh',
      position: [round2(x), round2(y), round2(z)],
      area: [34, 34],
      density: 10,
    },
  });
}
let flowersPlaced = 0;
for (let i = 0; i < 300 && flowersPlaced < 9; i++) {
  const x = (rand() - 0.5) * (SIZE - 70);
  const z = (rand() - 0.5) * (SIZE - 70);
  const y = heightAt(x, z);
  if (y < seaY + 1.4) continue;
  flowersPlaced++;
  dressing.push({
    name: `Flowers${flowersPlaced}`,
    type: 'Flowers3D',
    props: {
      position: [round2(x), round2(y), round2(z)],
      area: [12, 12],
      seed: Math.floor(rand() * 1e9),
    },
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// shoreline rocks: a band just above the waterline, ONE draw call
const rockRows: number[][] = [];
for (let i = 0; i < 900 && rockRows.length < 70; i++) {
  const x = (rand() - 0.5) * (SIZE - 10);
  const z = (rand() - 0.5) * (SIZE - 10);
  const y = heightAt(x, z);
  if (y < seaY + 0.15 || y > seaY + 1.1) continue; // the wet band
  rockRows.push([
    round2(x),
    round2(y - 0.15),
    round2(z),
    Math.floor(rand() * 360),
    round2(0.5 + rand() * 1.1),
  ]);
}
dressing.push({
  name: 'ShoreRocks',
  type: 'InstancedMesh3D',
  props: {
    // Sunk into the slope on purpose — see the note by the player's Catch.
    snapToGround: false,
    mesh: 'gem',
    size: [0.6, 0.45, 0.6],
    material: { color: '#7e8590', roughness: 0.95, flatShading: true },
    transforms: rockRows,
    castShadow: true,
    receiveShadow: true,
  },
});

// shade spawn cells: two per ward, on walkable ground nearby
const shadePacks = wardSites.map(([wx, , wz], i) => {
  const a = walkableNear(wx + 9, wz + 4);
  const b = walkableNear(wx - 7, wz - 8);
  return { ward: i + 1, spots: [a, b] };
});

// ---- 4. game nodes -----------------------------------------------------------------
const ward = (i: number, [x, y, z]: [number, number, number]): unknown => ({
  name: `Ward${i}`,
  type: 'Node3D',
  groups: ['ward'],
  props: { position: [round2(x), round2(y), round2(z)], snapToGround: false },
  children: [
    {
      name: 'Plinth',
      type: 'StaticBody3D',
      props: { collider: { shape: 'box', size: [1.6, 1.2, 1.6] }, position: [0, 0.6, 0] },
      children: [
        {
          name: 'Stone',
          type: 'MeshInstance3D',
          props: {
            mesh: 'cylinder',
            size: [0.8, 1.2, 0.8], // RADIUS (cylinder size[0]) = collider box half-extent
            material: { color: '#7d8494', roughness: 0.9 },
            castShadow: true,
            receiveShadow: true,
          },
        },
      ],
    },
    {
      name: 'Crystal',
      type: 'MeshInstance3D',
      props: {
        mesh: 'gem',
        size: [0.55, 1.1, 0.55],
        position: [0, 1.75, 0],
        material: { color: '#243044', emissive: '#66ddff', emissiveIntensity: 0, roughness: 0.2 },
        castShadow: true,
      },
    },
    {
      name: 'Glow',
      type: 'OmniLight3D',
      props: { position: [0, 2, 0], color: '#7fe3ff', intensity: 0, range: 16 },
    },
    {
      name: 'LitFx',
      type: 'Particles3D',
      props: {
        position: [0, 2, 0],
        preset: 'magic',
        rate: 0,
        burst: 40,
        blend: 'add',
        sizeStart: 80,
        sizeEnd: 16,
        renderOrder: 100,
      },
    },
    {
      name: 'ChimeSfx',
      type: 'AudioPlayer',
      props: { preset: 'powerup', volume: 0.7, spatial: true, refDistance: 6, maxDistance: 60 },
    },
  ],
});

const shade = (wardIdx: number, n: number, [x, y, z]: [number, number, number]): unknown => ({
  name: `Shade${wardIdx}_${n}`,
  type: 'Node3D',
  groups: ['shade', `shade-ward${wardIdx}`],
  props: { position: [round2(x), round2(y + 0.9), round2(z)], snapToGround: false },
  script: { name: 'PathFollow', props: { speed: 2.6, loop: true } },
  children: [
    {
      name: 'Body',
      type: 'MeshInstance3D',
      props: {
        mesh: 'capsule',
        size: [0.28, 0.62, 0.28],
        material: { color: '#141428', emissive: '#3b2d8a', emissiveIntensity: 0.5, roughness: 0.6 },
        castShadow: true,
      },
    },
    {
      name: 'Hood',
      type: 'MeshInstance3D',
      props: {
        mesh: 'gem',
        size: [0.3, 0.46, 0.3],
        position: [0, 0.58, 0],
        material: { color: '#0e0e1e', emissive: '#241a5e', emissiveIntensity: 0.4 },
      },
    },
    {
      name: 'EyeL',
      type: 'MeshInstance3D',
      props: {
        mesh: 'sphere',
        size: [0.05, 0.05, 0.05],
        position: [-0.09, 0.6, 0.24],
        material: { color: '#ff4466', emissive: '#ff4466', emissiveIntensity: 2.4 },
      },
    },
    {
      name: 'EyeR',
      type: 'MeshInstance3D',
      props: {
        mesh: 'sphere',
        size: [0.05, 0.05, 0.05],
        position: [0.09, 0.6, 0.24],
        material: { color: '#ff4466', emissive: '#ff4466', emissiveIntensity: 2.4 },
      },
    },
    {
      name: 'Wisp',
      type: 'Trail3D',
      props: {
        width: 0.3,
        color: '#5a48c8',
        opacity: 0.5,
        seconds: 0.5,
        additive: true,
        position: [0, 0.2, 0],
      },
    },
    {
      name: 'Fang',
      type: 'Area3D',
      props: { position: [0, 0, 0.4], collider: { shape: 'box', size: [0.7, 1.2, 0.8] } },
      script: {
        name: 'DamageOnContact',
        props: { amount: 20, targetGroup: 'player', oncePerTarget: false, repeatEvery: 1.2 },
      },
    },
    {
      name: 'HissSfx',
      type: 'AudioPlayer',
      props: {
        preset: 'hurt',
        volume: 0.3,
        pitch: 0.4,
        spatial: true,
        refDistance: 4,
        maxDistance: 30,
      },
    },
  ],
});

const scene = {
  format: 1,
  type: 'scene',
  dimension: '3d',
  name: 'BeaconIsle',
  environment: {
    sky: { type: 'atmosphere', elevationDeg: 17, azimuthDeg: 224, turbidity: 3.2, rayleigh: 2.1 },
    fog: { near: 110, far: 560 },
    shadows: { mapSize: 2048, radius: 1.2 },
    exposure: 1.12,
    ambient: { color: '#ffe8d4', intensity: 0.85 },
    iblIntensity: 0.9,
    bloom: { threshold: 1.2, strength: 0.55 },
    post: { vignette: 0.28, saturation: 1.12, contrast: 1.02 },
  },
  physics: { gravity: [0, -9.81, 0] },
  input: {
    move: {
      type: 'vector2',
      keys: {
        up: ['KeyW', 'ArrowUp'],
        down: ['KeyS', 'ArrowDown'],
        left: ['KeyA', 'ArrowLeft'],
        right: ['KeyD', 'ArrowRight'],
      },
      touch: 'joystick',
    },
    jump: { type: 'button', keys: ['Space'], touch: 'button' },
    sprint: { type: 'button', keys: ['ShiftLeft', 'ShiftRight'] },
    interact: { type: 'button', keys: ['KeyE'], touch: 'button' },
    attack: { type: 'button', keys: ['Mouse0', 'KeyF'], touch: 'button' },
  },
  assets: {
    'characters/base': {
      type: 'model',
      url: 'https://agent8-games.verse8.io/assets/3d/characters/realistic style/base-model.glb',
    },
    'anims/idle': {
      type: 'animation',
      url: 'https://agent8-games.verse8.io/assets/3d/animations/mixamorig/idle-00.glb',
    },
    'anims/walk': {
      type: 'animation',
      url: 'https://agent8-games.verse8.io/assets/3d/animations/mixamorig/walk.glb',
    },
    'anims/run': {
      type: 'animation',
      url: 'https://agent8-games.verse8.io/assets/3d/animations/mixamorig/run-medium.glb',
    },
    'anims/runFast': {
      type: 'animation',
      url: 'https://agent8-games.verse8.io/assets/3d/animations/mixamorig/run-fast.glb',
    },
    'anims/jump': {
      type: 'animation',
      url: 'https://agent8-games.verse8.io/assets/3d/animations/mixamorig/jump.glb',
    },
    'anims/attack': {
      type: 'animation',
      url: 'https://agent8-games.verse8.io/assets/3d/animations/mixamorig/melee-attack.glb',
    },
  },
  root: {
    name: 'Game',
    type: 'Node',
    script: { name: 'IsleDirector' },
    children: [
      {
        ...terrain,
        // static per-child, NOT the whole subtree: Sea (Water3D) and Clouds
        // must keep animating — auditScene flags exactly this mistake.
        children: (terrain.children ?? []).map((c) =>
          c.type === 'Water3D' || c.name === 'Clouds'
            ? c.name === 'Sea'
              ? {
                  ...c,
                  // the OPEN-OCEAN dial (0.15.0): directional swell trains +
                  // whitecaps + deeper absorption — the sea moves, banded and
                  // alive, instead of a flat noise sheet
                  props: {
                    ...(c.props ?? {}),
                    swell: 0.55,
                    swellWavelength: 42,
                    swellDirectionDeg: 262,
                    whitecaps: 0.45,
                    absorption: 0.28,
                    reflectionInterval: 400,
                    colors: { trough: '#0c3d58', surface: '#1a7d9c', peak: '#9adfe0' },
                  },
                }
              : c
            : { ...c, props: { ...(c.props ?? {}), static: true } },
        ),
      },
      { name: 'Dressing', type: 'Node3D', props: { static: true }, children: dressing },
      {
        name: 'Lighthouse',
        type: 'Node3D',
        props: {
          position: [
            round2(keeperSite[0] - 5),
            round2(heightAt(keeperSite[0] - 5, keeperSite[2] - 4)),
            round2(keeperSite[2] - 4),
          ],
          // The lamp sits at the top of the tower: the ASSEMBLY owns its
          // children's height, so `findFloatingProps` is not asked about them.
          snapToGround: false,
          static: true,
        },
        children: [
          {
            name: 'Tower',
            type: 'StaticBody3D',
            props: { collider: { shape: 'box', size: [3, 11, 3] }, position: [0, 5.5, 0] },
            children: [
              {
                name: 'Shaft',
                type: 'MeshInstance3D',
                props: {
                  mesh: 'cylinder',
                  size: [1.5, 11, 1.5], // RADIUS = collider half-extent (was 3 → camera clipped inside the 1.5 m shell)
                  material: { color: '#e8e2d4', roughness: 0.8 },
                  castShadow: true,
                  receiveShadow: true,
                },
              },
              {
                name: 'Band',
                type: 'MeshInstance3D',
                props: {
                  mesh: 'cylinder',
                  size: [1.56, 1.6, 1.56],
                  position: [0, 1.2, 0],
                  material: { color: '#b8452e', roughness: 0.8 },
                },
              },
            ],
          },
          {
            name: 'Lamp',
            type: 'MeshInstance3D',
            props: {
              mesh: 'gem',
              size: [0.9, 1.4, 0.9],
              position: [0, 11.6, 0],
              material: { color: '#fff2c4', emissive: '#ffd982', emissiveIntensity: 2.2 },
            },
          },
          {
            name: 'LampLight',
            type: 'OmniLight3D',
            props: { position: [0, 11.6, 0], color: '#ffd982', intensity: 2.2, range: 40 },
          },
        ],
      },
      {
        name: 'Keeper',
        type: 'Node3D',
        props: { position: keeperSite.map(round2), snapToGround: false },
        script: { name: 'Interactable', props: { action: 'interact', range: 3 } },
        children: [
          {
            name: 'Body',
            type: 'ModelInstance3D',
            props: {
              model: '$characters/base',
              targetHeight: 1.68,
              animation: '$anims/idle',
              tint: '#d8b46a',
              castShadow: true,
            },
          },
          {
            name: 'Marker',
            type: 'Billboard3D',
            props: { position: [0, 2.2, 0], mode: 'y' },
            children: [
              {
                name: 'Bang',
                type: 'MeshInstance3D',
                props: {
                  mesh: 'box',
                  size: [0.13, 0.46, 0.13],
                  material: { color: '#ffd166', emissive: '#ffd166', emissiveIntensity: 1.8 },
                },
              },
            ],
          },
          {
            name: 'HeadTrack',
            type: 'BoneLookAt3D',
            props: { target: '../Body', bone: 'Head', lookAt: '../../Player', maxAngleDeg: 80 },
          },
          {
            name: 'TalkSfx',
            type: 'AudioPlayer',
            props: { preset: 'blip', volume: 0.5, pitch: 0.9 },
          },
          { name: 'AcceptSfx', type: 'AudioPlayer', props: { preset: 'coin', volume: 0.5 } },
        ],
      },
      ...wardSites.map((site, i) => ward(i + 1, site)),
      ...shadePacks.flatMap((p) => p.spots.map((s, j) => shade(p.ward, j + 1, s))),
      {
        name: 'Player',
        type: 'RigidBody3D',
        groups: ['player'],
        // Its Health is saveable, and a save is keyed by uid — minted, pasted,
        // and stable across regenerations for the same reason the HUD's are.
        uid: 'n_3cqocoi9v0cvoxdv',
        script: { name: 'Health', props: { max: 100, invulnerableFor: 0.8 } },
        props: {
          position: [round2(playerSpawn[0]), round2(playerSpawn[1] + 1.2), round2(playerSpawn[2])],
          fixedRotation: true,
          friction: 0,
          collider: { shape: 'capsule', radius: 0.34, height: 1 },
        },
        children: [
          {
            /*
             * An open terrain has an EDGE. With no catch, walking off it falls
             * forever — `incanto-playtest` calls that `fell` and treats it as a
             * failure whatever the game set out to be.
             */
            name: 'Catch',
            type: 'Respawn',
          },
          {
            name: 'Controller',
            type: 'CharacterController3D',
            props: {
              view: 'free',
              // The two `incanto-feel` prints a note about on every run, and the
              // 3D character skill calls coyote time the single biggest one.
              coyoteSeconds: 0.12,
              jumpBufferSeconds: 0.15,
              camDistance: 5.2,
              eyeHeight: 1.1,
              maxSpeed: 4.4,
              sprintMultiplier: 1.8,
              pitchMin: -0.5,
              pitchMax: 1.1,
              animations: {
                idle: '$anims/idle',
                walk: '$anims/walk',
                run: '$anims/run',
                fastRun: '$anims/runFast',
                airborne: '$anims/jump',
              },
            },
            script: { name: 'SwordStrike' },
          },
          {
            name: 'Skin',
            type: 'ModelInstance3D',
            props: {
              model: '$characters/base',
              targetHeight: 1.7,
              animation: '$anims/idle',
              castShadow: true,
              position: [0, -0.85, 0],
            },
          },
          {
            name: 'SwordMount',
            type: 'BoneAttachment3D',
            props: { target: '../Skin', bone: 'RightHand' },
            children: [
              {
                name: 'Blade',
                type: 'MeshInstance3D',
                props: {
                  mesh: 'box',
                  size: [0.045, 0.7, 0.045],
                  position: [0, 0.42, 0],
                  material: { color: '#d8dde8', metalness: 0.9, roughness: 0.25 },
                  castShadow: true,
                },
              },
              {
                name: 'Guard',
                type: 'MeshInstance3D',
                props: {
                  mesh: 'box',
                  size: [0.16, 0.04, 0.06],
                  position: [0, 0.09, 0],
                  material: { color: '#8a6d3a', metalness: 0.7, roughness: 0.4 },
                },
              },
              {
                name: 'SwordTip',
                type: 'Node3D',
                props: { position: [0, 0.78, 0] },
                children: [
                  {
                    name: 'SwingTrail',
                    type: 'Trail3D',
                    props: {
                      width: 0.26,
                      color: '#ffe9b0',
                      opacity: 0.9,
                      seconds: 0.25,
                      additive: true,
                      emitting: false,
                      minDistance: 0.02,
                    },
                  },
                ],
              },
            ],
          },
          {
            name: 'SwingSfx',
            type: 'AudioPlayer',
            props: { preset: 'shoot', volume: 0.35, pitch: 0.55 },
          },
          { name: 'HitSfx', type: 'AudioPlayer', props: { preset: 'hit', volume: 0.6 } },
        ],
      },
      {
        name: 'Sky',
        type: 'Node',
        script: {
          name: 'DayNight',
          props: { paused: true, startHour: 17.25, nightDarkness: 0.32, maxSunElevationDeg: 48 },
        },
      },
      {
        name: 'Boss',
        type: 'Node3D',
        groups: ['boss'],
        // PathFollow drives node.position in WORLD coords — the boss must be a
        // ROOT child (a positioned parent would double the offset on screen)
        props: {
          visible: false,
          snapToGround: false,
          position: [
            round2(keeperSite[0] + 16),
            round2(heightAt(keeperSite[0] + 16, keeperSite[2] - 14)),
            round2(keeperSite[2] - 14),
          ],
        },
        script: { name: 'PathFollow', props: { speed: 2.0, loop: false } },
        children: [
          {
            name: 'Body',
            type: 'MeshInstance3D',
            props: {
              mesh: 'capsule',
              size: [1.1, 2.6, 1.1],
              position: [0, 2.4, 0],
              material: {
                color: '#171130',
                emissive: '#41288f',
                emissiveIntensity: 0.7,
                roughness: 0.55,
              },
              castShadow: true,
            },
          },
          {
            name: 'Crown',
            type: 'MeshInstance3D',
            props: {
              mesh: 'gem',
              size: [1.0, 1.2, 1.0],
              position: [0, 4.6, 0],
              material: {
                color: '#0c0920',
                emissive: '#6b46c8',
                emissiveIntensity: 1.1,
                flatShading: true,
              },
              castShadow: true,
            },
          },
          {
            name: 'EyeL',
            type: 'MeshInstance3D',
            props: {
              mesh: 'sphere',
              size: [0.16, 0.16, 0.16],
              position: [-0.34, 4.4, 0.8],
              material: { color: '#ff2f6b', emissive: '#ff2f6b', emissiveIntensity: 4 },
            },
          },
          {
            name: 'EyeR',
            type: 'MeshInstance3D',
            props: {
              mesh: 'sphere',
              size: [0.16, 0.16, 0.16],
              position: [0.34, 4.4, 0.8],
              material: { color: '#ff2f6b', emissive: '#ff2f6b', emissiveIntensity: 4 },
            },
          },
          {
            name: 'ArmL',
            type: 'MeshInstance3D',
            props: {
              mesh: 'capsule',
              size: [0.4, 2.0, 0.4],
              position: [-1.5, 2.6, 0],
              rotation: [0, 0, 18],
              material: { color: '#171130', emissive: '#41288f', emissiveIntensity: 0.5 },
              castShadow: true,
            },
          },
          {
            name: 'ArmR',
            type: 'MeshInstance3D',
            props: {
              mesh: 'capsule',
              size: [0.4, 2.0, 0.4],
              position: [1.5, 2.6, 0],
              rotation: [0, 0, -18],
              material: { color: '#171130', emissive: '#41288f', emissiveIntensity: 0.5 },
              castShadow: true,
            },
          },
          {
            name: 'EyeGlow',
            type: 'OmniLight3D',
            props: { position: [0, 4.2, 0.6], color: '#b46bff', intensity: 0, range: 26 },
          },
          {
            name: 'Dread',
            type: 'Trail3D',
            props: {
              width: 1.2,
              color: '#6b46c8',
              opacity: 0.35,
              seconds: 0.8,
              additive: true,
              position: [0, 1.2, 0],
              emitting: false,
            },
          },
          {
            name: 'Fang',
            type: 'Area3D',
            props: {
              position: [0, 1.2, 0.8],
              collider: { shape: 'box', size: [2.4, 3.2, 2.2] },
            },
            script: {
              name: 'DamageOnContact',
              props: { amount: 35, targetGroup: 'player', oncePerTarget: false, repeatEvery: 1.5 },
            },
          },
          {
            name: 'RoarSfx',
            type: 'AudioPlayer',
            props: {
              preset: 'explosion',
              volume: 0.7,
              pitch: 0.35,
              spatial: true,
              refDistance: 10,
              maxDistance: 90,
            },
          },
        ],
      },
      {
        name: 'Camera',
        type: 'Camera3D',
        props: {
          current: true,
          far: 900,
          position: [keeperSite[0], keeperSite[1] + 6, keeperSite[2] + 14],
        },
      },
      { name: 'WinSfx', type: 'AudioPlayer', props: { preset: 'win', volume: 0.7 } },
      {
        name: 'HUD',
        type: 'HudLayer',
        children: [
          {
            name: 'Quest',
            type: 'UiText',
            // MINTED by newUid() and pasted, not invented: a save is keyed by
            // uid and this file is regenerated, so they have to be both
            // crypto-shaped and stable across `bun run world`.
            uid: 'n_3txwnq8m201xbwoz',
            props: {
              text: 'Find the lighthouse keeper [E]',
              size: 16,
              anchor: 'topLeft',
              shadow: true,
            },
          },
          {
            name: 'HP',
            type: 'UiBar',
            uid: 'n_vp09cmk3syxo2lcz',
            props: { anchor: 'topRight', value: 100, max: 100, width: 170 },
          },
          {
            name: 'Banner',
            type: 'UiBanner',
            uid: 'n_xwkphpoa7ac9w451',
            props: { anchor: 'center' },
          },
          {
            name: 'Dialogue',
            type: 'UiDialogue',
            uid: 'n_7wosfkulqmue3jpv',
            props: { anchor: 'bottom', charsPerSecond: 45 },
          },
          {
            name: 'Hint',
            type: 'UiText',
            uid: 'n_x3funbse7a8nkfnu',
            props: {
              text: 'WASD move · Shift sprint · E interact · click/F strike',
              size: 12,
              color: '#dddddd',
              anchor: 'bottomRight',
              shadow: true,
            },
          },
        ],
      },
    ],
  },
  connections: [
    { signal: 'interacted', from: 'Keeper', to: '/root', handler: 'onTalk' },
    { signal: 'died', from: 'Player', to: '/root', handler: 'onPlayerDown' },
  ],
};

/*
 * A REGENERATED file keeps the identities the old one had.
 *
 * A uid is the key a save is written against, and this script overwrites the
 * whole scene — so minting fresh ones every run would break every save on the
 * next `bun run world`, and emitting none at all (which is what it used to do)
 * left eighteen scripted nodes unkeyed, so a save could not record what the run
 * consumed. `verify:uids` said so; nothing said it to whoever ran the command.
 *
 * Reused by PATH: the same seed builds the same island, so the same node is at
 * the same place. Anything new gets a real `newUid()`.
 */
const scenePath = `${import.meta.dir}/src/game.scene.json`;
const previous = new Map<string, string>();
try {
  const old = JSON.parse(await Bun.file(scenePath).text()) as { root?: unknown };
  const remember = (node: Record<string, unknown>, path: string): void => {
    const here = `${path}/${String(node.name ?? '?')}`;
    if (typeof node.uid === 'string') previous.set(here, node.uid);
    for (const child of (node.children ?? []) as Record<string, unknown>[]) remember(child, here);
  };
  if (old.root) remember(old.root as Record<string, unknown>, '');
} catch {
  // No previous file: every uid below is minted fresh, which is the first run.
}

const keyIdentities = (node: Record<string, unknown>, path: string): void => {
  const here = `${path}/${String(node.name ?? '?')}`;
  // Only what a save would write down: a node carrying a behavior.
  if (node.script && typeof node.uid !== 'string') node.uid = previous.get(here) ?? newUid();
  else if (typeof node.uid === 'string' && previous.has(here))
    node.uid = previous.get(here) as string;
  for (const child of (node.children ?? []) as Record<string, unknown>[])
    keyIdentities(child, here);
};
keyIdentities(scene.root as unknown as Record<string, unknown>, '');

await Bun.write(scenePath, `${JSON.stringify(scene, null, 2)}\n`);
console.log(
  `beacon isle generated: keeper ${keeperSite.map(round2)}, wards ${wardSites.map((w) => w.map(round2)).join(' | ')}, ${placed} groves, ${grassPlaced} grass, ${flowersPlaced} flowers`,
);
