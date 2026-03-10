import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Vector3 } from 'three';
import { Terrain, Water, ModelPlacer, TerrainData, terrainUtil, DEFAULT_TEXTURE_PATHS } from 'vibe-starter-3d-environment';
import { useGameStore } from '../../stores/gameStore';
import { useQualityStore } from '../../stores/qualityStore';
import Player from './Player';
import LootManager from './LootManager';
import Assets from '../../assets.json';

const GameEnvironment: React.FC = () => {
  const terrainDataRef = useRef<TerrainData | null>(null);
  const [isReadyTerrainData, setIsReadyTerrainData] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 100, 0]);
  const setMapPhysicsReady = useGameStore((state) => state.setMapPhysicsReady);
  const { config } = useQualityStore();

  const splattingSettings = useMemo(() => ({
    textures: [
      {
        materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.SAND, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.SAND_NORMAL, roughness: 0.9 },
        repeat: 3, heightRange: [0.0, 0.4] as [number, number], slopeRange: [0.0, 0.3] as [number, number], heightBlendRange: 0.15,
      },
      {
        materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT_AO, roughness: 0.85 },
        repeat: 2, slopeRange: [0.25, 0.55] as [number, number], heightBlendRange: 0.12,
      },
      {
        materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_AO, roughness: 0.75 },
        repeat: 1, slopeRange: [0.5, Math.PI / 2] as [number, number], heightBlendRange: 0.1,
      },
    ],
    mode: 'both' as const,
    defaultBlendRange: 0.15,
  }), []);

  const handleTerrainDataReady = useCallback(
    (newTerrainData: TerrainData) => {
      newTerrainData.waterLevel = newTerrainData.maxHeight < 0.5 ? -10 : newTerrainData.maxHeight * 0.1;
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
        maxHeight={8}
        seed="starbound-expeditions"
        roughness={0.7}
        detail={4}
        color="#223344"
        friction={1}
        restitution={0}
        splatting={splattingSettings}
        onTerrainDataReady={handleTerrainDataReady}
      />
      {isReadyTerrainData && terrainDataRef.current && (
        <>
          {/* Water only rendered on medium/high quality */}
          {config.waterEnabled && (
            <Water
              position={[0, terrainDataRef.current.waterLevel, 0]}
              size={[128, 128]}
              enableFoam={false}
            />
          )}
          
          <ModelPlacer
            modelPath={Assets.objects.tree.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [10, 20] },
              { position: [-15, 25] },
              { position: [30, -10] },
              { position: [-20, -30] },
              { position: [25, 15] },
              { position: [-5, 40] }
            ]}
            defaultScale={[2, 2, 2]}
            defaultTerrainBasedRotation={true}
          />

          <ModelPlacer
            modelPath={Assets.objects.rock.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [12, 22] },
              { position: [-18, 20] },
              { position: [35, -5] },
            ]}
            defaultScale={[1.5, 1.5, 1.5]}
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
