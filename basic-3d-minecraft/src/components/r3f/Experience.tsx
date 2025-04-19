import { useRef, useState } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment, Grid, KeyboardControls, Sky, Html } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { FreeViewController, ControllerHandle } from 'vibe-starter-3d';
import { useEffect } from 'react';
import { Player, PlayerRef } from './Player';
import { Floor } from './Floor';
import { InstancedCubes } from './InstancedCubes';
import { CubePreview } from './CubePreview';
import { useCubeRaycaster } from '../../hooks/useCubeRaycaster';
import { useCubeStore, DEFAULT_SEED } from '../../store/cubeStore';

export function Experience() {
  const controllerRef = useRef<ControllerHandle>(null);
  const playerRef = useRef<PlayerRef>(null);
  const targetHeight = 1.6;
  const { previewPosition } = useCubeRaycaster();
  const regenerateTerrain = useCubeStore((state) => state.regenerateTerrain);

  // State for seed input
  const [seedInput, setSeedInput] = useState(DEFAULT_SEED);

  /**
   * Delay physics activate
   */
  const [pausedPhysics, setPausedPhysics] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      const boundingBox = playerRef.current.boundingBox;

      if (boundingBox) {
        console.log('Character size information updated:', { boundingBox });
      }
    }
  }, [playerRef.current?.boundingBox]);

  // 지형 재생성 핸들러
  const handleRegenerateTerrain = () => {
    regenerateTerrain(seedInput);
  };

  return (
    <>
      <ambientLight intensity={2} />

      {/* Terrain regeneration UI */}
      <Html position={[-0, 0, 0]} calculatePosition={() => [10, 10, 0]} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
        <div className="p-3 bg-black/70 rounded text-white">
          {/* Terrain Generation Settings */}
          <div className="text-sm font-bold mb-2">Terrain Generation Settings</div>
          <div className="flex items-center space-x-2 mb-2">
            {/* Seed: */}
            <label className="text-xs">Seed:</label>
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="px-2 py-1 text-xs rounded bg-gray-800 text-white border border-gray-700"
            />
          </div>
          {/* Regenerate Terrain */}
          <button onClick={handleRegenerateTerrain} className="w-full px-2 py-1 text-xs bg-blue-600 rounded hover:bg-blue-700 transition">
            Regenerate Terrain
          </button>
        </div>
      </Html>

      <Physics debug={false} paused={pausedPhysics}>
        {/* Environment */}
        <Environment preset="sunset" background={false} />
        <Sky sunPosition={[100, 20, 100]} />

        {/* player character with controller */}
        <FreeViewController
          ref={controllerRef}
          targetHeight={targetHeight}
          followLight={{
            position: [20, 30, 10],
            intensity: 1.2,
          }}
          position={[0, 10, 0]}
        >
          <Player ref={playerRef} initState={CharacterState.IDLE} controllerRef={controllerRef} targetHeight={targetHeight} />
        </FreeViewController>

        {/* Ground */}
        <Floor />

        {/* Render instanced cubes (optimized way) */}
        <InstancedCubes />

        {/* Cube Preview */}
        <CubePreview position={previewPosition} />
      </Physics>
    </>
  );
}
