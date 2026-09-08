/**
 * Emberwood VILLAGE dressing generator — run `bun generate-dressing.ts` after
 * editing, output goes into src/village.scene.json (formatted by biome).
 *
 * The gameplay layer (Elder, Player, HUD, GroveGate, connections, input) is
 * PRESERVED verbatim from the existing scene file; only `environment` and the
 * purely-visual `Village` subtree are rebuilt. Behaviors never reach into
 * `Village/**`, so the whole subtree is free to regenerate — that's the
 * template's dressing workflow: tweak a number here, re-run, reload.
 *
 * Everything is engine-primitive built (MeshInstance3D boxes/cylinders/gems,
 * Tree3D, Foliage3D, Flowers3D, InstancedMesh3D) — no external assets, so the
 * whole look survives `incanto-new` scaffolding offline.
 */
import { readFileSync, writeFileSync } from 'node:fs';

type Json = Record<string, unknown>;
type NodeJson = {
  name: string;
  type: string;
  props?: Json;
  children?: NodeJson[];
  groups?: string[];
};

// ---- tiny builders ----------------------------------------------------------------

const round2 = (n: number): number => Math.round(n * 100) / 100;

function mesh(
  name: string,
  shape: 'box' | 'cylinder' | 'gem' | 'sphere',
  size: number[],
  material: Json,
  props: Json = {},
): NodeJson {
  return {
    name,
    type: 'MeshInstance3D',
    props: {
      mesh: shape,
      size: size.map(round2),
      material,
      castShadow: true,
      receiveShadow: true,
      ...props,
    },
  };
}

// palette — warm late-afternoon timber village
const TIMBER = { color: '#54402c', roughness: 0.85 };
const TIMBER_LIGHT = { color: '#6b533a', roughness: 0.85 };
const STONE = { color: '#8d939c', roughness: 0.95, flatShading: true };
const PATH_DIRT = '#9b8459';
const WINDOW_GLOW = {
  color: '#3a2c1c',
  emissive: '#ffc46e',
  emissiveIntensity: 1.7,
  roughness: 0.4,
};
const LANTERN_GLOW = {
  color: '#8a5a20',
  emissive: '#ffb84f',
  emissiveIntensity: 2.8,
  roughness: 0.3,
};

/**
 * A timber-framed cottage: plaster walls, corner posts + cross beams, a door
 * with a step, warm emissive windows, two-slab gabled roof with ridge beam,
 * chimney with drifting smoke. `door` picks which face looks at the path.
 */
