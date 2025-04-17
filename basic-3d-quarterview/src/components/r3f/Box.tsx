import React, { useRef, useState } from 'react';
import { Mesh } from 'three';
import { RigidBody } from '@react-three/rapier';

interface BoxProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
  onClick?: () => void;
  onRightClick?: () => void;
}

export const Box: React.FC<BoxProps> = ({ position, size = [1, 1, 1], color = 'red', onClick, onRightClick }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: any) => {
    e.stopPropagation();
    // Left-click (button = 0)
    if (e.button === 0 && onClick) {
      onClick();
    }
    // Right-click (button = 2)
    else if (e.button === 2 && onRightClick) {
      onRightClick();
    }
  };

  const handleContextMenu = (e: any) => {
    e.preventDefault(); // Prevent default context menu
  };

  const handlePointerOver = () => {
    setHovered(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
  };

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerDown={handleClick}
        onContextMenu={handleContextMenu}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={size} />
        <meshStandardMaterial color={hovered ? 'yellow' : color} />
      </mesh>
    </RigidBody>
  );
};
