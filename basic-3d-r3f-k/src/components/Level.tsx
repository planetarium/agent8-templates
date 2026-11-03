import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { player } from '../game/state';
import { BOXES, PLATFORM, RAMPS, rampVertices, type Ramp as RampData } from '../game/world';

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

// Wedge faces over the 6 rampVertices corners: 0,1 low edge · 2,3 high bottom · 4,5 high top.
const RAMP_FACES = [0, 1, 5, 0, 5, 4, 0, 4, 2, 1, 3, 5, 2, 4, 5, 2, 5, 3, 0, 2, 3, 0, 3, 1];

function Ramp({ ramp }: { ramp: RampData }) {
  const geometry = useMemo(() => {
    const v = rampVertices(ramp);
    const pos: number[] = [];
    for (const i of RAMP_FACES) pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }, [ramp]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={ramp.color} />
    </mesh>
  );
}

/** The moving platform's mesh, centered on its parent. The variant decides how it moves. */
export function PlatformMesh() {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={PLATFORM.size} />
      <meshStandardMaterial color={PLATFORM.color} />
    </mesh>
  );
}

/** Lights, sky, and the static boxes and ramps from game/world.ts. */
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
      {RAMPS.map((r, i) => (
        <Ramp key={i} ramp={r} />
      ))}
    </>
  );
}
