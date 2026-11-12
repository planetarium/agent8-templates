import { useEffect, useRef } from 'react';
import { PHYSICS_DEMO } from './config';
import { bindKeyboard } from './game/input';
import { createGame } from './three/engine';
import { MobileControls, useIsTouch } from './ui/MobileControls';

const HINT = 'WASD / arrows: move · Shift: run · Space: jump · drag: look · wheel: zoom';
const TOUCH_HINT = 'stick: move (push to the rim to run) · JUMP · drag: look';

/** React draws only the HUD; the 3D scene is plain three.js (src/three/engine.ts) mounted into a div. */
export default function App() {
  const physics = PHYSICS_DEMO || new URLSearchParams(window.location.search).get('physics') === '1';
  const touch = useIsTouch();
  const view = useRef<HTMLDivElement>(null);
  useEffect(bindKeyboard, []);
  useEffect(() => createGame(view.current!, { physics }), [physics]);

  return (
    <div className="relative h-full w-full">
      <div ref={view} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white">
        {touch ? TOUCH_HINT : HINT}
      </div>
      <MobileControls touch={touch} />
    </div>
  );
}
