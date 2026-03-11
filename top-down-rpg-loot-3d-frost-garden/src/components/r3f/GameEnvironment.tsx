import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Vector3 } from 'three';
import { Terrain, Water, ModelPlacer, TerrainData, terrainUtil } from 'vibe-starter-3d-environment';
import { useGameStore } from '../../stores/gameStore';
import { useQualityStore } from '../../stores/qualityStore';
import Player from './Player';
import LootManager from './LootManager';
import Assets from '../../assets.json';

// Terrain texture paths – winter snow theme
const TERRAIN_TEXTURES = {
  SNOW_SMOOTH: {
    map: Assets.textures.snow_ground.url,
    normalMap: Assets.textures.snow_ground_normal.url,
    aoMap: Assets.textures.snow_ground_ao.url,
  },
  SNOW_RIPPLES: {
    map: Assets.textures.snow_ripples.url,
    normalMap: Assets.textures.snow_ripples_normal.url,
  },
  SNOW_ROUGH: {
    map: Assets.textures.snow_rough.url,
    normalMap: Assets.textures.snow_rough_normal.url,
    aoMap: Assets.textures.snow_rough_ao.url,
  },
};

const GameEnvironment: React.FC = () => {
  const terrainDataRef = useRef<TerrainData | null>(null);
  const [isReadyTerrainData, setIsReadyTerrainData] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 100, 0]);
  const setMapPhysicsReady = useGameStore((state) => state.setMapPhysicsReady);
  const { config } = useQualityStore();

  // Snowy terrain splatting
  const splattingSettings = useMemo(() => ({
    textures: [
      {
        materialProps: { map: TERRAIN_TEXTURES.SNOW_SMOOTH.map, normalMap: TERRAIN_TEXTURES.SNOW_SMOOTH.normalMap, aoMap: TERRAIN_TEXTURES.SNOW_SMOOTH.aoMap, roughness: 0.85 },
        repeat: 3, heightRange: [0.0, 0.35] as [number, number], slopeRange: [0.0, 0.3] as [number, number], heightBlendRange: 0.12,
      },
      {
        materialProps: { map: TERRAIN_TEXTURES.SNOW_RIPPLES.map, normalMap: TERRAIN_TEXTURES.SNOW_RIPPLES.normalMap, roughness: 0.7 },
        repeat: 4, heightRange: [0.0, 0.25] as [number, number], slopeRange: [0.0, 0.2] as [number, number], heightBlendRange: 0.1,
      },
      {
        materialProps: { map: TERRAIN_TEXTURES.SNOW_ROUGH.map, normalMap: TERRAIN_TEXTURES.SNOW_ROUGH.normalMap, aoMap: TERRAIN_TEXTURES.SNOW_ROUGH.aoMap, roughness: 0.9 },
        repeat: 2, slopeRange: [0.3, Math.PI / 2] as [number, number], heightBlendRange: 0.1,
      },
    ],
    mode: 'both' as const,
    defaultBlendRange: 0.15,
  }), []);

  const handleTerrainDataReady = useCallback(
    (newTerrainData: TerrainData) => {
      newTerrainData.waterLevel = newTerrainData.maxHeight < 0.5 ? -10 : newTerrainData.maxHeight * 0.06;
      terrainDataRef.current = newTerrainData;
      setIsReadyTerrainData(true);

      const pos = terrainUtil.calculatePositionOnTerrain(newTerrainData, [0, 0], 20);
      setPlayerPosition([pos.x, pos.y, pos.z]);
      setMapPhysicsReady(true);
    },
    [setMapPhysicsReady]
  );

  // ─── Memoized placements ───
  const frozenPeakPlacements = useMemo(() => [
    { position: [35, 30] as [number, number] },
    { position: [-40, -35] as [number, number] },
    { position: [45, -20] as [number, number] },
  ], []);

  const icePillarPlacements = useMemo(() => [
    { position: [15, 25] as [number, number] },
    { position: [-20, -15] as [number, number] },
    { position: [30, -8] as [number, number] },
    { position: [-10, 35] as [number, number] },
  ], []);

  const pineTreePlacements = useMemo(() => [
    { position: [10, 15] as [number, number] },
    { position: [-15, -20] as [number, number] },
    { position: [20, -12] as [number, number] },
    { position: [-8, 28] as [number, number] },
    { position: [38, 15] as [number, number] },
    { position: [-30, 10] as [number, number] },
    { position: [25, 25] as [number, number] },
  ], []);

  const lushTreePlacements = useMemo(() => [
    { position: [22, -18] as [number, number] },
    { position: [-28, 15] as [number, number] },
    { position: [40, -30] as [number, number] },
    { position: [-35, -25] as [number, number] },
  ], []);

  const snowRockPlacements = useMemo(() => [
    { position: [-15, 20] as [number, number] },
    { position: [35, -15] as [number, number] },
    { position: [5, -25] as [number, number] },
  ], []);

  const clusteredRockPlacements = useMemo(() => [
    { position: [8, 8] as [number, number] },
    { position: [-22, -8] as [number, number] },
  ], []);

  const frostedFlowerPlacements = useMemo(() => [
    { position: [18, -25] as [number, number] },
    { position: [-25, 8] as [number, number] },
  ], []);

  const stonePillarPlacements = useMemo(() => [
    { position: [5, 30] as [number, number] },
    { position: [-18, -22] as [number, number] },
    { position: [30, 18] as [number, number] },
  ], []);

  const frostAltarPlacements = useMemo(() => [
    { position: [5, -10] as [number, number] },
  ], []);

  const crystalSnowmanPlacements = useMemo(() => [
    { position: [12, 22] as [number, number] },
    { position: [-12, 5] as [number, number] },
  ], []);

  const cottagePlacements = useMemo(() => [
    { position: [-35, 30] as [number, number] },
  ], []);

  // Memoized scales
  const scale15 = useMemo(() => [1.5, 1.5, 1.5] as [number, number, number], []);
  const scale12 = useMemo(() => [1.2, 1.2, 1.2] as [number, number, number], []);
  const scale10 = useMemo(() => [1.0, 1.0, 1.0] as [number, number, number], []);
  const scale08 = useMemo(() => [0.8, 0.8, 0.8] as [number, number, number], []);

  return (
    <group>
      <Terrain
        width={128}
        depth={128}
        maxHeight={8}
        seed="frost-garden-v1"
        roughness={0.7}
        detail={4}
        color="#d8e8f4"
        friction={1}
        restitution={0}
        splatting={splattingSettings}
        onTerrainDataReady={handleTerrainDataReady}
      />
      {isReadyTerrainData && terrainDataRef.current && (
        <>
          {/* Frozen lake water */}
          {config.waterEnabled && (
            <Water
              position={[0, terrainDataRef.current.waterLevel, 0]}
              size={[128, 128]}
              enableFoam={false}
            />
          )}

          {/* Frozen peak clusters – 3 large landmarks */}
          <ModelPlacer modelPath={Assets.objects.frozen_peak_cluster.url} terrainData={terrainDataRef.current} placements={frozenPeakPlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Ice crystal pillars – 4 */}
          <ModelPlacer modelPath={Assets.objects.ice_crystal_pillar.url} terrainData={terrainDataRef.current} placements={icePillarPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Snowy pine trees – 7 */}
          <ModelPlacer modelPath={Assets.objects.snowy_pine_tree.url} terrainData={terrainDataRef.current} placements={pineTreePlacements} defaultScale={scale15} defaultTerrainBasedRotation={true} />

          {/* Dense lush trees – 4 */}
          <ModelPlacer modelPath={Assets.objects.snowy_tree_lush.url} terrainData={terrainDataRef.current} placements={lushTreePlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Snow-covered round rocks – 3 */}
          <ModelPlacer modelPath={Assets.objects.snowy_rock_round.url} terrainData={terrainDataRef.current} placements={snowRockPlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Clustered rocks – 2 */}
          <ModelPlacer modelPath={Assets.objects.snowy_clustered_rocks.url} terrainData={terrainDataRef.current} placements={clusteredRockPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Frosted flower statues – 2 landmarks */}
          <ModelPlacer modelPath={Assets.objects.frosted_flower_statue.url} terrainData={terrainDataRef.current} placements={frostedFlowerPlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Snow-covered stone pillars – 3 */}
          <ModelPlacer modelPath={Assets.objects.snow_covered_stone_pillar.url} terrainData={terrainDataRef.current} placements={stonePillarPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Frost altar – 1 center piece */}
          <ModelPlacer modelPath={Assets.objects.frost_altar.url} terrainData={terrainDataRef.current} placements={frostAltarPlacements} defaultScale={scale15} defaultTerrainBasedRotation={true} />

          {/* Crystal snowmen – 2 */}
          <ModelPlacer modelPath={Assets.objects.crystal_snowman.url} terrainData={terrainDataRef.current} placements={crystalSnowmanPlacements} defaultScale={scale08} defaultTerrainBasedRotation={true} />

          {/* Winter cottage – 1 */}
          <ModelPlacer modelPath={Assets.objects.winter_cottage.url} terrainData={terrainDataRef.current} placements={cottagePlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          <LootManager terrainData={terrainDataRef.current} />
          <Player position={new Vector3(...playerPosition)} />
        </>
      )}
    </group>
  );
};

export default GameEnvironment;