function house(
  name: string,
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
  opts: {
    yaw?: number;
    plaster?: string;
    roof?: string;
    door?: 'north' | 'south' | 'east' | 'west';
  },
): NodeJson {
  const plaster = opts.plaster ?? '#d8c9a8';
  const roofColor = opts.roof ?? '#b06a45';
  const yaw = opts.yaw ?? 0;
  const rise = Math.min(1.7, d * 0.34);
  const overhang = 0.45;
  const halfSpan = d / 2 + overhang;
  const slabLen = Math.hypot(halfSpan, rise);
  const pitchDeg = (Math.atan2(rise, halfSpan) * 180) / Math.PI;

  const children: NodeJson[] = [
    mesh('Walls', 'box', [w, h, d], { color: plaster, roughness: 0.9 }),
    // stepped gable fill under the ridge (the slab overhang hides the steps)
    mesh(
      'Gable',
      'box',
      [w, rise, d * 0.56],
      { color: plaster, roughness: 0.9 },
      {
        position: [0, h / 2 + rise / 2, 0],
      },
    ),
  ];

  // corner posts + top beams (the timber frame that sells the silhouette)
  for (const [sx, sz] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const) {
    children.push(
      mesh(`Post${sx > 0 ? 'E' : 'W'}${sz > 0 ? 'S' : 'N'}`, 'box', [0.24, h, 0.24], TIMBER, {
        position: [sx * (w / 2 - 0.01), 0, sz * (d / 2 - 0.01)],
      }),
    );
  }
  for (const sz of [-1, 1] as const) {
    children.push(
      mesh(`Beam${sz > 0 ? 'S' : 'N'}`, 'box', [w + 0.06, 0.22, 0.26], TIMBER, {
        position: [0, h / 2 - 0.11, sz * (d / 2 - 0.02)],
      }),
    );
  }

  // roof: two tilted slabs + ridge, gables on ±x
  for (const s of [-1, 1] as const) {
    children.push(
      mesh(
        s > 0 ? 'RoofS' : 'RoofN',
        'box',
        [w + 0.9, 0.16, slabLen + 0.15],
        {
          color: roofColor,
          roughness: 0.85,
          flatShading: true,
        },
        {
          position: [0, h / 2 + rise / 2, (s * halfSpan) / 2],
          rotation: [-s * pitchDeg, 0, 0],
        },
      ),
    );
  }
  children.push(
    mesh('Ridge', 'box', [w + 1.0, 0.2, 0.3], TIMBER, { position: [0, h / 2 + rise + 0.02, 0] }),
  );

  // chimney + smoke — the village is ALIVE
  children.push(
    mesh('Chimney', 'box', [0.55, rise + 1.1, 0.55], STONE, {
      position: [w / 2 - 0.8, h / 2 + (rise + 1.1) / 2 - 0.2, d * 0.18],
    }),
    {
      name: 'Smoke',
      type: 'Particles3D',
      props: {
        position: [w / 2 - 0.8, h / 2 + rise + 1.05, d * 0.18],
        rate: 3.5,
        lifetime: [1.6, 2.6],
        speed: [6, 14],
        directionDeg: -90,
        spreadDeg: 16,
        gravity: [4, -6], // drift with the wind, keep rising
        sizeStart: 12,
        sizeEnd: 34,
        colorStart: '#c9c4bc',
        colorEnd: '#9aa0a8',
        alphaStart: 0.3,
        alphaEnd: 0,
        blend: 'normal',
        maxParticles: 32,
      },
    },
  );

  // door + step + windows on the path-facing side
  const face = opts.door ?? 'south';
  const axis = face === 'north' || face === 'south' ? 'z' : 'x';
  const sign = face === 'south' || face === 'east' ? 1 : -1;
  const facePos = (off: number, lateral: number, y: number): number[] =>
    axis === 'z' ? [lateral, y, sign * (d / 2 + off)] : [sign * (w / 2 + off), y, lateral];
  const faceRot = axis === 'z' ? [0, 0, 0] : [0, 90, 0];
  const doorY = -h / 2 + 1.05;
  children.push(
    mesh('DoorFrame', 'box', [1.16, 2.26, 0.1], TIMBER, {
      position: facePos(0.02, 0.9, doorY + 0.05),
      rotation: faceRot,
    }),
    mesh('Door', 'box', [0.92, 2.05, 0.12], TIMBER_LIGHT, {
      position: facePos(0.06, 0.9, doorY),
      rotation: faceRot,
    }),
    mesh('Step', 'box', [1.3, 0.16, 0.7], STONE, {
      position: facePos(0.36, 0.9, -h / 2 + 0.08),
      rotation: faceRot,
    }),
  );
  for (const [i, lat] of [-0.95, -2.0].entries()) {
    children.push(
      mesh(`WindowTrim${i + 1}`, 'box', [0.94, 1.04, 0.08], TIMBER, {
        position: facePos(0.02, lat, 0.28),
        rotation: faceRot,
      }),
      mesh(`Window${i + 1}`, 'box', [0.74, 0.84, 0.1], WINDOW_GLOW, {
        position: facePos(0.05, lat, 0.28),
        rotation: faceRot,
      }),
    );
  }

  return {
    name,
    type: 'StaticBody3D',
    props: {
      collider: { shape: 'box', size: [w, h, d] },
      position: [x, h / 2, z],
      ...(yaw ? { rotation: [0, yaw, 0] } : {}),
    },
    children,
  };
}

/** A lamp post with a hanging glow-gem — pairs with bloom + one OmniLight3D. */
function lantern(name: string, x: number, z: number, yaw = 0): NodeJson {
  return {
    name,
    type: 'Node3D',
    props: { position: [x, 0, z], rotation: [0, yaw, 0] },
    children: [
      mesh('Post', 'box', [0.16, 2.3, 0.16], TIMBER, { position: [0, 1.15, 0] }),
      mesh('Arm', 'box', [0.62, 0.12, 0.12], TIMBER, { position: [0.26, 2.24, 0] }),
      mesh(
        'Cage',
        'box',
        [0.3, 0.4, 0.3],
        { color: '#3c3228', roughness: 0.6 },
        {
          position: [0.5, 2.0, 0],
        },
      ),
      mesh('Glow', 'gem', [0.16, 0.22, 0.16], LANTERN_GLOW, {
        position: [0.5, 2.0, 0],
        props: undefined,
        castShadow: false,
      }),
    ],
  };
}

