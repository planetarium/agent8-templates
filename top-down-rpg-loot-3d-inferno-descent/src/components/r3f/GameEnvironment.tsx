import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Vector3 } from 'three';
import { Terrain, Water, ModelPlacer, TerrainData, terrainUtil } from 'vibe-starter-3d-environment';
import { useGameStore } from '../../stores/gameStore';
import { useQualityStore } from '../../stores/qualityStore';
import Player from './Player';
import LootManager from './LootManager';
import Assets from '../../assets.json';

// Terrain texture paths – volcanic theme using actual lava/burned textures
const TERRAIN_TEXTURES = {
  BURNED: {
    map: Assets.textures.burned_ground.url,
    normalMap: Assets.textures.burned_ground_normal.url,
    aoMap: Assets.textures.burned_ground_ao.url,
  },
  MAGMA: {
    map: Assets.textures.cracked_magma.url,
    normalMap: Assets.textures.cracked_magma_normal.url,
  },
  VOLCANIC_ROCK: {
    map: Assets.textures.volcanic_rock.url,
    normalMap: Assets.textures.volcanic_rock_normal.url,
    aoMap: Assets.textures.volcanic_rock_ao.url,
  },
};

const GameEnvironment: React.FC = () => {
  const terrainDataRef = useRef<TerrainData | null>(null);
  const [isReadyTerrainData, setIsReadyTerrainData] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 100, 0]);
  const setMapPhysicsReady = useGameStore((state) => state.setMapPhysicsReady);
  const { config } = useQualityStore();

  // Volcanic terrain splatting using real lava/burned textures
  const splattingSettings = useMemo(() => ({
    textures: [
      {
        materialProps: { map: TERRAIN_TEXTURES.BURNED.map, normalMap: TERRAIN_TEXTURES.BURNED.normalMap, aoMap: TERRAIN_TEXTURES.BURNED.aoMap, roughness: 0.9 },
        repeat: 3, heightRange: [0.0, 0.35] as [number, number], slopeRange: [0.0, 0.3] as [number, number], heightBlendRange: 0.12,
      },
      {
        materialProps: { map: TERRAIN_TEXTURES.MAGMA.map, normalMap: TERRAIN_TEXTURES.MAGMA.normalMap, roughness: 0.4, emissive: '#331100', emissiveIntensity: 0.3 },
        repeat: 4, heightRange: [0.0, 0.2] as [number, number], slopeRange: [0.0, 0.2] as [number, number], heightBlendRange: 0.1,
      },
      {
        materialProps: { map: TERRAIN_TEXTURES.VOLCANIC_ROCK.map, normalMap: TERRAIN_TEXTURES.VOLCANIC_ROCK.normalMap, aoMap: TERRAIN_TEXTURES.VOLCANIC_ROCK.aoMap, roughness: 0.75 },
        repeat: 2, slopeRange: [0.3, Math.PI / 2] as [number, number], heightBlendRange: 0.1,
      },
    ],
    mode: 'both' as const,
    defaultBlendRange: 0.15,
  }), []);

  const handleTerrainDataReady = useCallback(
    (newTerrainData: TerrainData) => {
      newTerrainData.waterLevel = newTerrainData.maxHeight < 0.5 ? -10 : newTerrainData.maxHeight * 0.08;
      terrainDataRef.current = newTerrainData;
      setIsReadyTerrainData(true);

      const pos = terrainUtil.calculatePositionOnTerrain(newTerrainData, [0, 0], 20);
      setPlayerPosition([pos.x, pos.y, pos.z]);
      setMapPhysicsReady(true);
    },
    [setMapPhysicsReady]
  );

  // ─── Memoized placements to avoid re-creating arrays each render ───
  const volcanoSpikePlacements = useMemo(() => [
    { position: [35, 30] as [number, number] },
    { position: [-40, -35] as [number, number] },
    { position: [45, -20] as [number, number] },
  ], []);

  const monolithPlacements = useMemo(() => [
    { position: [15, 25] as [number, number] },
    { position: [-20, -15] as [number, number] },
    { position: [30, -8] as [number, number] },
    { position: [-10, 35] as [number, number] },
  ], []);

  const pebblePlacements = useMemo(() => [
    { position: [10, 15] as [number, number] },
    { position: [-15, -20] as [number, number] },
    { position: [20, -12] as [number, number] },
    { position: [-8, 28] as [number, number] },
    { position: [38, 15] as [number, number] },
  ], []);

  const obsidianPlacements = useMemo(() => [
    { position: [22, -18] as [number, number] },
    { position: [-28, 15] as [number, number] },
  ], []);

  const altarPlacements = useMemo(() => [
    { position: [-15, 20] as [number, number] },
    { position: [35, -15] as [number, number] },
  ], []);

  const shrinePlacements = useMemo(() => [
    { position: [8, 8] as [number, number] },
  ], []);

  const pillarPlacements = useMemo(() => [
    { position: [18, -25] as [number, number] },
    { position: [-25, 8] as [number, number] },
    { position: [5, 30] as [number, number] },
  ], []);

  const cauldronPlacements = useMemo(() => [
    { position: [5, -10] as [number, number] },
    { position: [-12, 5] as [number, number] },
    { position: [20, 12] as [number, number] },
  ], []);

  const skullPlacements = useMemo(() => [
    { position: [12, 22] as [number, number] },
    { position: [-18, -22] as [number, number] },
  ], []);

  // Memoized scales – avoid re-creating tuples each render
  const scale15 = useMemo(() => [1.5, 1.5, 1.5] as [number, number, number], []);
  const scale12 = useMemo(() => [1.2, 1.2, 1.2] as [number, number, number], []);
  const scale10 = useMemo(() => [1.0, 1.0, 1.0] as [number, number, number], []);
  const scale13 = useMemo(() => [1.3, 1.3, 1.3] as [number, number, number], []);

  return (
    <group>
      <Terrain
        width={128}
        depth={128}
        maxHeight={10}
        seed="inferno-descent"
        roughness={0.85}
        detail={4}
        color="#1a0800"
        friction={1}
        restitution={0}
        splatting={splattingSettings}
        onTerrainDataReady={handleTerrainDataReady}
      />
      {isReadyTerrainData && terrainDataRef.current && (
        <>
          {/* Lava water */}
          {config.waterEnabled && (
            <Water
              position={[0, terrainDataRef.current.waterLevel, 0]}
              size={[128, 128]}
              enableFoam={false}
            />
          )}
          
          {/* Volcanic spikes – 3 large landmarks */}
          <ModelPlacer modelPath={Assets.objects.volcanic_spike.url} terrainData={terrainDataRef.current} placements={volcanoSpikePlacements} defaultScale={scale15} defaultTerrainBasedRotation={true} />

          {/* Molten monoliths – 4 pillars */}
          <ModelPlacer modelPath={Assets.objects.molten_monolith.url} terrainData={terrainDataRef.current} placements={monolithPlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Lava pebble mounds – 5 scatter */}
          <ModelPlacer modelPath={Assets.objects.lava_pebbles.url} terrainData={terrainDataRef.current} placements={pebblePlacements} defaultScale={scale15} defaultTerrainBasedRotation={true} />

          {/* Obsidian spires – 2 obelisks */}
          <ModelPlacer modelPath={Assets.objects.obsidian_spire.url} terrainData={terrainDataRef.current} placements={obsidianPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Blood altar – 2 ritual landmarks */}
          <ModelPlacer modelPath={Assets.objects.blood_altar.url} terrainData={terrainDataRef.current} placements={altarPlacements} defaultScale={scale15} defaultTerrainBasedRotation={true} />

          {/* Demon shrine – 1 center piece */}
          <ModelPlacer modelPath={Assets.objects.demon_shrine.url} terrainData={terrainDataRef.current} placements={shrinePlacements} defaultScale={scale13} defaultTerrainBasedRotation={true} />

          {/* Dark mystic pillars – 3 */}
          <ModelPlacer modelPath={Assets.objects.dark_pillar.url} terrainData={terrainDataRef.current} placements={pillarPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Flame cauldrons – 3 lighting elements */}
          <ModelPlacer modelPath={Assets.objects.flame_cauldron.url} terrainData={terrainDataRef.current} placements={cauldronPlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Skull emblems – 2 demonic markers */}
          <ModelPlacer modelPath={Assets.objects.skull_emblem.url} terrainData={terrainDataRef.current} placements={skullPlacements} defaultScale={scale15} defaultTerrainBasedRotation={true} />

          <LootManager terrainData={terrainDataRef.current} />
          <Player position={new Vector3(...playerPosition)} />
        </>
      )}
    </group>
  );
};

export default GameEnvironment;
