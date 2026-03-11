import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Vector3 } from 'three';
import { Terrain, Water, ModelPlacer, TerrainData, terrainUtil, DEFAULT_TEXTURE_PATHS } from 'vibe-starter-3d-environment';
import { useGameStore } from '../../stores/gameStore';
import { useQualityStore } from '../../stores/qualityStore';
import Player from './Player';
import LootManager from './LootManager';
import Assets from '../../assets.json';

function limitPlacements(
  placements: Array<{ position: [number, number] }>,
  max: number,
): Array<{ position: [number, number] }> {
  return placements.slice(0, max);
}

const GameEnvironment: React.FC = () => {
  const terrainDataRef = useRef<TerrainData | null>(null);
  const [isReadyTerrainData, setIsReadyTerrainData] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 100, 0]);
  const setMapPhysicsReady = useGameStore((state) => state.setMapPhysicsReady);
  const { config } = useQualityStore();
  const maxObj = config.maxObjectPlacements;

  const splattingSettings = useMemo(() => ({
    textures: [
      {
        materialProps: {
          map: DEFAULT_TEXTURE_PATHS.TERRAIN.GRASS,
          normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.GRASS_NORMAL,
          aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.GRASS_AO,
          roughness: 0.9,
        },
        repeat: 6,
        heightRange: [0.0, 0.5] as [number, number],
        slopeRange: [0.0, 0.3] as [number, number],
        heightBlendRange: 0.15,
      },
      {
        materialProps: {
          map: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT,
          normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT_NORMAL,
          aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT_AO,
          roughness: 0.85,
        },
        repeat: 5,
        slopeRange: [0.25, 0.55] as [number, number],
        heightBlendRange: 0.12,
      },
      {
        materialProps: {
          map: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE,
          normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_NORMAL,
          aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_AO,
          roughness: 0.7,
        },
        repeat: 4,
        slopeRange: [0.5, Math.PI / 2] as [number, number],
        heightBlendRange: 0.1,
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

  return (
    <group>
      <Terrain
        width={128}
        depth={128}
        maxHeight={6}
        seed="spirit-grove-ancient"
        roughness={0.45}
        detail={3}
        color="#2d4a1e"
        friction={1}
        restitution={0}
        splatting={splattingSettings}
        onTerrainDataReady={handleTerrainDataReady}
      />
      {isReadyTerrainData && terrainDataRef.current && (
        <>
          {config.waterEnabled && (
            <Water
              position={[0, terrainDataRef.current.waterLevel, 0]}
              size={[128, 128]}
              enableFoam={false}
            />
          )}

          {/* Mushroom houses - main landmarks */}
          <ModelPlacer
            modelPath={Assets.objects.mushroom_house.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [15, 20] },
              { position: [-20, 25] },
              { position: [35, -15] },
              { position: [-35, -30] },
            ], maxObj)}
            defaultScale={[2.0, 2.0, 2.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Mystic mushroom huts */}
          <ModelPlacer
            modelPath={Assets.objects.mystic_mushroom.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [30, 30] },
              { position: [-25, -20] },
              { position: [40, -35] },
            ], maxObj)}
            defaultScale={[1.8, 1.8, 1.8]}
            defaultTerrainBasedRotation={true}
          />

          {/* Fairy village clusters */}
          <ModelPlacer
            modelPath={Assets.objects.fairy_village.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [-40, 15] },
              { position: [45, 10] },
              { position: [-10, -45] },
            ], maxObj)}
            defaultScale={[2.5, 2.5, 2.5]}
            defaultTerrainBasedRotation={true}
          />

          {/* Forest logs with mushrooms */}
          <ModelPlacer
            modelPath={Assets.objects.forest_log.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [50, 40] },
              { position: [-50, 35] },
              { position: [48, -40] },
              { position: [-45, -42] },
            ], maxObj)}
            defaultScale={[2.0, 2.0, 2.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Red mushrooms scattered */}
          <ModelPlacer
            modelPath={Assets.objects.red_mushroom.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [5, -15] },
              { position: [-18, 8] },
              { position: [28, 15] },
              { position: [-12, -28] },
            ], maxObj)}
            defaultScale={[3.0, 3.0, 3.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Ancient stone sanctuary - central landmark */}
          <ModelPlacer
            modelPath={Assets.objects.ancient_sanctuary.url}
            terrainData={terrainDataRef.current}
            placements={[{ position: [10, 10] }]}
            defaultScale={[2.0, 2.0, 2.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Forest sanctuary */}
          <ModelPlacer
            modelPath={Assets.objects.forest_sanctuary.url}
            terrainData={terrainDataRef.current}
            placements={[{ position: [-5, 35] }]}
            defaultScale={[1.5, 1.5, 1.5]}
            defaultTerrainBasedRotation={true}
          />

          {/* Enchanted wishing well */}
          <ModelPlacer
            modelPath={Assets.objects.wishing_well.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [25, 5] },
              { position: [-32, -15] },
            ], maxObj)}
            defaultScale={[1.5, 1.5, 1.5]}
            defaultTerrainBasedRotation={true}
          />

          {/* Ruined twin pillars */}
          <ModelPlacer
            modelPath={Assets.objects.ruined_pillars.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [20, -25] },
              { position: [-30, 10] },
            ], maxObj)}
            defaultScale={[2.0, 2.0, 2.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Druid totem pillars */}
          <ModelPlacer
            modelPath={Assets.objects.druid_pillar.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [12, 28] },
              { position: [-8, -12] },
              { position: [38, 20] },
            ], maxObj)}
            defaultScale={[2.5, 2.5, 2.5]}
            defaultTerrainBasedRotation={true}
          />

          {/* Treehouse stump */}
          <ModelPlacer
            modelPath={Assets.objects.treehouse_stump.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [18, 22] },
              { position: [-15, 18] },
            ], maxObj)}
            defaultScale={[2.0, 2.0, 2.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Tree stumps */}
          <ModelPlacer
            modelPath={Assets.objects.stump_serenity.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [32, -8] },
              { position: [-22, -22] },
              { position: [8, 40] },
            ], maxObj)}
            defaultScale={[2.5, 2.5, 2.5]}
            defaultTerrainBasedRotation={true}
          />

          {/* Twilight flowers */}
          <ModelPlacer
            modelPath={Assets.objects.twilight_flower.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [3, -8] },
              { position: [-10, 5] },
              { position: [20, -18] },
              { position: [-25, 15] },
            ], maxObj)}
            defaultScale={[3.0, 3.0, 3.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Bioluminescent mushrooms */}
          <ModelPlacer
            modelPath={Assets.objects.magic_mushroom.url}
            terrainData={terrainDataRef.current}
            placements={limitPlacements([
              { position: [-38, 30] },
              { position: [42, 35] },
              { position: [-20, -38] },
            ], maxObj)}
            defaultScale={[2.0, 2.0, 2.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Floral altar */}
          <ModelPlacer
            modelPath={Assets.objects.floral_altar.url}
            terrainData={terrainDataRef.current}
            placements={[{ position: [38, -28] }]}
            defaultScale={[2.0, 2.0, 2.0]}
            defaultTerrainBasedRotation={true}
          />

          <LootManager terrainData={terrainDataRef.current} />
          <Player position={new Vector3(...playerPosition)} />
        </>
      )}
    </group>
  );
};

export default GameEnvironment;
