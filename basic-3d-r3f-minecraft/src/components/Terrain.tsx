import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import assets from '../assets.json';
import { VOXEL } from '../config';
import { builder, player, world } from '../game/state';
import { MATERIALS, activeChunks, buildChunkMesh, chunkOf, parseChunkKey, type ChunkKey, type MaterialSlot } from '../game/voxel';

/** New chunks meshed per frame after the first one, so crossing a chunk border never stalls a frame. */
const BUILDS_PER_FRAME = 2;
/** Water surface (visual only; the Incanto template's water level). */
const WATER_Y = 10.5;

/** Shown until the textures arrive. */
const FALLBACK: Record<MaterialSlot, string> = { grassTop: '#6aa84f', grassSide: '#7a6a3a', dirt: '#8b5a2b', stone: '#8a8a8a' };

function loadTexture(url: string, cell?: number[], grid = 1) {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapLinearFilter;
  if (cell) {
    const [row, col] = cell;
    t.repeat.set(1 / grid, 1 / grid);
    t.offset.set(col / grid, 1 - (row + 1) / grid);
  }
  return t;
}

/** One material per slot in MATERIALS order: grass top, grass side, dirt, stone. */
function useBlockMaterials() {
  const materials = useMemo(
    () => MATERIALS.map((slot) => new THREE.MeshLambertMaterial({ color: FALLBACK[slot] })),
    [],
  );
  useEffect(() => {
    const tiles = assets.textures['blocks/tiles'];
    const maps: Record<MaterialSlot, THREE.Texture> = {
      grassTop: loadTexture(assets.textures['blocks/grass'].url),
      grassSide: loadTexture(tiles.url, tiles.cells.grassSide, tiles.grid),
      dirt: loadTexture(assets.textures['blocks/dirt'].url),
      stone: loadTexture(tiles.url, tiles.cells.stone, tiles.grid),
    };
    MATERIALS.forEach((slot, i) => {
      materials[i].map = maps[slot];
      materials[i].color.set('#ffffff');
      materials[i].needsUpdate = true;
    });
    return () => {
      Object.values(maps).forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
    };
  }, [materials]);
  return materials;
}

function chunkGeometry(cx: number, cz: number) {
  const m = buildChunkMesh(world, cx, cz);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(m.uvs, 2));
  g.setIndex(m.indices);
  for (const gr of m.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
  g.computeBoundingSphere();
  return g;
}

/**
 * Chunk meshes: only chunks within VOXEL.activeRadius of the player's chunk
 * exist. Entering a new chunk adds / drops chunks at the edge; an edit
 * rebuilds only the chunks in `builder.dirty`.
 */
function Chunks() {
  const group = useRef<THREE.Group>(null);
  const materials = useBlockMaterials();
  const state = useMemo(() => ({ meshes: new Map<ChunkKey, THREE.Mesh>(), queue: [] as ChunkKey[], center: '' }), []);

  useEffect(() => {
    // dev server only: `game.chunks` in the console lists the meshed chunks
    if (import.meta.env.DEV) Object.assign((window as unknown as { game: object }).game, { chunks: state.meshes });
    return () => {
      for (const m of state.meshes.values()) m.geometry.dispose();
      state.meshes.clear();
    };
  }, [state]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const cx = chunkOf(player.pos.x);
    const cz = chunkOf(player.pos.z);
    const center = `${cx},${cz}`;
    const first = state.center === '';
    if (center !== state.center) {
      state.center = center;
      const wanted = new Set(activeChunks(world, cx, cz));
      for (const [key, mesh] of state.meshes) {
        if (wanted.has(key)) continue;
        g.remove(mesh);
        mesh.geometry.dispose();
        state.meshes.delete(key);
      }
      // nearest first
      state.queue = [...wanted]
        .filter((k) => !state.meshes.has(k))
        .sort((a, b) => {
          const [ax, az] = parseChunkKey(a);
          const [bx, bz] = parseChunkKey(b);
          return (ax - cx) ** 2 + (az - cz) ** 2 - ((bx - cx) ** 2 + (bz - cz) ** 2);
        });
    }

    // edits: rebuild the touched chunks that are on screen; others are rebuilt when they become active
    for (const key of builder.dirty) {
      const mesh = state.meshes.get(key);
      if (!mesh) continue;
      const [x, z] = parseChunkKey(key);
      mesh.geometry.dispose();
      mesh.geometry = chunkGeometry(x, z);
    }
    builder.dirty.clear();

    let budget = first ? Infinity : BUILDS_PER_FRAME;
    while (budget-- > 0 && state.queue.length > 0) {
      const key = state.queue.shift()!;
      if (state.meshes.has(key)) continue;
      const [x, z] = parseChunkKey(key);
      const mesh = new THREE.Mesh(chunkGeometry(x, z), materials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `chunk ${key}`;
      g.add(mesh);
      state.meshes.set(key, mesh);
    }
  });

  return <group ref={group} />;
}

/** Sun that follows the player so the shadow camera can stay small. */
function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useEffect(() => {
    const l = sun.current;
    if (!l) return;
    scene.add(l.target);
    return () => {
      scene.remove(l.target);
    };
  }, [scene]);
  useFrame(() => {
    const l = sun.current;
    if (!l) return;
    const p = player.pos;
    l.position.set(p.x + 10, p.y + 20, p.z + 8);
    l.target.position.set(p.x, p.y, p.z);
  });
  return (
    <>
      <hemisphereLight args={['#dceeff', '#6b5a43', 1.1]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2}
        color="#fff3dc"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
    </>
  );
}

/** Sky, fog (hides the edge of the active chunks), lights, water and the voxel chunks. */
export function Terrain() {
  const fogFar = VOXEL.activeRadius * VOXEL.chunk + 8;
  return (
    <>
      <Sky sunPosition={[100, 40, 80]} turbidity={4} rayleigh={1.2} />
      <fog attach="fog" args={['#cfe3f5', fogFar * 0.45, fogFar]} />
      <Lights />
      <mesh position={[0, WATER_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[VOXEL.size, VOXEL.size]} />
        <meshLambertMaterial color="#3f8fd8" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <Chunks />
    </>
  );
}
