import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CAMERA, FLIGHT, PHYSICS_DEMO } from './config';
import { bindKeyboard } from './game/input';
import { plane } from './game/state';
import { Airplane, Bullets } from './components/Airplane';
import { CheckProbe } from './components/CheckProbe';
import { ChaseCamera } from './components/ChaseCamera';
import { Hud } from './components/Hud';
import { MobileControls, useIsTouch } from './components/MobileControls';
import { World } from './components/World';
import { LazyPhysics } from './physics/LazyPhysics';

const HINT = 'Shift / Ctrl: speed up / down · W / S: nose down / up · A / D: roll · Q / E: yaw · Space: fire · R: reset';
const TOUCH_HINT = 'stick: pitch & roll (up = nose down) · ▲ / ▼: speed · FIRE';
/** The plane's box for the preview check (src/game/check.ts): 4.2 m wingspan, wheels FLIGHT.restHeight below its origin. */
const planeBox = () => ({ pos: { ...plane.pos, y: plane.pos.y - FLIGHT.restHeight }, radius: 2.1, height: 1.2 });

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
        <CheckProbe player={planeBox} />
      </Canvas>
      <div data-a8-panel="controls hint" className="pointer-events-none absolute left-3 top-3 max-w-[60%] rounded bg-black/40 px-2 py-1 text-xs text-white">
        {touch ? TOUCH_HINT : HINT}
      </div>
      <Hud />
      <MobileControls touch={touch} />
    </div>
  );
}
