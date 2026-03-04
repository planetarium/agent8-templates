import { Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { MeshStandardMaterial, SphereGeometry, Mesh, Scene } from 'three';
import { useQualityStore } from '../../stores/qualityStore';
import GameEnvironment from './GameEnvironment';

// ─────────────────────────────────────────────────────────────
// ShaderWarmup
//
// Renders a tiny invisible scene on mount to force Three.js to
// compile all shader variants used by the game (transparent
// MeshStandardMaterial, emissive materials, etc.).
//
// Without this, shaders are compiled JIT on first use, which
// causes a frame-rate spike on the first collect effect.
// ─────────────────────────────────────────────────────────────
const warmupGeo = new SphereGeometry(0.001, 3, 3);
const warmupMats = [
  // Transparent + emissive (particle shader)
  new MeshStandardMaterial({ transparent: true, opacity: 0.001, emissive: '#4488ff', emissiveIntensity: 2 }),
  // Opaque emissive (crystal shader)
  new MeshStandardMaterial({ emissive: '#44ff88', emissiveIntensity: 1 }),
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

const Experience = () => {
  const { config } = useQualityStore();

  return (
    <>
      <ShaderWarmup />
      <ambientLight intensity={0.7} />
      {/* resolution scales with quality — lower = less IBL memory */}
      <Environment preset="sunset" background={false} resolution={config.environmentResolution} />
      <GameEnvironment />
    </>
  );
};

export default Experience;
