import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD } from '../config';
import { makeDecor, skyPosition, type GroundDecor, type Shape, type SkyDecor } from '../game/decor';
import { plane } from '../game/state';

const DECOR = makeDecor(WORLD.decor.seed, WORLD.decor.ground, WORLD.decor.sky, WORLD.grass / 2);

/** Unit-sized geometry per shape; instances scale it. */
function unitGeometry(shape: Shape): THREE.BufferGeometry {
  switch (shape) {
    case 'box':
      return new THREE.BoxGeometry(1, 1, 1);
    case 'sphere':
      return new THREE.SphereGeometry(0.5, 12, 8);
    case 'cylinder':
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
    case 'capsule':
      return new THREE.CapsuleGeometry(0.3, 0.4, 4, 10);
  }
}

/** Sun that follows the plane so the shadow camera can stay small. */
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
    const p = plane.pos;
    l.position.set(p.x + 30, p.y + 100, p.z + 30);
    l.target.position.set(p.x, p.y, p.z);
  });
  return (
    <>
      <hemisphereLight args={['#dceeff', '#56703f', 1.1]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2}
        color="#fff3dc"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={250}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
}

/** Ground shapes of one kind as one instanced mesh (static). */
function GroundShapes({ shape, items }: { shape: Shape; items: GroundDecor[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => unitGeometry(shape), [shape]);
  useLayoutEffect(() => {
    const im = mesh.current;
    if (!im) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    items.forEach((d, i) => {
      o.position.set(d.x, d.height / 2, d.z);
      o.rotation.set(0, d.yaw, 0);
      o.scale.set(d.size, d.height, d.size);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, c.set(d.color));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, items.length]} castShadow receiveShadow>
      <meshStandardMaterial roughness={0.8} metalness={0.1} />
    </instancedMesh>
  );
}

/** Sky shapes of one kind as one instanced mesh, drifting in circles every frame. */
function SkyShapes({ shape, items }: { shape: Shape; items: SkyDecor[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => unitGeometry(shape), [shape]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const im = mesh.current;
    if (!im) return;
    const c = new THREE.Color();
    items.forEach((d, i) => im.setColorAt(i, c.set(d.color)));
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [items]);
  useFrame(({ clock }) => {
    const im = mesh.current;
    if (!im) return;
    const t = clock.elapsedTime;
    items.forEach((d, i) => {
      const p = skyPosition(d, t);
      o.position.set(p.x, p.y, p.z);
      o.scale.setScalar(d.size);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, items.length]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.5} />
    </instancedMesh>
  );
}

/** Runway centerline: WORLD.runway.stripes white dashes, one instanced mesh. */
function Stripes() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { length, stripes } = WORLD.runway;
  useLayoutEffect(() => {
    const im = mesh.current;
    if (!im) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < stripes; i++) im.setMatrixAt(i, m.makeTranslation(0, 0.06, -length / 2 + i * (length / stripes)));
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [length, stripes]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, stripes]} receiveShadow>
      <boxGeometry args={[0.4, 0.02, 5]} />
      <meshStandardMaterial color="#ffffff" roughness={1} polygonOffset polygonOffsetFactor={-2} />
    </instancedMesh>
  );
}

function byShape<T extends { shape: Shape }>(list: T[]) {
  const out = new Map<Shape, T[]>();
  for (const d of list) out.set(d.shape, [...(out.get(d.shape) ?? []), d]);
  return [...out.entries()];
}

/** Sky, fog, sun, sea, grass, runway and the seeded decor. */
export function World() {
  const ground = useMemo(() => byShape(DECOR.ground), []);
  const sky = useMemo(() => byShape(DECOR.sky), []);
  return (
    <>
      <Sky sunPosition={[-20, 30, 10]} turbidity={0.8} rayleigh={0.4} distance={4500} />
      <fog attach="fog" args={['#c9dcef', 300, 2600]} />
      <Lights />
      {/* sea, 1 m under the grass */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WORLD.sea, WORLD.sea]} />
        <meshStandardMaterial color="#77aaff" roughness={0.4} />
      </mesh>
      {/* grass: top at y = 0 (the plane's ground, see GroundAt in game/flight.ts) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD.grass, WORLD.grass]} />
        <meshStandardMaterial color="#3d711c" roughness={1} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD.runway.width, WORLD.runway.length]} />
        <meshStandardMaterial color="#51595c" roughness={1} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <Stripes />
      {ground.map(([shape, items]) => (
        <GroundShapes key={shape} shape={shape} items={items} />
      ))}
      {sky.map(([shape, items]) => (
        <SkyShapes key={shape} shape={shape} items={items} />
      ))}
    </>
  );
}
