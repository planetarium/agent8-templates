import { useMemo, useRef, ElementRef } from 'react';
import * as THREE from 'three';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';

// Define movement types
type MovementType = 'oscillate' | 'circle' | 'drift';

// Define movement parameter types
interface MovementParams {
  amplitude?: number;
  speed?: number;
  radius?: number;
  direction?: THREE.Vector3;
}

// Define object types
type FloatingObjectType = 'balloon' | 'bird' | 'plane';

// Define object data type (includes movement information)
interface FloatingObjectData {
  id: number;
  type: FloatingObjectType;
  position: [number, number, number];
  color: string;
  scale: number;
  movementType: MovementType;
  movementParams: MovementParams;
}

// Render each object type and move it
const FloatingObject = ({ data }: { data: FloatingObjectData }) => {
  // Try using ElementRef<typeof RigidBody>
  const rigidBodyRef = useRef<ElementRef<typeof RigidBody>>(null!);
  const initialPosition = useRef(new THREE.Vector3(...data.position)).current;
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const driftDirection = useRef(data.movementParams.direction?.clone() || new THREE.Vector3(0, 0, 0)).current;

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const t = state.clock.elapsedTime;
    const { movementType, movementParams } = data;
    const nextPosition = new THREE.Vector3();

    const currentPositionVec = rigidBodyRef.current.translation();
    nextPosition.set(currentPositionVec.x, currentPositionVec.y, currentPositionVec.z);

    switch (movementType) {
      case 'circle': {
        const speed = movementParams.speed || 0.2;
        const radius = movementParams.radius || 15;
        angleRef.current += speed * delta;
        nextPosition.x = initialPosition.x + Math.cos(angleRef.current) * radius;
        nextPosition.z = initialPosition.z + Math.sin(angleRef.current) * radius;
        nextPosition.y = initialPosition.y + Math.sin(t * (movementParams.speed || 0.2) * 0.5 + initialPosition.x) * (movementParams.amplitude || 3);
        break;
      }

      case 'drift':
        nextPosition.set(
          currentPositionVec.x + driftDirection.x * (movementParams.speed || 10) * delta,
          currentPositionVec.y + driftDirection.y * (movementParams.speed || 2) * delta,
          currentPositionVec.z + driftDirection.z * (movementParams.speed || 10) * delta,
        );
        break;

      case 'oscillate':
      default: {
        const amplitude = movementParams.amplitude || 5;
        nextPosition.y = initialPosition.y + Math.sin(t * (movementParams.speed || 0.5) + initialPosition.x) * amplitude;
        nextPosition.x = currentPositionVec.x;
        nextPosition.z = currentPositionVec.z;
        break;
      }
    }
    // Check if translation() and setNextKinematicTranslation() methods exist (use any if not)
    rigidBodyRef.current.setNextKinematicTranslation(nextPosition);
  });

  let geometry: React.ReactNode;
  let colliderArgs: [number] = [data.scale * 1.5];

  switch (data.type) {
    case 'balloon':
      geometry = (
        <group>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[data.scale * 1.5, 32, 32]} />
            <meshStandardMaterial color={data.color} />
          </mesh>
          <mesh position={[0, -data.scale * 1.5, 0]}>
            <coneGeometry args={[data.scale * 0.8, data.scale, 8]} />
            <meshStandardMaterial color="saddlebrown" />
          </mesh>
        </group>
      );
      colliderArgs = [data.scale * 1.5];
      break;
    case 'bird':
      geometry = (
        <group rotation={[0, Math.random() * Math.PI * 2, 0]}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 12]}>
            <boxGeometry args={[data.scale * 3, data.scale * 0.2, data.scale * 0.5]} />
            <meshStandardMaterial color={data.color} />
          </mesh>
          <mesh position={[data.scale * 1.5, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <boxGeometry args={[data.scale * 3, data.scale * 0.2, data.scale * 0.5]} />
            <meshStandardMaterial color={data.color} />
          </mesh>
        </group>
      );
      colliderArgs = [data.scale * 1.5];
      break;
    case 'plane':
    default:
      geometry = (
        <group rotation={[0, Math.random() * Math.PI * 2, 0]}>
          {/* 몸체 */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[data.scale * 3, data.scale * 0.8, data.scale]} />
            <meshStandardMaterial color={data.color} />
          </mesh>
          {/* 날개 */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[data.scale * 0.5, data.scale * 0.2, data.scale * 4]} />
            <meshStandardMaterial color="lightgray" />
          </mesh>
        </group>
      );
      colliderArgs = [data.scale * 2];
      break;
  }

  return (
    <RigidBody key={data.id} ref={rigidBodyRef} type="kinematicPosition" colliders={false} position={data.position}>
      <BallCollider args={colliderArgs} />
      <group>{geometry}</group>
    </RigidBody>
  );
};

const FloatingShapes = () => {
  const objectsData = useMemo(() => {
    const dataArray: FloatingObjectData[] = [];
    const count = 150;
    const types: FloatingObjectType[] = ['balloon', 'bird', 'plane'];
    const colors = ['red', 'blue', 'yellow', 'white', 'orange', 'purple', 'pink', 'cyan'];
    const movementTypes: MovementType[] = ['oscillate', 'circle', 'drift'];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 3000;
      const y = Math.random() * 300 + 100;
      const z = (Math.random() - 0.5) * 3000;

      const type = types[Math.floor(Math.random() * types.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const scale = Math.random() * 5 + 5;

      const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
      let movementParams: MovementParams = {};
      switch (movementType) {
        case 'circle':
          movementParams = {
            radius: Math.random() * 10 + 10,
            speed: Math.random() * 0.3 + 0.1,
            amplitude: Math.random() * 4 + 1,
          };
          break;
        case 'drift':
          movementParams = {
            direction: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 2).normalize(),
            speed: Math.random() * 20 + 10,
          };
          break;
        case 'oscillate':
        default:
          movementParams = {
            amplitude: Math.random() * 8 + 2,
            speed: Math.random() * 0.5 + 0.2,
          };
          break;
      }

      dataArray.push({
        id: i,
        type,
        position: [x, y, z],
        color,
        scale,
        movementType,
        movementParams,
      });
    }
    return dataArray;
  }, []);

  return (
    <>
      {objectsData.map((data) => (
        <FloatingObject key={data.id} data={data} />
      ))}
    </>
  );
};

export default FloatingShapes;
