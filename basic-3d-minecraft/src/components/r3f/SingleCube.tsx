import { useRef } from 'react';
import * as THREE from 'three';
import { getColorByFace, getThreeColor } from '../../utils/colorUtils';

interface SingleCubeProps {
  tileIndex: number;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  opacity?: number;
}

// Single cube rendering component
const SingleCube: React.FC<SingleCubeProps> = ({ tileIndex, scale = 1, position = [0, 0, 0], rotation = [0.5, 0.8, 0], opacity = 1 }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate cube face colors (0: front, 1: right, 2: back, 3: left, 4: top, 5: bottom)
  const colorFront = getColorByFace(tileIndex, 0); // front
  const colorRight = getColorByFace(tileIndex, 1); // right
  const colorBack = getColorByFace(tileIndex, 2); // back
  const colorLeft = getColorByFace(tileIndex, 3); // left
  const colorTop = getColorByFace(tileIndex, 4); // top
  const colorBottom = getColorByFace(tileIndex, 5); // bottom

  // Create materials for each face with improved transparency
  const createMaterial = (color: { r: number; g: number; b: number }) => {
    if (opacity < 1) {
      // For translucent preview mode
      return new THREE.MeshBasicMaterial({
        color: getThreeColor(color),
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    } else {
      // For normal mode
      return new THREE.MeshStandardMaterial({
        color: getThreeColor(color),
        transparent: false,
      });
    }
  };

  // Using custom materials for better transparency
  return (
    <mesh ref={meshRef} scale={[scale, scale, scale]} position={position} rotation={rotation}>
      <boxGeometry args={[1, 1, 1]} />
      <group>
        {/* Front */}
        <mesh position={[0, 0, 0.51]} renderOrder={opacity < 1 ? 1000 : 0}>
          <planeGeometry args={[1, 1]} />
          <primitive object={createMaterial(colorFront)} attach="material" />
        </mesh>

        {/* Back */}
        <mesh position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]} renderOrder={opacity < 1 ? 1000 : 0}>
          <planeGeometry args={[1, 1]} />
          <primitive object={createMaterial(colorBack)} attach="material" />
        </mesh>

        {/* Right */}
        <mesh position={[0.51, 0, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={opacity < 1 ? 1000 : 0}>
          <planeGeometry args={[1, 1]} />
          <primitive object={createMaterial(colorRight)} attach="material" />
        </mesh>

        {/* Left */}
        <mesh position={[-0.51, 0, 0]} rotation={[0, -Math.PI / 2, 0]} renderOrder={opacity < 1 ? 1000 : 0}>
          <planeGeometry args={[1, 1]} />
          <primitive object={createMaterial(colorLeft)} attach="material" />
        </mesh>

        {/* Top */}
        <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={opacity < 1 ? 1000 : 0}>
          <planeGeometry args={[1, 1]} />
          <primitive object={createMaterial(colorTop)} attach="material" />
        </mesh>

        {/* Bottom */}
        <mesh position={[0, -0.51, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={opacity < 1 ? 1000 : 0}>
          <planeGeometry args={[1, 1]} />
          <primitive object={createMaterial(colorBottom)} attach="material" />
        </mesh>
      </group>
    </mesh>
  );
};

export default SingleCube;