/** Barrel: staved cylinder + two dark hoops. */
function barrel(name: string, x: number, z: number): NodeJson {
  return {
    name,
    type: 'Node3D',
    props: { position: [x, 0, z] },
    children: [
      mesh(
        'Body',
        'cylinder',
        [0.34, 0.78, 0.34],
        { color: '#7a5c3c', roughness: 0.9 },
        {
          position: [0, 0.39, 0],
        },
      ),
      mesh(
        'HoopTop',
        'cylinder',
        [0.36, 0.06, 0.36],
        { color: '#3a332c', roughness: 0.5, metalness: 0.6 },
        {
          position: [0, 0.62, 0],
          castShadow: false,
        },
      ),
      mesh(
        'HoopBottom',
        'cylinder',
        [0.36, 0.06, 0.36],
        { color: '#3a332c', roughness: 0.5, metalness: 0.6 },
        {
          position: [0, 0.18, 0],
          castShadow: false,
        },
      ),
    ],
  };
}

function crate(name: string, x: number, z: number, s: number, yaw: number): NodeJson {
  return mesh(
    name,
    'box',
    [s, s, s],
    { color: '#9c7c50', roughness: 0.9, flatShading: true },
    {
      position: [x, s / 2, z],
      rotation: [0, yaw, 0],
    },
  );
}

// ---- assemble the Village subtree ---------------------------------------------------

const villageChildren: NodeJson[] = [];

// ground: meadow green with a receiving floor collider
villageChildren.push({
  name: 'Floor',
  type: 'StaticBody3D',
  props: { collider: { shape: 'box', size: [64, 0.1, 64] }, position: [0, -0.05, 0] },
  children: [
    mesh('Grass', 'box', [64, 0.1, 64], { color: '#57713f', roughness: 1 }, { castShadow: false }),
  ],
});

// packed-dirt path + plaza + edge pebbles
villageChildren.push(
  mesh(
    'Path',
    'box',
    [3, 0.12, 40],
    { color: PATH_DIRT, roughness: 1 },
    {
      position: [0, 0.01, -4],
      castShadow: false,
    },
  ),
  mesh(
    'Plaza',
    'cylinder',
    [5.4, 0.12, 5.4],
    { color: '#a68d63', roughness: 1 },
    {
      position: [1.5, 0.015, 6],
      castShadow: false,
    },
  ),
);
{
  const pebbles: number[][] = [];
  let n = 0;
  for (let z = -24; z <= -2; z += 1.6) {
    for (const side of [-1, 1]) {
      const jitter = Math.sin(z * 12.9898 + side * 78.233) * 0.35;
      pebbles.push([
        side * (1.75 + Math.abs(jitter) * 0.4),
        0.05,
        z + jitter,
        (z * 37 + n * 61) % 360,
        0.8 + ((n * 7) % 5) * 0.12,
      ]);
      n++;
    }
  }
  villageChildren.push({
    name: 'PathStones',
    type: 'InstancedMesh3D',
    props: {
      mesh: 'gem',
      size: [0.11, 0.07, 0.09],
      material: { color: '#8d939c', roughness: 0.95, flatShading: true },
      transforms: pebbles.map((r) => r.map(round2)),
      receiveShadow: true,
    },
  });
}

// cottages — two collidable originals + three background ones closing the square
villageChildren.push(
  house('House1', -10, 2, 6, 3.4, 5, { plaster: '#d8c9a8', roof: '#b06a45', door: 'east', yaw: 8 }),
  house('House2', 11, -2, 5, 3, 6, { plaster: '#cfc2a2', roof: '#8a4f38', door: 'west', yaw: -6 }),
  house('House3', -13, -13, 5.4, 3.1, 5, {
    plaster: '#e0d2b4',
    roof: '#6a6f7a',
    door: 'east',
    yaw: 24,
  }),
  house('House4', 13, -14, 4.6, 2.9, 5.2, {
    plaster: '#d3c5a5',
    roof: '#a05a3c',
    door: 'west',
    yaw: -18,
  }),
  house('House5', -3, 17, 6.2, 3.4, 5.4, {
    plaster: '#dccdae',
    roof: '#7a4534',
    door: 'north',
    yaw: 3,
  }),
);

