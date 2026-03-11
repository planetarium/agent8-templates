import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import Experience from '../r3f/Experience';
import { FollowLight, QuarterViewController } from 'vibe-starter-3d';
import { useGameStore } from '../../stores/gameStore';
import { useQualityStore } from '../../stores/qualityStore';
import MapPhysicsReadyChecker from '../r3f/MapPhysicsReadyChecker';

/**
 * Game Scene Canvas Component - Frost Garden
 */
const GameSceneCanvas = () => {
  const { isMapPhysicsReady } = useGameStore();
  const { config } = useQualityStore();

  const glConfig = useMemo(() => ({
    antialias: config.antialias,
    powerPreference: 'high-performance' as const,
    depth: true,
    stencil: false,
    alpha: false,
  }), [config.antialias]);

  return (
    <Canvas
      shadows={config.shadows}
      dpr={config.dpr}
      gl={glConfig}
      frameloop="always"
      camera={{ fov: 50, near: 0.5, far: 200 }}
    >
      <Physics paused={!isMapPhysicsReady}>
        <Suspense fallback={null}>
          {!isMapPhysicsReady && <MapPhysicsReadyChecker />}
          {config.shadows && (
            <FollowLight
              offset={[40, 80, 20]}
              intensity={1.5}
              shadowMapSize={[config.shadowMapSize, config.shadowMapSize]}
              shadowCameraLeft={-35}
              shadowCameraRight={35}
              shadowCameraTop={35}
              shadowCameraBottom={-35}
            />
          )}
          {!config.shadows && <directionalLight position={[40, 80, 20]} intensity={1.5} color="#e0eeff" />}
          <QuarterViewController followCharacter={true} />
          <Experience />
        </Suspense>
      </Physics>
    </Canvas>
  );
};

export default GameSceneCanvas;
