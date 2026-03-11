import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Vector3 } from 'three';
import { Terrain, Water, ModelPlacer, TerrainData, terrainUtil } from 'vibe-starter-3d-environment';
import { useGameStore } from '../../stores/gameStore';
import { useQualityStore } from '../../stores/qualityStore';
import Player from './Player';
import LootManager from './LootManager';
import Assets from '../../assets.json';

// Terrain texture paths – desert sand theme (HD 2K polyhaven textures)
const TERRAIN_TEXTURES = {
  SAND_GROUND: {
    map: Assets.textures.sand_ground.url,
    normalMap: Assets.textures.sand_ground_normal.url,
    aoMap: Assets.textures.sand_ground_ao.url,
  },
  DARK_SAND: {
    map: Assets.textures.dark_sand.url,
    normalMap: Assets.textures.dark_sand_normal.url,
    aoMap: Assets.textures.dark_sand_ao.url,
  },
  GRAY_SAND: {
    map: Assets.textures.gray_sand.url,
    normalMap: Assets.textures.gray_sand_normal.url,
    aoMap: Assets.textures.gray_sand_ao.url,
  },
};

const GameEnvironment: React.FC = () => {
  const terrainDataRef = useRef<TerrainData | null>(null);
  const [isReadyTerrainData, setIsReadyTerrainData] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 100, 0]);
  const setMapPhysicsReady = useGameStore((state) => state.setMapPhysicsReady);
  const { config } = useQualityStore();

  // Desert terrain splatting with HD 2K polyhaven textures
  const splattingSettings = useMemo(() => ({
    textures: [
      {
        materialProps: { map: TERRAIN_TEXTURES.SAND_GROUND.map, normalMap: TERRAIN_TEXTURES.SAND_GROUND.normalMap, aoMap: TERRAIN_TEXTURES.SAND_GROUND.aoMap, roughness: 0.85 },
        repeat: 3, heightRange: [0.0, 0.35] as [number, number], slopeRange: [0.0, 0.3] as [number, number], heightBlendRange: 0.12,
      },
      {
        materialProps: { map: TERRAIN_TEXTURES.GRAY_SAND.map, normalMap: TERRAIN_TEXTURES.GRAY_SAND.normalMap, aoMap: TERRAIN_TEXTURES.GRAY_SAND.aoMap, roughness: 0.75 },
        repeat: 4, heightRange: [0.25, 0.6] as [number, number], slopeRange: [0.0, 0.25] as [number, number], heightBlendRange: 0.1,
      },
      {
        materialProps: { map: TERRAIN_TEXTURES.DARK_SAND.map, normalMap: TERRAIN_TEXTURES.DARK_SAND.normalMap, aoMap: TERRAIN_TEXTURES.DARK_SAND.aoMap, roughness: 0.9 },
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

  // Desert cacti – 5 scattered
  const desertCactusPlacements = useMemo(() => [
    { position: [10, 15] as [number, number] },
    { position: [-15, -20] as [number, number] },
    { position: [20, -12] as [number, number] },
    { position: [-8, 28] as [number, number] },
    { position: [38, 15] as [number, number] },
  ], []);

  // Giant cacti – 3
  const giantCactusPlacements = useMemo(() => [
    { position: [22, -18] as [number, number] },
    { position: [-28, 15] as [number, number] },
    { position: [40, -30] as [number, number] },
  ], []);

  // Canyon stone stacks – 3 landmarks
  const canyonStonePlacements = useMemo(() => [
    { position: [35, 30] as [number, number] },
    { position: [-40, -35] as [number, number] },
    { position: [45, -20] as [number, number] },
  ], []);

  // Massive natural arch – 1 large
  const naturalArchPlacements = useMemo(() => [
    { position: [-30, 10] as [number, number] },
  ], []);

  // Stepped plateau pillars – 3
  const steppedPlateauPlacements = useMemo(() => [
    { position: [5, 30] as [number, number] },
    { position: [-18, -22] as [number, number] },
    { position: [30, 18] as [number, number] },
  ], []);

  // Flat tan rocks – 4
  const flatRockPlacements = useMemo(() => [
    { position: [-15, 20] as [number, number] },
    { position: [35, -15] as [number, number] },
    { position: [5, -25] as [number, number] },
    { position: [-25, -10] as [number, number] },
  ], []);

  // Desert monoliths – 2
  const monolithPlacements = useMemo(() => [
    { position: [8, 8] as [number, number] },
    { position: [-22, -8] as [number, number] },
  ], []);

  // Desert shelter – 1
  const shelterPlacements = useMemo(() => [
    { position: [-35, 30] as [number, number] },
  ], []);

  // Oasis well – 1
  const wellPlacements = useMemo(() => [
    { position: [18, -25] as [number, number] },
  ], []);

  // Ruined buildings – 2
  const ruinedBuildingPlacements = useMemo(() => [
    { position: [-25, 8] as [number, number] },
    { position: [25, 25] as [number, number] },
  ], []);

  // Temple stone circle – 1 center piece
  const stoneCirclePlacements = useMemo(() => [
    { position: [5, -10] as [number, number] },
  ], []);

  // Rune pillars gold – 3
  const runePillarPlacements = useMemo(() => [
    { position: [15, 25] as [number, number] },
    { position: [-20, -15] as [number, number] },
    { position: [30, -8] as [number, number] },
  ], []);

  // Ruined twin pillars – 2
  const twinPillarPlacements = useMemo(() => [
    { position: [12, 22] as [number, number] },
    { position: [-12, 5] as [number, number] },
  ], []);

  // Campfire circle – 1
  const campfirePlacements = useMemo(() => [
    { position: [-35, -25] as [number, number] },
  ], []);

  // Memoized scales
  const scale15 = useMemo(() => [1.5, 1.5, 1.5] as [number, number, number], []);
  const scale12 = useMemo(() => [1.2, 1.2, 1.2] as [number, number, number], []);
  const scale10 = useMemo(() => [1.0, 1.0, 1.0] as [number, number, number], []);
  const scale08 = useMemo(() => [0.8, 0.8, 0.8] as [number, number, number], []);
  const scale20 = useMemo(() => [2.0, 2.0, 2.0] as [number, number, number], []);

  return (
    <group>
      <Terrain
        width={128}
        depth={128}
        maxHeight={8}
        seed="desert-ruins-v1"
        roughness={0.7}
        detail={4}
        color="#d4a060"
        friction={1}
        restitution={0}
        splatting={splattingSettings}
        onTerrainDataReady={handleTerrainDataReady}
      />
      {isReadyTerrainData && terrainDataRef.current && (
        <>
          {/* Oasis water */}
          {config.waterEnabled && (
            <Water
              position={[0, terrainDataRef.current.waterLevel, 0]}
              size={[128, 128]}
              enableFoam={false}
            />
          )}

          {/* Desert cacti – 5 scattered */}
          <ModelPlacer modelPath={Assets.objects.desert_cactus.url} terrainData={terrainDataRef.current} placements={desertCactusPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Giant cacti – 3 */}
          <ModelPlacer modelPath={Assets.objects.giant_cactus.url} terrainData={terrainDataRef.current} placements={giantCactusPlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Canyon stone stacks – 3 landmarks */}
          <ModelPlacer modelPath={Assets.objects.canyon_stone_stack.url} terrainData={terrainDataRef.current} placements={canyonStonePlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Massive natural arch – 1 large */}
          <ModelPlacer modelPath={Assets.objects.massive_natural_arch.url} terrainData={terrainDataRef.current} placements={naturalArchPlacements} defaultScale={scale20} defaultTerrainBasedRotation={true} />

          {/* Stepped plateau pillars – 3 */}
          <ModelPlacer modelPath={Assets.objects.stepped_plateau_pillar.url} terrainData={terrainDataRef.current} placements={steppedPlateauPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Flat tan rocks – 4 */}
          <ModelPlacer modelPath={Assets.objects.flat_tan_rock.url} terrainData={terrainDataRef.current} placements={flatRockPlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Desert monoliths – 2 */}
          <ModelPlacer modelPath={Assets.objects.desert_monolith.url} terrainData={terrainDataRef.current} placements={monolithPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Desert shelter – 1 */}
          <ModelPlacer modelPath={Assets.objects.desert_shelter.url} terrainData={terrainDataRef.current} placements={shelterPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Oasis well – 1 */}
          <ModelPlacer modelPath={Assets.objects.oasis_well.url} terrainData={terrainDataRef.current} placements={wellPlacements} defaultScale={scale08} defaultTerrainBasedRotation={true} />

          {/* Ruined buildings – 2 */}
          <ModelPlacer modelPath={Assets.objects.ruined_building.url} terrainData={terrainDataRef.current} placements={ruinedBuildingPlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Temple stone circle – 1 center piece */}
          <ModelPlacer modelPath={Assets.objects.temple_stone_circle.url} terrainData={terrainDataRef.current} placements={stoneCirclePlacements} defaultScale={scale15} defaultTerrainBasedRotation={true} />

          {/* Rune pillars gold – 3 */}
          <ModelPlacer modelPath={Assets.objects.rune_pillar_gold.url} terrainData={terrainDataRef.current} placements={runePillarPlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          {/* Ruined twin pillars – 2 */}
          <ModelPlacer modelPath={Assets.objects.ruined_twin_pillars.url} terrainData={terrainDataRef.current} placements={twinPillarPlacements} defaultScale={scale12} defaultTerrainBasedRotation={true} />

          {/* Campfire circle – 1 */}
          <ModelPlacer modelPath={Assets.objects.campfire_circle.url} terrainData={terrainDataRef.current} placements={campfirePlacements} defaultScale={scale10} defaultTerrainBasedRotation={true} />

          <LootManager terrainData={terrainDataRef.current} />
          <Player position={new Vector3(...playerPosition)} />
        </>
      )}
    </group>
  );
};

export default GameEnvironment;
