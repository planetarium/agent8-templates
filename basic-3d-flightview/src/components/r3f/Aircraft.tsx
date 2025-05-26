import { useRef } from 'react';
import { useFrame, GroupProps } from '@react-three/fiber';
import * as THREE from 'three';
import { Trail } from '@react-three/drei';
import { useLocalPlayerStore } from '../../stores/localPlayerStore';

interface AircraftProps extends GroupProps {
  localPlayer?: boolean;
  bodyLength?: number;
  bodyColor?: string;
}

const Aircraft = ({ localPlayer = false, bodyLength = 3, bodyColor = '#f5f5f5', ...props }: AircraftProps) => {
  const helixMeshRef = useRef<THREE.Mesh>(null);
  const tip1Ref = useRef<THREE.Object3D>(null);
  const tip2Ref = useRef<THREE.Object3D>(null);
  const { state } = useLocalPlayerStore();

  useFrame((_, delta) => {
    if (helixMeshRef.current) {
      let rotZ: number;
      if (localPlayer) {
        rotZ = 1.0 * delta * Math.min(60, state.speed);
      } else {
        rotZ = 1.0 * delta * 60;
      }

      helixMeshRef.current.rotation.z -= rotZ;
    }
  });

  return (
    <>
      <group scale={bodyLength}>
        <group position={[0, 0.1, 0]} {...props}>
          {/* Body */}
          <mesh castShadow position={[0, 0.01, 0]}>
            <boxGeometry args={[0.18, 0.18, 1]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          {/* Cockpit Window */}
          <mesh castShadow position={[0, 0.04, -0.32]} renderOrder={1}>
            <boxGeometry args={[0.19, 0.16, 0.22]} />
            <meshStandardMaterial color="skyblue" transparent={true} opacity={0.8} />
          </mesh>
          {/* Nose Cone */}
          <mesh castShadow position={[0, -0.01, -0.54]}>
            <boxGeometry args={[0.13, 0.13, 0.13]} />
            <meshStandardMaterial color="orange" />
          </mesh>
          {/* Wings */}
          <group position={[0, 0.07, -0.066]}>
            <mesh castShadow>
              <boxGeometry args={[1.4, 0.02, 0.26]} />
              <meshStandardMaterial color={bodyColor} />
            </mesh>
            {/* Empty objects at propeller tips to act as targets */}
            <object3D ref={tip1Ref} position={[-0.7, 0, 0]} />
            <object3D ref={tip2Ref} position={[0.7, 0, 0]} />
          </group>
          {/* Tail Wing */}
          <mesh castShadow position={[0, 0.06, 0.44]}>
            <boxGeometry args={[0.533, 0.02, 0.16]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          {/* Tail Fin */}
          <mesh castShadow position={[0, 0.12, 0.42]}>
            <boxGeometry args={[0.02, 0.18, 0.24]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          {/* Propeller */}
          <mesh castShadow ref={helixMeshRef} position={[0, 0, -0.62]} rotation-z={Math.PI / 2}>
            <boxGeometry args={[0.02, 0.4, 0.02]} />
            <meshStandardMaterial color="gray" />
          </mesh>
          {/* Trails targeting the propeller tips */}
          <Trail width={1 * bodyLength} color="#dddddd" length={1} decay={1} attenuation={(width) => width * 0.5} target={tip1Ref} />
          <Trail width={1 * bodyLength} color="#dddddd" length={1} decay={1} attenuation={(width) => width * 0.5} target={tip2Ref} />
        </group>
      </group>
    </>
  );
};

export default Aircraft;
