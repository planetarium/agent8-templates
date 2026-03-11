import React, { useState, useRef, useCallback } from 'react';
import { Vector3 } from 'three';
import { Terrain, Water, ModelPlacer, TerrainData, terrainUtil } from 'vibe-starter-3d-environment';
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
        maxHeight={5}
        seed="realm-relics"
        roughness={0.5}
        detail={4}
        color="#2e4a22"
        friction={1}
        restitution={0}
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
