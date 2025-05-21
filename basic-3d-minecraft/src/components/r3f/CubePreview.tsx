import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import useCubeStore from '../../stores/cubeStore';
import SingleCube from './SingleCube';

interface CubePreviewProps {
  position: [number, number, number] | null;
}

/**
 * Cube preview component
 *
 * Important: Must use the same position calculation method as InstancedCube
 * Terrain generation and InstancedCube operate by passing the position directly
 */
const CubePreview = ({ position }: CubePreviewProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const selectedTile = useCubeStore((state) => state.selectedTile);

  // Update position when the position changes
  useEffect(() => {
    if (groupRef.current && position) {
      // Apply integer coordinates directly
      // Process in the same way as InstancedCube rendering
      // In Three.js, boxGeometry is internally defined as a -0.5~0.5 sized cube with center at origin
      // Using raw coordinates places the center of the boxGeometry at that coordinate
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.visible = true;
    } else if (groupRef.current) {
      groupRef.current.visible = false;
    }
  }, [position]);

  return (
    <group ref={groupRef} visible={!!position}>
      {/* Create SingleCube component with position 0, 0, 0 - position determined by groupRef's position */}
      <SingleCube tileIndex={selectedTile} scale={1.03} position={[0, 0, 0]} rotation={[0, 0, 0]} opacity={0.7} />
    </group>
  );
};

export default CubePreview;
