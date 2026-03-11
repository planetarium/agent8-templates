import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import Experience from '../r3f/Experience';
import { FollowLight, QuarterViewController } from 'vibe-starter-3d';
import { useGameStore } from '../../stores/gameStore';
import { useQualityStore } from '../../stores/qualityStore';
import MapPhysicsReadyChecker from '../r3f/MapPhysicsReadyChecker';

/**
 * Game Scene Canvas Component
 *
 * Rendering quality is driven by the QualityStore so the user can
 * choose Low / Medium / High from the in-game settings menu.
 */
const GameSceneCanvas = () => {
  const { isMapPhysicsReady } = useGameStore();
  const { config } = useQualityStore();

  return (
    <>
      {/* ⚠️ DO NOT DELETE: Core Canvas component for React Three Fiber */}
      <Canvas
        shadows={config.shadows}
        dpr={config.dpr}
        gl={{
          antialias: config.antialias,
          powerPreference: 'high-performance',
        }}
      >
        <Physics paused={!isMapPhysicsReady}>
          <Suspense fallback={null}>
            {/* ⚠️ MUST INCLUDE: Essential checker for map physics initialization */}
            {!isMapPhysicsReady && <MapPhysicsReadyChecker />}
            {config.shadows && (
              <FollowLight
                offset={[60, 100, 30]}
                intensity={2}
                shadowMapSize={[config.shadowMapSize, config.shadowMapSize]}
                shadowCameraLeft={-50}
                shadowCameraRight={50}
                shadowCameraTop={50}
                shadowCameraBottom={-50}
              />
            )}
            {/* Ambient fallback light when shadows / FollowLight are disabled */}
            {!config.shadows && <directionalLight position={[50, 100, 30]} intensity={2} />}
            <QuarterViewController followCharacter={true} />
            <Experience />
          </Suspense>
        </Physics>
      </Canvas>
    </>
  );
};

export default GameSceneCanvas;
