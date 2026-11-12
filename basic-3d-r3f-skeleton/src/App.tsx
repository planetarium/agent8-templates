import { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PHYSICS_DEMO, resolveViewMode } from './config';
import { bindKeyboard } from './game/input';
import { CameraRig } from './components/CameraRig';
import { Level } from './components/Level';
import { MobileControls, useIsTouch } from './components/MobileControls';
import { Player } from './components/Player';
import { LazyPhysics } from './physics/LazyPhysics';

const HINT = {
  freeview: 'WASD / arrows: move · Space: jump · drag: look · wheel: zoom',
  sideview: 'A / D or ← / →: move · Space: jump',
};
const TOUCH_HINT = {
  freeview: 'stick: move · JUMP · drag: look',
  sideview: 'stick: move · JUMP',
};

export default function App() {
  const mode = useMemo(resolveViewMode, []);
  const physics = PHYSICS_DEMO || new URLSearchParams(window.location.search).get('physics') === '1';
  const touch = useIsTouch();
  useEffect(bindKeyboard, []);

  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 55, near: 0.1, far: 500, position: [0, 4, 10] }}>
        <Level />
        <Player mode={mode} />
        <CameraRig mode={mode} />
        {physics && <LazyPhysics />}
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white">
        {mode} · {(touch ? TOUCH_HINT : HINT)[mode]}
      </div>
      <MobileControls horizontalOnly={mode === 'sideview'} touch={touch} />
    </div>
  );
}
