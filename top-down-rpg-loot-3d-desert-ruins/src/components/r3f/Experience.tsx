import { Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { MeshStandardMaterial, SphereGeometry, Mesh, Scene, FogExp2 } from 'three';
import { useQualityStore } from '../../stores/qualityStore';
import GameEnvironment from './GameEnvironment';

// ─────────────────────────────────────────────────────────────
// ShaderWarmup – compile shaders once at mount to avoid JIT stalls
// ─────────────────────────────────────────────────────────────
const warmupGeo = new SphereGeometry(0.001, 3, 3);
const warmupMats = [
  new MeshStandardMaterial({ transparent: true, opacity: 0.001, emissive: '#cc8830', emissiveIntensity: 2 }),
  new MeshStandardMaterial({ emissive: '#dda050', emissiveIntensity: 1 }),
];

function ShaderWarmup() {
  const { gl, camera } = useThree();

  useEffect(() => {
    const warmupScene = new Scene();
    const meshes = warmupMats.map((mat) => {
      const m = new Mesh(warmupGeo, mat);
      m.position.set(99999, 99999, 99999);
      warmupScene.add(m);
      return m;
    });

    gl.compile(warmupScene, camera);

    return () => {
      meshes.forEach((m) => warmupScene.remove(m));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * DesertHaze – quality-aware warm desert fog
 */
function DesertHaze() {
  const { scene } = useThree();
  const { config } = useQualityStore();

  useEffect(() => {
    scene.fog = new FogExp2('#d4a060', config.fogDensity);
    scene.background = null;
    return () => {
      scene.fog = null;
    };
  }, [scene, config.fogDensity]);

  return null;
}

const Experience = () => {
  const { config } = useQualityStore();

  return (
    <>
      <ShaderWarmup />
      <DesertHaze />
      {/* Warm amber ambient for sun-baked desert base illumination */}
      <ambientLight intensity={0.7} color="#e8c880" />
      {/* Directional light simulating hot desert sun */}
      <directionalLight position={[30, 50, 20]} intensity={0.9} color="#fff0d0" />
      {/* Extra fill light on high quality */}
      {config.lootPointLights && (
        <pointLight position={[0, 5, 0]} intensity={0.8} color="#dda050" distance={60} decay={2} />
      )}
      {/* Environment for reflections */}
      <Environment preset="sunset" background={false} resolution={config.environmentResolution} />
      <GameEnvironment />
    </>
  );
};

export default Experience;
