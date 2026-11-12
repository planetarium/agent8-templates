import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CAMERA, PHYSICS_DEMO } from './config';
import { bindKeyboard } from './game/input';
import { CameraRig } from './components/CameraRig';
import { Level } from './components/Level';
import { MobileControls, useIsTouch } from './components/MobileControls';
import { Player } from './components/Player';
import { LazyPhysics } from './physics/LazyPhysics';

const HINT = 'click: lock mouse (Esc frees it) · mouse: look · WASD / arrows: move · Shift: run · Space: jump';
const TOUCH_HINT = 'stick: move (push to the rim to run) · JUMP · drag: look';

export default function App() {
  const physics = PHYSICS_DEMO || new URLSearchParams(window.location.search).get('physics') === '1';
  const touch = useIsTouch();
  useEffect(bindKeyboard, []);

  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: CAMERA.fp.fov, near: 0.05, far: 500, position: [0, CAMERA.fp.eyeHeight, 0] }}>
        <Level />
        <Player />
        <CameraRig />
        {physics && <LazyPhysics />}
      </Canvas>
      {/* crosshair */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white">
        {touch ? TOUCH_HINT : HINT}
      </div>
      <MobileControls touch={touch} />
    </div>
  );
}
