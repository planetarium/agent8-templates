import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fire, stepBullets, stepFlight, resetFlight, type FlightInput } from '../game/flight';
import { input, readFlight, wantsFire } from '../game/input';
import { gun, plane } from '../game/state';

const stick: FlightInput = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
const WHITE = '#f5f5f5';

/**
 * The plane's look: primitive parts around the origin, nose toward -z, wheels
 * 0.3 m below the origin (FLIGHT.restHeight). To use a model instead, replace
 * this with a drei `useGLTF` scene inside `<Suspense>` (URL in
 * src/assets.json), scaled and turned so its nose points at -z.
 */
function Model({ propeller }: { propeller: RefObject<THREE.Mesh | null> }) {
  return (
    <group>
      {/* fuselage */}
      <mesh position={[0, 0.33, 0]} castShadow>
        <boxGeometry args={[0.54, 0.54, 3]} />
        <meshStandardMaterial color={WHITE} roughness={0.6} />
      </mesh>
      {/* cockpit */}
      <mesh position={[0, 0.42, -0.96]} castShadow>
        <boxGeometry args={[0.57, 0.48, 0.66]} />
        <meshStandardMaterial color="#87ceeb" roughness={0.3} />
      </mesh>
      {/* nose cone */}
      <mesh position={[0, 0.33, -1.72]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.27, 0.45, 12]} />
        <meshStandardMaterial color="#ffa500" roughness={0.6} />
      </mesh>
      {/* propeller */}
      <mesh ref={propeller} position={[0, 0.33, -1.98]} castShadow>
        <boxGeometry args={[0.06, 1.2, 0.06]} />
        <meshStandardMaterial color="#808080" />
      </mesh>
      {/* wings */}
      <mesh position={[0, 0.51, -0.2]} castShadow>
        <boxGeometry args={[4.2, 0.06, 0.78]} />
        <meshStandardMaterial color={WHITE} roughness={0.6} />
      </mesh>
      {/* tail wing and fin */}
      <mesh position={[0, 0.48, 1.32]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.48]} />
        <meshStandardMaterial color={WHITE} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.66, 1.26]} castShadow>
        <boxGeometry args={[0.06, 0.54, 0.72]} />
        <meshStandardMaterial color="#e05a47" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Flight loop (game/flight.ts) + the plane's look. Also fires and moves bullets. */
export function Airplane() {
  const group = useRef<THREE.Group>(null);
  const propeller = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (input.resetRequested) {
      input.resetRequested = false;
      resetFlight(plane);
      gun.bullets.length = 0;
    }
    stepFlight(plane, readFlight(stick), dt);

    const now = performance.now();
    if (wantsFire()) fire(gun, plane, now);
    stepBullets(gun, now, dt);

    const g = group.current;
    if (g) {
      g.position.set(plane.pos.x, plane.pos.y, plane.pos.z);
      g.quaternion.set(plane.quat.x, plane.quat.y, plane.quat.z, plane.quat.w);
    }
    // propeller spins with speed (capped)
    if (propeller.current) propeller.current.rotation.z -= dt * Math.min(60, plane.speed);
  }, -2); // before ChaseCamera (-1), so the camera frames this frame's position

  return (
    <group ref={group}>
      <Model propeller={propeller} />
    </group>
  );
}

const MAX_BULLETS = 8;
const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
const m = new THREE.Matrix4();
const q = new THREE.Quaternion();
const p = new THREE.Vector3();
const one = new THREE.Vector3(1, 1, 1);

/** Live bullets as one instanced mesh (at most MAX_BULLETS at a time: life / cooldown < 3). */
export function Bullets() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useFrame(() => {
    const im = mesh.current;
    if (!im) return;
    for (let i = 0; i < MAX_BULLETS; i++) {
      const b = gun.bullets[i];
      if (!b) {
        im.setMatrixAt(i, hidden);
        continue;
      }
      q.set(b.quat.x, b.quat.y, b.quat.z, b.quat.w);
      im.setMatrixAt(i, m.compose(p.set(b.pos.x, b.pos.y, b.pos.z), q, one));
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_BULLETS]} frustumCulled={false}>
      <boxGeometry args={[0.15, 0.15, 0.9]} />
      <meshStandardMaterial color="#ffcc33" emissive="#ff9900" emissiveIntensity={2} />
    </instancedMesh>
  );
}