// the well — stone ring, twin posts, tiny gabled cap, crossbar + bucket
villageChildren.push({
  name: 'Well',
  type: 'StaticBody3D',
  props: { collider: { shape: 'box', size: [2.2, 1, 2.2] }, position: [5, 0.5, 8] },
  children: [
    mesh('Ring', 'cylinder', [0.95, 1, 0.95], STONE),
    mesh(
      'Rim',
      'cylinder',
      [1.05, 0.14, 1.05],
      { color: '#7a808a', roughness: 0.95, flatShading: true },
      {
        position: [0, 0.55, 0],
      },
    ),
    mesh('PostW', 'box', [0.14, 1.7, 0.14], TIMBER, { position: [-0.95, 0.85, 0] }),
    mesh('PostE', 'box', [0.14, 1.7, 0.14], TIMBER, { position: [0.95, 0.85, 0] }),
    mesh(
      'CapN',
      'box',
      [2.5, 0.1, 0.95],
      { color: '#8a4f38', roughness: 0.85, flatShading: true },
      {
        position: [0, 1.85, -0.38],
        rotation: [32, 0, 0],
      },
    ),
    mesh(
      'CapS',
      'box',
      [2.5, 0.1, 0.95],
      { color: '#8a4f38', roughness: 0.85, flatShading: true },
      {
        position: [0, 1.85, 0.38],
        rotation: [-32, 0, 0],
      },
    ),
    mesh('Crossbar', 'cylinder', [0.06, 2.0, 0.06], TIMBER_LIGHT, {
      position: [0, 1.45, 0],
      rotation: [0, 0, 90],
    }),
    mesh('Bucket', 'cylinder', [0.18, 0.26, 0.18], TIMBER_LIGHT, { position: [0.3, 0.95, 0] }),
  ],
});

// gate — posts, beam, braces, a lantern each side
villageChildren.push(
  {
    name: 'GatePostL',
    type: 'StaticBody3D',
    props: { collider: { shape: 'box', size: [0.8, 4, 0.8] }, position: [-2.4, 2, -26] },
    children: [
      mesh('Post', 'box', [0.8, 4, 0.8], TIMBER),
      mesh('Brace', 'box', [0.24, 1.5, 0.24], TIMBER_LIGHT, {
        position: [0.55, 1.45, 0],
        rotation: [0, 0, -38],
      }),
    ],
  },
  {
    name: 'GatePostR',
    type: 'StaticBody3D',
    props: { collider: { shape: 'box', size: [0.8, 4, 0.8] }, position: [2.4, 2, -26] },
    children: [
      mesh('Post', 'box', [0.8, 4, 0.8], TIMBER),
      mesh('Brace', 'box', [0.24, 1.5, 0.24], TIMBER_LIGHT, {
        position: [-0.55, 1.45, 0],
        rotation: [0, 0, 38],
      }),
    ],
  },
  mesh('GateBeam', 'box', [6.4, 0.7, 0.9], TIMBER, { position: [0, 4.1, -26] }),
  mesh(
    'GateCap',
    'box',
    [7.2, 0.22, 1.2],
    { color: '#8a4f38', roughness: 0.85, flatShading: true },
    {
      position: [0, 4.55, -26],
    },
  ),
  lantern('GateLampL', -3.2, -25.2, 40),
  lantern('GateLampR', 3.2, -25.2, 140),
);

// fence lines flanking the path (posts instanced, rails as two long boxes each side)
{
  const posts: number[][] = [];
  for (const side of [-1, 1]) {
    for (let z = -23; z <= -8; z += 1.7) {
      posts.push([side * 2.6, 0.5, z, side * 4, 1]);
    }
  }
  villageChildren.push({
    name: 'FencePosts',
    type: 'InstancedMesh3D',
    props: {
      mesh: 'box',
      size: [0.14, 1.0, 0.14],
      material: { color: '#6b533a', roughness: 0.9 },
      transforms: posts.map((r) => r.map(round2)),
      castShadow: true,
    },
  });
  for (const side of [-1, 1]) {
    for (const [i, y] of [0.42, 0.78].entries()) {
      villageChildren.push(
        mesh(
          `FenceRail${side > 0 ? 'E' : 'W'}${i + 1}`,
          'box',
          [0.07, 0.1, 15.4],
          {
            color: '#755c40',
            roughness: 0.9,
          },
          { position: [side * 2.6, y, -15.5] },
        ),
      );
    }
  }
}

