import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { bindKeyboard } from './game/input';
import { CameraRig } from './components/CameraRig';
import { Level } from './components/Level';
import { MobileControls, useIsTouch } from './components/MobileControls';
import { Player } from './components/Player';
import { World } from './physics/World';

const HINT = 'WASD / arrows: move · Shift: run · Space: jump · drag: look · wheel: zoom';
const TOUCH_HINT = 'stick: move (push to the rim to run) · JUMP · drag: look';

export default function App() {
  const touch = useIsTouch();
  useEffect(bindKeyboard, []);

  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 55, near: 0.1, far: 500, position: [0, 4, 10] }}>
        <Level />
        {/* rapier's wasm loads before the world appears */}
        <Suspense fallback={null}>
          <Physics>
            <World />
            <Player />
          </Physics>
        </Suspense>
        <CameraRig />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white">
        {touch ? TOUCH_HINT : HINT}
      </div>
      <MobileControls touch={touch} />
    </div>
  );
}
