import * as THREE from 'three';

interface BulletProps {
  position: THREE.Vector3;
}

export function Bullet({ position }: BulletProps) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
    </mesh>
  );
}
