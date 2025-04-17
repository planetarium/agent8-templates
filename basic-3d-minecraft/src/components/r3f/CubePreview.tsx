import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useCubeStore } from '../../store/cubeStore';
import { getTileTexture } from '../../utils/tileTextureLoader';

interface CubePreviewProps {
  position: [number, number, number] | null;
}

export function CubePreview({ position }: CubePreviewProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedTile = useCubeStore((state) => state.selectedTile);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Load texture when the selected tile changes
  useEffect(() => {
    const loadTexture = async () => {
      try {
        const newTexture = await getTileTexture(selectedTile);
        setTexture(newTexture);
      } catch (error) {
        console.error('CubePreview texture loading failed:', error);
      }
    };

    loadTexture();
  }, [selectedTile]);

  // Update mesh position when the position changes
  useEffect(() => {
    if (meshRef.current && position) {
      meshRef.current.position.set(position[0], position[1], position[2]);
      meshRef.current.visible = true;
    } else if (meshRef.current) {
      meshRef.current.visible = false;
    }
  }, [position]);

  return (
    <mesh ref={meshRef} visible={!!position}>
      <boxGeometry args={[1.03, 1.03, 1.03]} />
      {texture ? (
        <meshStandardMaterial map={texture} transparent={true} opacity={0.5} depthWrite={false} side={THREE.DoubleSide} color="deepskyblue" />
      ) : (
        <meshBasicMaterial color="deepskyblue" transparent={true} opacity={0.3} depthWrite={false} />
      )}
    </mesh>
  );
}
