import { useRef } from 'react';
import { Mesh } from 'three';

// Renamed from Floor to Sea and positioned in the middle of the terrain
const Water = () => {
  const meshRef = useRef<Mesh>(null);

  // Position in the middle of the terrain (baseHeight + amplitude/2 = about 15)
  const seaLevel = 10;

  return (
    <mesh ref={meshRef} receiveShadow position={[0, seaLevel, 0]} rotation-x={-Math.PI / 2} userData={{ type: 'fixed', isSea: true }}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial
        color="#0077be" // Sea color
        transparent={true}
        opacity={0.6} // Semi-transparent
      />
    </mesh>
  );
};

export default Water;