// square dressing: lamp posts, market stall, barrels, crates
villageChildren.push(
  lantern('Lamp1', -2.6, 3.4, -30),
  lantern('Lamp2', 4.2, 12.6, 150),
  lantern('Lamp3', -3.4, -7.5, -90),
  {
    name: 'Stall',
    type: 'Node3D',
    props: { position: [-4.6, 0, 8.6], rotation: [0, 18, 0] },
    children: [
      mesh('Counter', 'box', [2.6, 0.9, 1.1], TIMBER_LIGHT, { position: [0, 0.45, 0] }),
      mesh(
        'Top',
        'box',
        [2.7, 0.08, 1.2],
        { color: '#8a6a44', roughness: 0.85 },
        {
          position: [0, 0.93, 0],
        },
      ),
      mesh('PoleW', 'box', [0.1, 2.2, 0.1], TIMBER, { position: [-1.2, 1.1, -0.45] }),
      mesh('PoleE', 'box', [0.1, 2.2, 0.1], TIMBER, { position: [1.2, 1.1, -0.45] }),
      mesh(
        'Canopy',
        'box',
        [2.9, 0.06, 1.9],
        { color: '#a33d34', roughness: 0.8 },
        {
          position: [0, 2.18, 0.25],
          rotation: [-12, 0, 0],
          castShadow: true,
        },
      ),
      mesh(
        'CanopyStripe',
        'box',
        [2.92, 0.061, 0.5],
        { color: '#e8ddc4', roughness: 0.8 },
        {
          position: [0, 2.181, 0.25],
          rotation: [-12, 0, 0],
          castShadow: false,
        },
      ),
      mesh(
        'Goods1',
        'sphere',
        [0.16, 0.16, 0.16],
        { color: '#c8542e', roughness: 0.6 },
        {
          position: [-0.5, 1.06, 0.1],
          castShadow: false,
        },
      ),
      mesh(
        'Goods2',
        'sphere',
        [0.14, 0.14, 0.14],
        { color: '#d9a032', roughness: 0.6 },
        {
          position: [-0.16, 1.04, -0.2],
          castShadow: false,
        },
      ),
      mesh(
        'Goods3',
        'sphere',
        [0.15, 0.15, 0.15],
        { color: '#7ba03a', roughness: 0.6 },
        {
          position: [0.2, 1.05, 0.14],
          castShadow: false,
        },
      ),
    ],
  },
  barrel('Barrel1', -7.2, 4.2),
  barrel('Barrel2', -6.6, 4.9),
  barrel('Barrel3', 8.9, -4.6),
  crate('Crate1', 8.2, -5.4, 0.62, 14),
  crate('Crate2', 8.5, -4.5, 0.5, -8),
  crate('Crate3', -7.0, 5.8, 0.55, 32),
);

// meadow grass + flower beds (flat ground: fields sit at y = 0 — no terrain, no drape)
const grassField = (
  name: string,
  x: number,
  z: number,
  ax: number,
  az: number,
  seed: number,
): NodeJson => ({
  name,
  type: 'Foliage3D',
  props: {
    kind: 'grass',
    style: 'mesh',
    position: [x, 0, z],
    area: [ax, az],
    density: 9,
    height: 0.22,
    coverage: 0.78,
    seed,
  },
});
villageChildren.push(
  grassField('MeadowW', -17, -2, 26, 34, 101),
  grassField('MeadowE', 18, -1, 24, 34, 202),
  grassField('MeadowN', 2, 21, 42, 16, 303),
  grassField('MeadowGate', 0, -21.5, 30, 12, 404),
  {
    name: 'FlowersWell',
    type: 'Flowers3D',
    props: {
      position: [6.8, 0, 9.6],
      area: [2.6, 2.2],
      density: 'lush',
      seed: 7,
      palette: ['#e4572e', '#f3a712', '#ffffff'],
    },
  },
  {
    name: 'FlowersH1',
    type: 'Flowers3D',
    props: {
      position: [-9.4, 0, 5.6],
      area: [3.4, 1.4],
      density: 'lush',
      seed: 17,
      palette: ['#a26bd4', '#ffffff', '#f3a712'],
    },
  },
  {
    name: 'FlowersH2',
    type: 'Flowers3D',
    props: {
      position: [8.2, -0, -0.4],
      area: [3, 1.3],
      density: 'lush',
      seed: 27,
      palette: ['#e4572e', '#ffffff'],
    },
  },
  {
    name: 'FlowersGate',
    type: 'Flowers3D',
    props: {
      position: [-4.4, 0, -24.4],
      area: [2.4, 1.6],
      density: 'lush',
      seed: 37,
      palette: ['#f3a712', '#a26bd4'],
    },
  },
);

