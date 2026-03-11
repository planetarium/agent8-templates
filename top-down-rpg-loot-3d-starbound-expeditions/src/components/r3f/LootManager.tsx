import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Object3D, Vector3, MeshStandardMaterial, Color } from 'three';
import { TerrainData, terrainUtil } from 'vibe-starter-3d-environment';
import { useLocalPlayerStore } from '../../stores/localPlayerStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useMiningStore } from '../../stores/miningStore';
import { useGameServer } from '@agent8/gameserver';
import { Clone, useGLTF } from '@react-three/drei';
import Assets from '../../assets.json';
import CollectEffect from './CollectEffect';

interface LootManagerProps {
  terrainData: TerrainData;
}

interface LootItem {
  id: string;
  slotIdx: number;
  position: Vector3;
  /** visual variant: 0 = default blue, 1 = green, 2 = purple */
  variant: 0 | 1 | 2;
  scale: number;
}

interface ActiveEffect {
  id: string;
  position: [number, number, number];
}

// ─── Spawn configuration ───────────────────────────────────────
// Player spawns near [0,0]. Crystals are scattered in rings around that point.
// Inner ring: radius 8-18, Outer ring: radius 18-35

/** Generate a single random spawn position (fully random each call) */
function randomSpawnPosition(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  // 2/3 chance inner ring, 1/3 chance outer ring
  const inner = Math.random() > 0.33;
  const minR = inner ? 6 : 18;
  const maxR = inner ? 18 : 35;
  const r = minR + Math.random() * (maxR - minR);
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

/** Generate initial pool of random spawn positions */
function generateInitialSlots(count: number): [number, number][] {
  return Array.from({ length: count }, () => randomSpawnPosition());
}

// How many crystals are live at one time
const MAX_ACTIVE = 20;
// Total pool of spawn positions (larger than MAX_ACTIVE for variety)
const SPAWN_SLOTS_INITIAL_COUNT = 40;
// Seconds before a collected crystal respawns
const RESPAWN_DELAY = 12;

// Variant colour palette
const VARIANT_COLORS: Array<{ emissive: string; glow: string }> = [
  { emissive: '#06b6d4', glow: '#67e8f9' }, // cyan
  { emissive: '#14b8a6', glow: '#5eead4' }, // teal
  { emissive: '#0ea5e9', glow: '#7dd3fc' }, // light blue
];

// Distance within which mining starts
const MINING_TRIGGER_RADIUS = 3.0;
// Distance beyond which mining is cancelled
const MINING_CANCEL_RADIUS = 4.5;
// Time in seconds to mine one crystal
const MINING_DURATION = 2.0;
// Minimum progress change to trigger store update (reduces re-renders)
const PROGRESS_UPDATE_THRESHOLD = 0.01;

// ─────────────────────────────────────────────
// CrystalItem – individual crystal mesh
// ─────────────────────────────────────────────
interface CrystalItemProps {
  loot: LootItem;
  isBeingMined: boolean;
}

const CrystalItem: React.FC<CrystalItemProps> = React.memo(({ loot, isBeingMined }) => {
  const crystalModel = useGLTF(Assets.objects.crystal.url);
  const matRef = useRef<MeshStandardMaterial | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(Math.random() * Math.PI * 2);
  const colors = VARIANT_COLORS[loot.variant];

  // One-time material clone per crystal instance
  const instanceMat = useMemo(() => {
    const m = new MeshStandardMaterial({
      color: new Color(colors.emissive),
      emissive: new Color(colors.emissive),
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    matRef.current = m;
    return m;
  }, [colors.emissive]);

  // Simple float + pulse via useFrame (no Float component = no extra overhead)
  useFrame((_, delta) => {
    const speed = isBeingMined ? 6 : 2;
    timeRef.current += delta * speed;
    if (matRef.current) {
      const pulse = 0.5 + Math.sin(timeRef.current) * 0.5;
      matRef.current.emissiveIntensity = isBeingMined ? 1.5 + pulse * 2.5 : 0.8 + pulse * 1.2;
    }
    // Simple float bob (no Math.random in frame loop)
    if (groupRef.current) {
      groupRef.current.position.y = loot.position.y + Math.sin(timeRef.current * 0.5) * 0.2;
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={loot.position}>
      <Clone
        object={crystalModel.scene}
        scale={loot.scale}
        onUpdate={(self) => {
          self.traverse((child: Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (!Array.isArray(mesh.material)) {
                if (!mesh.material.userData.variantApplied) {
                  mesh.material = instanceMat;
                  mesh.material.userData.variantApplied = true;
                }
              }
            }
          });
        }}
      />
    </group>
  );
});

CrystalItem.displayName = 'CrystalItem';

// ─────────────────────────────────────────────
// Helper – build a LootItem from a slot index
// ─────────────────────────────────────────────
function buildLootFromSlot(
  slotIdx: number,
  idSuffix: number,
  terrainData: TerrainData,
  spawnSlots: [number, number][],
): LootItem {
  const [sx, sz] = spawnSlots[slotIdx];
  const position = terrainUtil.calculatePositionOnTerrain(terrainData, [sx, sz], 0.5);
  return {
    id: `crystal_${idSuffix}`,
    slotIdx,
    position,
    variant: (Math.floor(Math.random() * 3)) as 0 | 1 | 2,
    scale: 1.0 + Math.random() * 0.5,
  };
}

// ─────────────────────────────────────────────
// LootManager
// ─────────────────────────────────────────────
const LootManager: React.FC<LootManagerProps> = ({ terrainData }) => {
  const playerPos = useLocalPlayerStore((s) => s.state.position);
  const collectStarShard = useInventoryStore((state) => state.collectCrystal);
  const { connected, server } = useGameServer();
  const { miningTargetId, miningProgress, startMining, setMiningProgress, stopMining } =
    useMiningStore();

  // ── ID counter to keep ids unique after respawn ──────────────
  const idCounterRef = useRef(SPAWN_SLOTS_INITIAL_COUNT);

  // ── Mining imperative refs (no React re-render overhead) ──────
  const miningTargetIdRef = useRef<string | null>(null);
  const miningProgressRef = useRef(0);
  const miningTimerRef = useRef(0);

  useEffect(() => { miningTargetIdRef.current = miningTargetId; }, [miningTargetId]);
  useEffect(() => { miningProgressRef.current = miningProgress; }, [miningProgress]);

  // ── Dynamic spawn slots pool (grows as new positions are generated) ──
  const spawnSlotsRef = useRef<[number, number][]>(generateInitialSlots(SPAWN_SLOTS_INITIAL_COUNT));

  // ── Initialise crystals from first MAX_ACTIVE slots ───────────
  const initialLoot: LootItem[] = useMemo(() => {
    return Array.from({ length: MAX_ACTIVE }, (_, i) =>
      buildLootFromSlot(i, i + 1, terrainData, spawnSlotsRef.current),
    );
  }, [terrainData]);

  const [activeLoot, setActiveLoot] = useState<LootItem[]>(initialLoot);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);

  // Ref copy of activeLoot for frame-level access (no stale closure)
  const activeLootRef = useRef<LootItem[]>(initialLoot);
  useEffect(() => { activeLootRef.current = activeLoot; }, [activeLoot]);

  // ── Respawn queue: {readyAt} ──────────────────────────────────
  const respawnQueueRef = useRef<Array<{ readyAt: number }>>([]);

  // ── Slot usage tracking (which spawnSlotsRef indices are active) ─
  const usedSlotsRef = useRef<Set<number>>(new Set(Array.from({ length: MAX_ACTIVE }, (_, i) => i)));

  // ── Collect handler ────────────────────────────────────────────
  const handleLootCollected = useCallback(
    async (id: string) => {
      const loot = activeLootRef.current.find((l) => l.id === id);
      if (!loot) return;

      setActiveLoot((prev) => prev.filter((l) => l.id !== id));
      setActiveEffects((prev) => [
        ...prev,
        { id, position: [loot.position.x, loot.position.y + 0.5, loot.position.z] },
      ]);

      collectStarShard(1);

      // Schedule respawn
      respawnQueueRef.current.push({ readyAt: performance.now() + RESPAWN_DELAY * 1000 });

      if (connected && server) {
        try {
          await server.remoteFunction('collectCrystal', [id]);
        } catch (err) {
          console.error('Failed to collect crystal on server', err);
        }
      }
    },
    [collectStarShard, connected, server],
  );

  // ── Effect complete ───────────────────────────────────────────
  const handleEffectComplete = useCallback((id: string) => {
    setActiveEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Per-frame: proximity + mining + respawn ───────────────────
  useFrame((_, delta) => {
    const pPos = playerPos;
    const loot = activeLootRef.current;
    const currentTarget = miningTargetIdRef.current;
    const now = performance.now();

    // ── 1. Respawn crystals whose timer has elapsed ─────────────
    const queue = respawnQueueRef.current;
    let i = 0;
    while (i < queue.length) {
      if (now >= queue[i].readyAt) {
        queue.splice(i, 1);

        // Append a brand-new random position as a new slot
        const newPos = randomSpawnPosition();
        spawnSlotsRef.current.push(newPos);
        const freeSlot = spawnSlotsRef.current.length - 1;

        usedSlotsRef.current.add(freeSlot);
        idCounterRef.current += 1;
        const newLoot = buildLootFromSlot(freeSlot, idCounterRef.current, terrainData, spawnSlotsRef.current);

        setActiveLoot((prev) => [...prev, newLoot]);
      } else {
        i++;
      }
    }

    // ── 2. Find closest crystal within trigger radius ───────────
    let closestId: string | null = null;
    let closestDist = Infinity;

    for (const item of loot) {
      const dx = item.position.x - pPos.x;
      const dz = item.position.z - pPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < MINING_TRIGGER_RADIUS && dist < closestDist) {
        closestDist = dist;
        closestId = item.id;
      }
    }

    // ── 3. Mining state machine ─────────────────────────────────
    if (currentTarget) {
      const targetLoot = loot.find((l) => l.id === currentTarget);

      if (!targetLoot) {
        stopMining();
        miningTargetIdRef.current = null;
        miningTimerRef.current = 0;
        return;
      }

      const dx = targetLoot.position.x - pPos.x;
      const dz = targetLoot.position.z - pPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > MINING_CANCEL_RADIUS) {
        stopMining();
        miningTargetIdRef.current = null;
        miningTimerRef.current = 0;
        return;
      }

      // Advance timer
      miningTimerRef.current += delta;
      const progress = Math.min(miningTimerRef.current / MINING_DURATION, 1);
      // Only update store when progress changes enough (reduces re-renders)
      if (Math.abs(progress - miningProgressRef.current) >= PROGRESS_UPDATE_THRESHOLD || progress >= 1) {
        setMiningProgress(progress);
        miningProgressRef.current = progress;
      }

      if (progress >= 1) {
        const collected = currentTarget;

        // Free the slot directly using stored slotIdx
        usedSlotsRef.current.delete(targetLoot.slotIdx);

        stopMining();
        miningTargetIdRef.current = null;
        miningTimerRef.current = 0;
        handleLootCollected(collected);
      }
    } else if (closestId) {
      startMining(closestId);
      miningTargetIdRef.current = closestId;
      miningTimerRef.current = 0;
    }
  });

  return (
    <>
      {activeLoot.map((loot) => (
        <CrystalItem
          key={loot.id}
          loot={loot}
          isBeingMined={miningTargetId === loot.id}
        />
      ))}
      {activeEffects.map((effect) => (
        <CollectEffect
          key={effect.id}
          position={effect.position}
          onComplete={() => handleEffectComplete(effect.id)}
        />
      ))}
    </>
  );
};

export default LootManager;
