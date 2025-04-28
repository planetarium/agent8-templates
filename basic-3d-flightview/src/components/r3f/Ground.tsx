import { useMemo } from 'react';
import * as THREE from 'three';
import { interactionGroups, RigidBody } from '@react-three/rapier';
import { CollisionGroup } from 'vibe-starter-3d';

type SimpleObject = {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotationY: number;
  geometryType: 'box' | 'sphere' | 'cone';
  color: THREE.Color;
};

export const Ground = () => {
  // Generate object data to scatter on the ground (optimized with useMemo)
  const objects = useMemo<SimpleObject[]>(() => {
    const tempObjects: SimpleObject[] = [];
    const count = 500;
    const planeSize = 1000;
    const runwayWidth = 6;
    const minScale = 1.0;
    const maxScale = 4.0;
    const colors = [
      new THREE.Color('#5a8a38'), // Dark Green
      new THREE.Color('#6b9c46'), // Medium Green
      new THREE.Color('#88ab6c'), // Light Green
      new THREE.Color('#8b4513'), // Brown
      new THREE.Color('#a0522d'), // Sienna
    ];
    const geometryTypes: SimpleObject['geometryType'][] = ['box', 'sphere', 'cone'];

    for (let i = 0; i < count; i++) {
      // Calculate X position avoiding the runway area
      let x = (Math.random() - 0.5) * planeSize;
      if (Math.abs(x) < runwayWidth / 2 + 5) {
        // Do not generate within 5 units near the runway
        x = Math.sign(x) * (runwayWidth / 2 + 5 + Math.random() * (planeSize / 2 - runwayWidth / 2 - 5));
      }
      const z = (Math.random() - 0.5) * planeSize;

      const scaleFactor = THREE.MathUtils.randFloat(minScale, maxScale);
      const scale = new THREE.Vector3(scaleFactor, scaleFactor * THREE.MathUtils.randFloat(0.8, 1.5), scaleFactor);

      const position = new THREE.Vector3(x, scale.y / 2, z);

      const rotationY = Math.random() * Math.PI * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const geometryType = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];

      tempObjects.push({ position, scale, rotationY, geometryType, color });
    }
    return tempObjects;
  }, []);

  return (
    <>
      <RigidBody name="SEA" type="fixed" colliders={'cuboid'}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} scale={[10000, 10000, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#77aaff" />
        </mesh>
      </RigidBody>

      <RigidBody name="GROUND" type="fixed" colliders={'cuboid'}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} scale={[1000, 1000, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#3d711c" polygonOffset polygonOffsetFactor={-20.0} polygonOffsetUnits={-40.0} />
        </mesh>
      </RigidBody>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={[6, 1000, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#51595c" polygonOffset polygonOffsetFactor={-20.0} polygonOffsetUnits={-80.0} />
      </mesh>

      {/* Runway Markings */}
      {Array.from({ length: 100 }).map((_, i) => {
        const zPosition = -500 + i * 10;
        return (
          <mesh
            key={`runway-line-${i}`}
            receiveShadow
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.011, zPosition]}
            scale={[0.4, 5, 1]} // X: length, Y: width (relative to geometry)
          >
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              color="#ffffff"
              polygonOffset
              polygonOffsetFactor={-20.0}
              polygonOffsetUnits={-100.0} // Slightly more offset than the runway
            />
          </mesh>
        );
      })}

      {objects.map((obj, index) => (
        <mesh key={index} position={obj.position} scale={obj.scale} rotation={[0, obj.rotationY, 0]} castShadow receiveShadow>
          {obj.geometryType === 'box' && <boxGeometry args={[1, 1, 1]} />}
          {obj.geometryType === 'sphere' && <sphereGeometry args={[0.5, 16, 8]} />} {/* radius, widthSegments, heightSegments */}
          {obj.geometryType === 'cone' && <coneGeometry args={[0.5, 1, 16]} />} {/* radius, height, radialSegments */}
          <meshStandardMaterial color={obj.color} roughness={0.8} metalness={0.1} />
        </mesh>
      ))}

      {/* <RigidBody name="BOX" type="fixed" colliders={'cuboid'} collisionGroups={interactionGroups(CollisionGroup.Environment)}>
        <mesh receiveShadow position={[0, 1, -10]} scale={[2, 2, 2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#3d711c" polygonOffset polygonOffsetFactor={-20.0} polygonOffsetUnits={-40.0} />
        </mesh>
      </RigidBody> */}
    </>
  );
};
