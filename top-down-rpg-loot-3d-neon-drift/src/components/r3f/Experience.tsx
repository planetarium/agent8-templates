import { Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { MeshStandardMaterial, SphereGeometry, Mesh, Scene } from 'three';
import { useQualityStore } from '../../stores/qualityStore';
import GameEnvironment from './GameEnvironment';

const warmupGeo = new SphereGeometry(0.001, 3, 3);
const warmupMats = [
  new MeshStandardMaterial({ transparent: true, opacity: 0.001, emissive: '#ff00ff', emissiveIntensity: 2 }),
  new MeshStandardMaterial({ emissive: '#00ffff', emissiveIntensity: 1 }),
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
    return () => { meshes.forEach((m) => warmupScene.remove(m)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const Experience = () => {
  const { config } = useQualityStore();
  return (
    <>
      <ShaderWarmup />
      <ambientLight intensity={0.3} color="#6633aa" />
      <ambientLight intensity={0.2} color="#00ffff" />
      <Environment preset="night" background={false} resolution={config.environmentResolution} />
      <fog attach="fog" args={['#0a0014', 40, 120]} />
      <GameEnvironment />
    </>
  );
};

export default Experience;
