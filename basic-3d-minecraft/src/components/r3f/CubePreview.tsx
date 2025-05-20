import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import useCubeStore from '../../stores/cubeStore';
import SingleCube from './SingleCube';

interface CubePreviewProps {
  position: [number, number, number] | null;
}

const CubePreview = ({ position }: CubePreviewProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const selectedTile = useCubeStore((state) => state.selectedTile);

  // Update position when the position changes
  useEffect(() => {
    if (groupRef.current && position) {
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.visible = true;
    } else if (groupRef.current) {
      groupRef.current.visible = false;
    }
  }, [position]);

  return (
    <group ref={groupRef} visible={!!position}>
      <SingleCube tileIndex={selectedTile} scale={1.03} position={[0, 0, 0]} rotation={[0, 0, 0]} opacity={0.7} />
    </group>
  );
};

export default CubePreview;
