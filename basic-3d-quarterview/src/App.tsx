import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PHYSICS_DEMO, PLAYER } from './config';
import { bindKeyboard } from './game/input';
import { player } from './game/state';
import { CameraRig } from './components/CameraRig';
import { CheckProbe } from './components/CheckProbe';
import { Level } from './components/Level';
import { MobileControls, useIsTouch } from './components/MobileControls';
import { Player } from './components/Player';
import { LazyPhysics } from './physics/LazyPhysics';

const HINT = 'WASD / arrows: move · Shift: run · Space: jump · wheel: zoom';
const TOUCH_HINT = 'stick: move (push to the rim to run) · JUMP';
/** The player's box for the preview check (src/game/check.ts). */
const playerBox = () => ({ pos: player.pos, radius: PLAYER.radius, height: PLAYER.height });

export default function App() {
  const physics = PHYSICS_DEMO || new URLSearchParams(window.location.search).get('physics') === '1';
  const touch = useIsTouch();
  useEffect(bindKeyboard, []);

  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 30, near: 0.1, far: 500, position: [0, 17, 17] }}>
        <Level />
        <Player />
        <CameraRig />
        {physics && <LazyPhysics />}
        <CheckProbe player={playerBox} />
      </Canvas>
      <div data-a8-panel="controls hint" className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white">
        {touch ? TOUCH_HINT : HINT}
      </div>
      <MobileControls touch={touch} />
    </div>
  );
}
