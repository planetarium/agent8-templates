import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CAMERA, PHYSICS_DEMO } from './config';
import { Stage } from './components/Stage';
import { LazyPhysics } from './physics/LazyPhysics';

const HINT = 'drag: orbit · right-drag / two fingers: pan · wheel / pinch: zoom · click a cell: move the marker';

export default function App() {
  const physics = PHYSICS_DEMO || new URLSearchParams(window.location.search).get('physics') === '1';

  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: CAMERA.fov, near: 0.1, far: 500, position: CAMERA.position }}>
        <Stage />
        <OrbitControls
          makeDefault
          target={[0, 0, 0]}
          enableDamping
          minDistance={CAMERA.minDistance}
          maxDistance={CAMERA.maxDistance}
          maxPolarAngle={CAMERA.maxPolarAngle}
        />
        {physics && <LazyPhysics />}
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white">{HINT}</div>
    </div>
  );
}
