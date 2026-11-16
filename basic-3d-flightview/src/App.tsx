import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CAMERA, PHYSICS_DEMO } from './config';
import { bindKeyboard } from './game/input';
import { Airplane, Bullets } from './components/Airplane';
import { ChaseCamera } from './components/ChaseCamera';
import { Hud } from './components/Hud';
import { MobileControls, useIsTouch } from './components/MobileControls';
import { World } from './components/World';
import { LazyPhysics } from './physics/LazyPhysics';

const HINT = 'Shift / Ctrl: speed up / down · W / S: nose down / up · A / D: roll · Q / E: yaw · Space: fire · R: reset';
const TOUCH_HINT = 'stick: pitch & roll (up = nose down) · ▲ / ▼: speed · FIRE';

export default function App() {
  const physics = PHYSICS_DEMO || new URLSearchParams(window.location.search).get('physics') === '1';
  const touch = useIsTouch();
  useEffect(bindKeyboard, []);

  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: CAMERA.fov, near: 0.5, far: CAMERA.far, position: [0, 3, 15] }}>
        <World />
        <Airplane />
        <Bullets />
        <ChaseCamera />
        {physics && <LazyPhysics />}
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 max-w-[60%] rounded bg-black/40 px-2 py-1 text-xs text-white">
        {touch ? TOUCH_HINT : HINT}
      </div>
      <Hud />
      <MobileControls touch={touch} />
    </div>
  );
}
