import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PHYSICS_DEMO } from './config';
import { bindKeyboard } from './game/input';
import { CameraRig } from './components/CameraRig';
import { Level } from './components/Level';
import { MobileControls, useIsTouch } from './components/MobileControls';
import { Player } from './components/Player';
import { LazyPhysics } from './physics/LazyPhysics';

const HINT = 'A / D or ← / →: move · Shift: run · Space: jump';
const TOUCH_HINT = 'stick left / right: move (push to the rim to run) · JUMP';

export default function App() {
  const physics = PHYSICS_DEMO || new URLSearchParams(window.location.search).get('physics') === '1';
  const touch = useIsTouch();
  useEffect(bindKeyboard, []);

  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 55, near: 0.1, far: 500, position: [0, 2.2, 12] }}>
        <Level />
        <Player />
        <CameraRig />
        {physics && <LazyPhysics />}
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white">
        {touch ? TOUCH_HINT : HINT}
      </div>
      <MobileControls touch={touch} />
    </div>
  );
}
