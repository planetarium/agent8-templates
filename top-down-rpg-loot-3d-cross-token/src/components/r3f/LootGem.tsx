import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { GemData } from '../../stores/gameStore';

interface LootGemProps {
  gem: GemData;
  onCollect: (id: string) => void;
}

const GEM_COLORS: Record<string, string> = {
  gem: '#44aaff',
  rareGem: '#aa44ff',
  epicGem: '#ffaa00',
};

const LIFE_COLOR = '#ff4466';

/**
 * LootGem — collectible 3D gem that bobs and rotates.
 * Uses a sensor RigidBody so the player's onTriggerEnter fires on overlap.
 * [CHANGE] Replace gem geometry/colors to match your concept.
 */
const LootGem: React.FC<LootGemProps> = ({ gem, onCollect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(Math.random() * Math.PI * 2); // random phase offset

  useFrame((_, delta) => {
    timeRef.current += delta * 2;
    if (meshRef.current) {
      meshRef.current.position.y = gem.position[1] + 0.3 + Math.sin(timeRef.current) * 0.15;
      meshRef.current.rotation.y += delta * 2;
    }
  });

  const color = gem.isLife ? LIFE_COLOR : (GEM_COLORS[gem.type] || GEM_COLORS.gem);

  return (
    <RigidBody
      type="fixed"
      sensor={true}
      position={gem.position}
      userData={{ type: 'ITEM', gemId: gem.id, isLife: gem.isLife }}
      onIntersectionEnter={() => onCollect(gem.id)}
    >
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
    </RigidBody>
  );
};

export default LootGem;
