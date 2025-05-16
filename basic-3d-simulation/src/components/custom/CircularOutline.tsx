import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

interface CircularOutlineProps {
  object: THREE.Object3D;
  color?: string;
  thickness?: number;
  opacity?: number;
  pulseSpeed?: number;
  scale?: number;
  segments?: number;
  yOffset?: number; // Y-axis offset from the bottom of the object
}

// Circular outline that appears on the ground under an object
const CircularOutline: React.FC<CircularOutlineProps> = ({
  object,
  color = 'cyan',
  thickness = 12,
  opacity = 1,
  pulseSpeed = 0.5,
  scale = 1.08,
  segments = 64,
  yOffset = 0.1, // Default small offset from ground
}) => {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef<number>(0);
  const materials = useRef<THREE.LineBasicMaterial[]>([]);
  const objectWorldPos = useRef(new THREE.Vector3());
  const objectWorldRadius = useRef<number>(1);
  const boundingBoxMin = useRef(new THREE.Vector3());

  // Calculate object world position and radius once on mount and when object changes
  useEffect(() => {
    if (!object) return;

    calculateWorldPositionAndRadius();
  }, [object]);

  // Helper function to calculate world position and radius
  const calculateWorldPositionAndRadius = () => {
    if (!object) return;

    // Get current world position
    object.getWorldPosition(objectWorldPos.current);

    // Calculate object radius
    let radius = 1;

    // Get object world scale
    const worldScale = new THREE.Vector3();
    object.getWorldScale(worldScale);
    const maxScale = Math.max(worldScale.x, worldScale.z); // Only consider XZ plane scale

    // Calculate object's bottom position
    const boundingBox = new THREE.Box3().setFromObject(object);
    boundingBoxMin.current.copy(boundingBox.min);

    // Calculate radius based on geometry type or bounding sphere
    if ('geometry' in object && object.geometry) {
      if (object.geometry instanceof THREE.SphereGeometry) {
        const geometryRadius = object.geometry.parameters?.radius || 1;
        radius = geometryRadius * maxScale;
      } else {
        // Calculate center point in XZ plane
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);

        // Calculate offset in XZ plane only
        const offsetXZ = new THREE.Vector2(center.x - objectWorldPos.current.x, center.z - objectWorldPos.current.z).length();

        // Get box size in XZ plane
        const size = new THREE.Vector3();
        boundingBox.getSize(size);

        // Consider only XZ plane size
        const halfMaxSizeXZ = Math.max(size.x, size.z) / 2;
        radius = Math.max(halfMaxSizeXZ, offsetXZ) * maxScale;
      }
    } else {
      // For non-mesh objects, calculate XZ plane bounds
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      // Calculate offset in XZ plane only
      const offsetXZ = new THREE.Vector2(center.x - objectWorldPos.current.x, center.z - objectWorldPos.current.z).length();

      // Use XZ plane size only
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const xzRadius = Math.max(size.x, size.z) / 2;

      // Calculate final radius considering offset
      radius = Math.max(xzRadius, offsetXZ);
    }

    // Apply scale to radius
    objectWorldRadius.current = radius * scale;
  };

  // Update the circular outline every frame
  useFrame((_, delta) => {
    if (!object || !groupRef.current) return;

    // Always get the latest world position
    object.getWorldPosition(objectWorldPos.current);

    // Update bounding box
    const boundingBox = new THREE.Box3().setFromObject(object);
    boundingBoxMin.current.copy(boundingBox.min);

    // Place directly in scene root to avoid transform inheritance
    if (groupRef.current.parent !== scene) {
      scene.add(groupRef.current);
    }

    // Position at world coordinates with Y at the bottom of the object
    groupRef.current.position.set(objectWorldPos.current.x, boundingBoxMin.current.y + yOffset, objectWorldPos.current.z);

    // Rotate to be parallel with the XZ plane (ground)
    groupRef.current.rotation.set(-Math.PI / 2, 0, 0);

    // Update all circles
    groupRef.current.children.forEach((line, index) => {
      if ((line as THREE.Line).geometry) {
        // Apply slightly different radius to each circle
        const circleRadius = objectWorldRadius.current * (1 + index * 0.015);

        // Update geometry
        const positions = ((line as THREE.Line).geometry as THREE.BufferGeometry).attributes.position.array;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          positions[i * 3] = Math.cos(angle) * circleRadius;
          positions[i * 3 + 1] = Math.sin(angle) * circleRadius;
          positions[i * 3 + 2] = 0;
        }
        ((line as THREE.Line).geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
      }
    });

    // Handle pulse effect
    if (pulseSpeed > 0) {
      timeRef.current += delta * pulseSpeed;
      const pulseFactor = Math.sin(timeRef.current) * 0.5 + 0.5;

      materials.current.forEach((material) => {
        if (material) {
          material.color.setStyle(color);
          material.opacity = opacity * (0.5 + pulseFactor * 0.5);
        }
      });
    }
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (groupRef.current && groupRef.current.parent === scene) {
        scene.remove(groupRef.current);
      }
    };
  }, [scene]);

  // Don't render if no object is provided
  if (!object) return null;

  // Create circle geometry
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle);
    positions[i * 3 + 1] = Math.sin(angle);
    positions[i * 3 + 2] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Create multiple circles for thickness effect
  const circleCount = 10;

  return (
    <group ref={groupRef} renderOrder={999}>
      {Array.from({ length: circleCount }).map((_, index) => {
        // Create material for each circle
        const material = new THREE.LineBasicMaterial({
          color: color,
          linewidth: thickness,
          transparent: true,
          opacity: opacity * (1 - index * 0.03),
          depthTest: false,
          depthWrite: false,
        });

        // Store material reference
        materials.current[index] = material;

        return <primitive key={`outline-${index}`} object={new THREE.Line(geometry, material)} />;
      })}
    </group>
  );
};

export default CircularOutline;
