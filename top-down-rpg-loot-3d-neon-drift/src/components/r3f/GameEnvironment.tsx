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
        materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_AO, roughness: 0.6 },
        repeat: 3, heightRange: [0.0, 0.4] as [number, number], slopeRange: [0.0, 0.3] as [number, number], heightBlendRange: 0.15,
      },
      {
        materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT_AO, roughness: 0.75 },
        repeat: 2, slopeRange: [0.25, 0.55] as [number, number], heightBlendRange: 0.12,
      },
      {
        materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_AO, roughness: 0.5 },
        repeat: 1, slopeRange: [0.5, Math.PI / 2] as [number, number], heightBlendRange: 0.1,
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

  return (
    <group>
      <Terrain
        width={128}
        depth={128}
        maxHeight={6}
        seed="neondrift-cyberarena"
        roughness={0.5}
        detail={4}
        color="#1a0030"
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

          {/* Energy Pillars - scattered power sources */}
          <ModelPlacer
            modelPath={Assets.objects.energy_pillar.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [15, 20] },
              { position: [-20, 25] },
              { position: [35, -15] },
              { position: [-30, -30] },
              { position: [25, 35] },
              { position: [-40, 10] },
            ]}
            defaultScale={[1.5, 1.5, 1.5]}
            defaultTerrainBasedRotation={true}
          />

          {/* Cyber Core Generators */}
          <ModelPlacer
            modelPath={Assets.objects.cyber_core_generator.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [10, -25] },
              { position: [-15, 15] },
              { position: [40, 20] },
            ]}
            defaultScale={[1.2, 1.2, 1.2]}
            defaultTerrainBasedRotation={true}
          />

          {/* Defense Towers */}
          <ModelPlacer
            modelPath={Assets.objects.cyber_defense_tower.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [30, 30] },
              { position: [-35, -25] },
              { position: [45, -30] },
            ]}
            defaultScale={[1.0, 1.0, 1.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Neon Dome Temple */}
          <ModelPlacer
            modelPath={Assets.objects.neon_dome_temple.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [20, 10] },
            ]}
            defaultScale={[1.5, 1.5, 1.5]}
            defaultTerrainBasedRotation={true}
          />

          {/* Neon Gateway Doors */}
          <ModelPlacer
            modelPath={Assets.objects.neon_gateway.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [-25, -10] },
              { position: [15, -35] },
            ]}
            defaultScale={[1.3, 1.3, 1.3]}
            defaultTerrainBasedRotation={true}
          />

          {/* Spiral Towers */}
          <ModelPlacer
            modelPath={Assets.objects.spiral_tower.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [-10, 40] },
              { position: [38, -8] },
            ]}
            defaultScale={[1.0, 1.0, 1.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Vending Machines */}
          <ModelPlacer
            modelPath={Assets.objects.vending_machine_a.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [5, 12] },
              { position: [-18, -15] },
              { position: [28, -22] },
            ]}
            defaultScale={[1.2, 1.2, 1.2]}
            defaultTerrainBasedRotation={true}
          />

          <ModelPlacer
            modelPath={Assets.objects.vending_machine_b.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [-8, 30] },
              { position: [22, 25] },
            ]}
            defaultScale={[1.2, 1.2, 1.2]}
            defaultTerrainBasedRotation={true}
          />

          {/* Robotic Console */}
          <ModelPlacer
            modelPath={Assets.objects.robotic_console.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [-22, 5] },
              { position: [12, -12] },
            ]}
            defaultScale={[1.0, 1.0, 1.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Time Machine Consoles */}
          <ModelPlacer
            modelPath={Assets.objects.time_machine_console.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [35, 10] },
            ]}
            defaultScale={[1.2, 1.2, 1.2]}
            defaultTerrainBasedRotation={true}
          />

          {/* Arcade Terminals */}
          <ModelPlacer
            modelPath={Assets.objects.arcade_terminal.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [-30, 18] },
              { position: [8, -30] },
            ]}
            defaultScale={[1.0, 1.0, 1.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Industrial Tanks */}
          <ModelPlacer
            modelPath={Assets.objects.industrial_tanks.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [42, -15] },
              { position: [-38, -35] },
            ]}
            defaultScale={[1.0, 1.0, 1.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Neon Plants */}
          <ModelPlacer
            modelPath={Assets.objects.neon_plant.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [3, 8] },
              { position: [-12, -5] },
              { position: [18, -18] },
              { position: [-28, 22] },
              { position: [30, 5] },
              { position: [-5, -28] },
            ]}
            defaultScale={[2.0, 2.0, 2.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Cyber Lion Emblem */}
          <ModelPlacer
            modelPath={Assets.objects.cyber_lion_emblem.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [0, 5] },
            ]}
            defaultScale={[2.0, 2.0, 2.0]}
            defaultTerrainBasedRotation={true}
          />

          {/* Ice Torches */}
          <ModelPlacer
            modelPath={Assets.objects.ice_torch.url}
            terrainData={terrainDataRef.current}
            placements={[
              { position: [8, -8] },
              { position: [-15, 12] },
              { position: [25, 15] },
              { position: [-20, -18] },
              { position: [32, -25] },
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
