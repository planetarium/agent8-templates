import { Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { MeshStandardMaterial, SphereGeometry, Mesh, Scene } from 'three';
import { useQualityStore } from '../../stores/qualityStore';
import GameEnvironment from './GameEnvironment';

const warmupGeo = new SphereGeometry(0.001, 3, 3);
const warmupMats = [
  new MeshStandardMaterial({ transparent: true, opacity: 0.001, emissive: '#6b8f4e', emissiveIntensity: 2 }),
  new MeshStandardMaterial({ emissive: '#c4a265', emissiveIntensity: 1 }),
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
      {/* Warm ambient for enchanted forest feel */}
      <ambientLight intensity={config.neonLightsEnabled ? 0.5 : 0.8} color="#e8dcc8" />
      {/* Forest environment */}
      <Environment preset="forest" background={false} resolution={config.environmentResolution} />
      {/* Magical forest lights — warm golden/green tones */}
      {config.neonLightsEnabled && (
        <>
          <pointLight position={[20, 12, 20]} intensity={40} color="#c4a265" distance={50} decay={2} />
          <pointLight position={[-20, 12, -20]} intensity={40} color="#6b8f4e" distance={50} decay={2} />
          <pointLight position={[0, 8, 0]} intensity={25} color="#e8d5a3" distance={35} decay={2} />
        </>
      )}
      {/* Subtle fog for mystical atmosphere */}
      <fog attach="fog" args={['#1a2e1a', 40, 120]} />
      <GameEnvironment />
    </>
  );
};

export default Experience;
