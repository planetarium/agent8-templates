import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { player } from '../game/state';
import { BOXES, FIELDS, RAMPS, rampVertices, type HeightField, type Ramp as RampData } from '../game/world';

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

/** Grid spacing (m) of a height field's mesh. */
const FIELD_STEP = 0.5;

/** A height field drawn as a plane displaced by heightAt (the player collides with heightAt itself). */
function Field({ field }: { field: HeightField }) {
  const geometry = useMemo(() => {
    const w = field.maxX - field.minX;
    const d = field.maxZ - field.minZ;
    const nx = Math.max(1, Math.ceil(w / FIELD_STEP));
    const nz = Math.max(1, Math.ceil(d / FIELD_STEP));
    const g = new THREE.PlaneGeometry(w, d, nx, nz);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + (field.minX + field.maxX) / 2;
      const z = pos.getZ(i) + (field.minZ + field.maxZ) / 2;
      pos.setXYZ(i, x, field.heightAt(x, z), z);
    }
    g.computeVertexNormals();
    return g;
  }, [field]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={field.color ?? '#7fb069'} />
    </mesh>
  );
}

/** Lights, sky, and the static boxes, ramps and height fields from game/world.ts (any of them may be empty). */
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
      {FIELDS.map((f, i) => (
        <Field key={i} field={f} />
      ))}
    </>
  );
}
