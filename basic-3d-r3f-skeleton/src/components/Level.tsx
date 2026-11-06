import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { player } from '../game/state';
import { BOXES } from '../game/world';

/** Sun that follows the player so the shadow camera can stay small. */
function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useEffect(() => {
    const l = sun.current;
    if (!l) return;
    scene.add(l.target);
    return () => {
      scene.remove(l.target);
    };
  }, [scene]);
  useFrame(() => {
    const l = sun.current;
    if (!l) return;
    const p = player.pos;
    l.position.set(p.x + 10, p.y + 20, p.z + 8);
    l.target.position.set(p.x, p.y, p.z);
  });
  return (
    <>
      <hemisphereLight args={['#dceeff', '#6b5a43', 0.9]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2.2}
        color="#fff3dc"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
}

/** Lights, sky and the static boxes from game/world.ts. */
export function Level() {
  return (
    <>
      <Sky sunPosition={[100, 40, 80]} turbidity={4} rayleigh={1.2} />
      <fog attach="fog" args={['#cfe3f5', 40, 120]} />
      <Lights />
      {BOXES.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow={i > 0} receiveShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={b.color} />
        </mesh>
      ))}
    </>
  );
}
