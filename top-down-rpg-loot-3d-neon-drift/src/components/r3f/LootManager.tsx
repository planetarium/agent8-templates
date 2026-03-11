import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Object3D, Vector3, MeshStandardMaterial, Color } from 'three';
import { TerrainData, terrainUtil } from 'vibe-starter-3d-environment';
import { useLocalPlayerStore } from '../../stores/localPlayerStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useHackingStore } from '../../stores/miningStore';
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
  variant: 0 | 1 | 2;
  scale: number;
}

interface ActiveEffect {
  id: string;
  position: [number, number, number];
}

function randomSpawnPosition(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const inner = Math.random() > 0.33;
  const minR = inner ? 6 : 18;
  const maxR = inner ? 18 : 35;
  const r = minR + Math.random() * (maxR - minR);
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function generateInitialSlots(count: number): [number, number][] {
  return Array.from({ length: count }, () => randomSpawnPosition());
}

const MAX_ACTIVE = 20;
const SPAWN_SLOTS_INITIAL_COUNT = 40;
const RESPAWN_DELAY = 12;

const VARIANT_COLORS: Array<{ emissive: string; glow: string }> = [
  { emissive: '#ff00ff', glow: '#ff66ff' },
  { emissive: '#00ffff', glow: '#66ffff' },
  { emissive: '#8800ff', glow: '#bb66ff' },
];

const HACKING_TRIGGER_RADIUS = 3.0;
const HACKING_CANCEL_RADIUS = 4.5;
const HACKING_DURATION = 2.0;
const PROGRESS_UPDATE_THRESHOLD = 0.01;

interface DataGemItemProps {
  loot: LootItem;
  isBeingHacked: boolean;
}

const DataGemItem: React.FC<DataGemItemProps> = React.memo(({ loot, isBeingHacked }) => {
  const gemModel = useGLTF(Assets.objects.data_gem.url);
  const matRef = useRef<MeshStandardMaterial | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(Math.random() * Math.PI * 2);
  const colors = VARIANT_COLORS[loot.variant];

  const instanceMat = useMemo(() => {
    const m = new MeshStandardMaterial({
      color: new Color(colors.emissive),
      emissive: new Color(colors.emissive),
      emissiveIntensity: 1.5,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    matRef.current = m;
    return m;
  }, [colors.emissive]);

  useFrame((_, delta) => {
    const speed = isBeingHacked ? 8 : 2;
    timeRef.current += delta * speed;
    if (matRef.current) {
      const pulse = 0.5 + Math.sin(timeRef.current) * 0.5;
      matRef.current.emissiveIntensity = isBeingHacked ? 2.0 + pulse * 3.0 : 1.0 + pulse * 1.5;
    }
    if (groupRef.current) {
      groupRef.current.position.y = loot.position.y + Math.sin(timeRef.current * 0.5) * 0.25;
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={loot.position}>
      <Clone
        object={gemModel.scene}
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

DataGemItem.displayName = 'DataGemItem';

function buildLootFromSlot(
  slotIdx: number,
  idSuffix: number,
  terrainData: TerrainData,
  spawnSlots: [number, number][],
): LootItem {
  const [sx, sz] = spawnSlots[slotIdx];
  const position = terrainUtil.calculatePositionOnTerrain(terrainData, [sx, sz], 0.5);
  return {
    id: `fragment_${idSuffix}`,
    slotIdx,
    position,
    variant: (Math.floor(Math.random() * 3)) as 0 | 1 | 2,
    scale: 1.0 + Math.random() * 0.5,
  };
}

const LootManager: React.FC<LootManagerProps> = ({ terrainData }) => {
  const playerPos = useLocalPlayerStore((s) => s.state.position);
  const collectFragment = useInventoryStore((state) => state.collectFragment);
  const { connected, server } = useGameServer();
  const { hackingTargetId, hackingProgress, startHacking, setHackingProgress, stopHacking } =
    useHackingStore();

  const idCounterRef = useRef(SPAWN_SLOTS_INITIAL_COUNT);
  const hackingTargetIdRef = useRef<string | null>(null);
  const hackingProgressRef = useRef(0);
  const hackingTimerRef = useRef(0);

  useEffect(() => { hackingTargetIdRef.current = hackingTargetId; }, [hackingTargetId]);
  useEffect(() => { hackingProgressRef.current = hackingProgress; }, [hackingProgress]);

  const spawnSlotsRef = useRef<[number, number][]>(generateInitialSlots(SPAWN_SLOTS_INITIAL_COUNT));

  const initialLoot: LootItem[] = useMemo(() => {
    return Array.from({ length: MAX_ACTIVE }, (_, i) =>
      buildLootFromSlot(i, i + 1, terrainData, spawnSlotsRef.current),
    );
  }, [terrainData]);

  const [activeLoot, setActiveLoot] = useState<LootItem[]>(initialLoot);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);

  const activeLootRef = useRef<LootItem[]>(initialLoot);
  useEffect(() => { activeLootRef.current = activeLoot; }, [activeLoot]);

  const respawnQueueRef = useRef<Array<{ readyAt: number }>>([]);
  const usedSlotsRef = useRef<Set<number>>(new Set(Array.from({ length: MAX_ACTIVE }, (_, i) => i)));

  const handleLootCollected = useCallback(
    async (id: string) => {
      const loot = activeLootRef.current.find((l) => l.id === id);
      if (!loot) return;

      setActiveLoot((prev) => prev.filter((l) => l.id !== id));
      setActiveEffects((prev) => [
        ...prev,
        { id, position: [loot.position.x, loot.position.y + 0.5, loot.position.z] },
      ]);

      collectFragment(1);
      respawnQueueRef.current.push({ readyAt: performance.now() + RESPAWN_DELAY * 1000 });

      if (connected && server) {
        try {
          await server.remoteFunction('collectFragment', [id]);
        } catch (err) {
          console.error('Failed to collect fragment on server', err);
        }
      }
    },
    [collectFragment, connected, server],
  );

  const handleEffectComplete = useCallback((id: string) => {
    setActiveEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  useFrame((_, delta) => {
    const pPos = playerPos;
    const loot = activeLootRef.current;
    const currentTarget = hackingTargetIdRef.current;
    const now = performance.now();

    const queue = respawnQueueRef.current;
    let i = 0;
    while (i < queue.length) {
      if (now >= queue[i].readyAt) {
        queue.splice(i, 1);
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

    let closestId: string | null = null;
    let closestDist = Infinity;

    for (const item of loot) {
      const dx = item.position.x - pPos.x;
      const dz = item.position.z - pPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < HACKING_TRIGGER_RADIUS && dist < closestDist) {
        closestDist = dist;
        closestId = item.id;
      }
    }

    if (currentTarget) {
      const targetLoot = loot.find((l) => l.id === currentTarget);
      if (!targetLoot) {
        stopHacking();
        hackingTargetIdRef.current = null;
        hackingTimerRef.current = 0;
        return;
      }

      const dx = targetLoot.position.x - pPos.x;
      const dz = targetLoot.position.z - pPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > HACKING_CANCEL_RADIUS) {
        stopHacking();
        hackingTargetIdRef.current = null;
        hackingTimerRef.current = 0;
        return;
      }

      hackingTimerRef.current += delta;
      const progress = Math.min(hackingTimerRef.current / HACKING_DURATION, 1);
      if (Math.abs(progress - hackingProgressRef.current) >= PROGRESS_UPDATE_THRESHOLD || progress >= 1) {
        setHackingProgress(progress);
        hackingProgressRef.current = progress;
      }

      if (progress >= 1) {
        const collected = currentTarget;
        usedSlotsRef.current.delete(targetLoot.slotIdx);
        stopHacking();
        hackingTargetIdRef.current = null;
        hackingTimerRef.current = 0;
        handleLootCollected(collected);
      }
    } else if (closestId) {
      startHacking(closestId);
      hackingTargetIdRef.current = closestId;
      hackingTimerRef.current = 0;
    }
  });

  return (
    <>
      {activeLoot.map((loot) => (
        <DataGemItem
          key={loot.id}
          loot={loot}
          isBeingHacked={hackingTargetId === loot.id}
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
