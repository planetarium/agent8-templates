import { useRef, useState } from 'react';
import { useGame } from 'vibe-starter-3d-ctrl';
import { RigidBody } from '@react-three/rapier';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

export const Floor = () => {
  const date = useRef(Date.now());
  const setMoveToPoint = useGame((state) => state.setMoveToPoint);
  const circleRef = useRef<Mesh>(null);

  // State variables for click effect
  const [clickEffect, setClickEffect] = useState(false);
  const [clickPosition, setClickPosition] = useState<Vector3 | null>(null);
  const [effectScale, setEffectScale] = useState(1);
  const effectRingRef = useRef<Mesh>(null);

  // Click effect animation
  useFrame(() => {
    if (clickEffect && effectRingRef.current) {
      setEffectScale((prev) => {
        const newScale = prev - 0.04; // Slower shrinking rate
        if (newScale <= 0) {
          setClickEffect(false);
          return 1;
        }
        return newScale;
      });

      // Scale the ring
      effectRingRef.current.scale.x = effectScale;
      effectRingRef.current.scale.y = effectScale;
    }
  });

  return (
    <>
      {/* Minimal click effect ring */}
      {clickEffect && clickPosition && (
        <mesh ref={effectRingRef} position={[clickPosition.x, clickPosition.y + 0.01, clickPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35]} /> {/* Thinner ring */}
          <meshBasicMaterial color="#e0e0e0" transparent opacity={0.4 * effectScale} />
        </mesh>
      )}

      <RigidBody type="fixed" colliders="trimesh">
        <group>
          <mesh
            onPointerMove={({ point }) => {
              if (circleRef.current) {
                circleRef.current.position.z = point.z;
                circleRef.current.position.x = point.x;
                circleRef.current.position.y = point.y + 0.01;
              }
            }}
            onPointerDown={() => {
              date.current = Date.now();
            }}
            onPointerUp={({ point }) => {
              if (Date.now() - date.current < 200) {
                // A quick click
                setMoveToPoint(point);

                // Show click effect
                setClickPosition(new Vector3(point.x, point.y, point.z));
                setEffectScale(1);
                setClickEffect(true);
              }
            }}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            position={[0, 0, 0]}
          >
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#3f3f3f" />
          </mesh>
        </group>
      </RigidBody>
    </>
  );
};