// trees — broadleaf oaks by the square, mixed perimeter treeline, bushes at houses
villageChildren.push(
  {
    name: 'Oak1',
    type: 'Tree3D',
    props: { position: [-16, 0, -10], type: 'broadleaf', seed: 11, scale: [1.2, 1.2, 1.2] },
  },
  { name: 'Oak2', type: 'Tree3D', props: { position: [17, 0, 6], type: 'broadleaf', seed: 23 } },
  { name: 'Oak3', type: 'Tree3D', props: { position: [-14, 0, 14], type: 'broadleaf', seed: 31 } },
  {
    name: 'Oak4',
    type: 'Tree3D',
    props: { position: [14, 0, -14], type: 'broadleaf', seed: 47, scale: [1.35, 1.35, 1.35] },
  },
  {
    name: 'TreelineW',
    type: 'Tree3D',
    props: { position: [-27, 0, -4], type: 'conifer', count: 7, area: [8, 40], seed: 61 },
  },
  {
    name: 'TreelineE',
    type: 'Tree3D',
    props: { position: [27, 0, -2], type: 'conifer', count: 7, area: [8, 40], seed: 71 },
  },
  {
    name: 'TreelineN',
    type: 'Tree3D',
    props: { position: [4, 0, 27], type: 'broadleaf', count: 6, area: [40, 7], seed: 81 },
  },
  {
    name: 'TreelineGate',
    type: 'Tree3D',
    props: { position: [-14, 0, -27], type: 'conifer', count: 4, area: [22, 6], seed: 91 },
  },
  {
    name: 'TreelineGateE',
    type: 'Tree3D',
    props: { position: [14, 0, -27], type: 'conifer', count: 4, area: [20, 6], seed: 95 },
  },
  { name: 'Bush1', type: 'Tree3D', props: { position: [-7.4, 0, 0.4], type: 'bush', seed: 5 } },
  { name: 'Bush2', type: 'Tree3D', props: { position: [9.2, 0, 1.8], type: 'bush', seed: 15 } },
  { name: 'Bush3', type: 'Tree3D', props: { position: [1.6, 0, -24.2], type: 'bush', seed: 25 } },
);

// light rig: the warm sun + one omni fill at the square (lantern glow anchor)
villageChildren.push(
  {
    name: 'Sun',
    type: 'DirectionalLight3D',
    props: {
      position: [7, 30, 22],
      intensity: 2.4,
      color: '#ffe2b8',
      castShadow: true,
      shadowArea: 56,
    },
  },
  {
    name: 'SquareGlow',
    type: 'OmniLight3D',
    props: { position: [1.5, 2.6, 6], color: '#ffc98a', intensity: 14, range: 16 },
  },
);

// ---- splice into the hand-authored scene -------------------------------------------

const scenePath = new URL('src/village.scene.json', import.meta.url).pathname;
const scene = JSON.parse(readFileSync(scenePath, 'utf8'));

scene.environment = {
  sky: { type: 'atmosphere', elevationDeg: 38, azimuthDeg: 8, turbidity: 2.0, rayleigh: 1.2 },
  fog: { near: 55, far: 190 },
  shadows: { mapSize: 2048, radius: 1.1 },
  exposure: 1.0,
  ambient: { color: '#e8d5c0', intensity: 0.52 },
  iblIntensity: 0.65,
  bloom: { threshold: 1.35, strength: 0.4 },
  post: { vignette: 0.22, saturation: 1.1, contrast: 1.03 },
};

const game = scene.root;
const village = (game.children as NodeJson[]).find((c) => c.name === 'Village');
if (!village) throw new Error('Village node not found');
village.children = villageChildren;
// chimney smoke is a render-hook Particles3D — a static wrapper would freeze
// it after one frame (auditScene flags exactly this), so the village stays live
if (village.props) delete (village.props as Record<string, unknown>).static;

writeFileSync(scenePath, `${JSON.stringify(scene, null, 2)}\n`);
console.log(`village dressed: ${villageChildren.length} top-level nodes`);
