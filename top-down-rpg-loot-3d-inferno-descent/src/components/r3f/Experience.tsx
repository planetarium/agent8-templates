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
  new MeshStandardMaterial({ transparent: true, opacity: 0.001, emissive: '#ff4400', emissiveIntensity: 2 }),
  new MeshStandardMaterial({ emissive: '#ff8800', emissiveIntensity: 1 }),
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
 * InfernalFog – quality-aware volcanic fog
 */
function InfernalFog() {
  const { scene } = useThree();
  const { config } = useQualityStore();

  useEffect(() => {
    scene.fog = new FogExp2('#1a0500', config.fogDensity);
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
      <InfernalFog />
      {/* Single warm ambient for base illumination */}
      <ambientLight intensity={0.5} color="#ff8866" />
      {/* One directional for overall scene lighting (replaces 3 point lights on low/med) */}
      <directionalLight position={[20, 40, 10]} intensity={0.8} color="#ff6633" />
      {/* Only add extra point lights on high quality */}
      {config.lootPointLights && (
        <pointLight position={[0, -3, 0]} intensity={1.5} color="#ff4400" distance={60} decay={2} />
      )}
      {/* Environment for reflections – resolution scales with quality */}
      <Environment preset="sunset" background={false} resolution={config.environmentResolution} />
      <GameEnvironment />
    </>
  );
};

export default Experience;
