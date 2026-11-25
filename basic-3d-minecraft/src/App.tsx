import { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PHYSICS_DEMO, PLAYER } from './config';
import { bindKeyboard } from './game/input';
import { builder, player } from './game/state';
import type { Block } from './game/voxel';
import { Builder, HOTBAR } from './components/Builder';
import { CameraRig } from './components/CameraRig';
import { CheckProbe } from './components/CheckProbe';
import { MobileControls, useIsTouch } from './components/MobileControls';
import { Player } from './components/Player';
import { Terrain } from './components/Terrain';
import { LazyPhysics } from './physics/LazyPhysics';

const HINT = 'WASD: move · Shift: run · Space: jump · click: mine · right-click: place · 1 / 2 / 3: block · drag: look · wheel: zoom';
const TOUCH_HINT = 'stick: move · JUMP · MINE / PLACE at the crosshair · drag: look';
/** The player's box for the preview check (src/game/check.ts). */
const playerBox = () => ({ pos: player.pos, radius: PLAYER.radius, height: PLAYER.height });

/** Block picker: keys 1 / 2 / 3 or a tap. React state is fine here — it changes on a key press, not per frame. */
function Hotbar({ selected, onSelect }: { selected: Block; onSelect: (b: Block) => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-10 flex justify-center gap-2">
      {HOTBAR.map((h, i) => (
        <button
          key={h.block}
          type="button"
          data-a8-touch={`block ${h.label}`}
          className={`pointer-events-auto flex h-11 w-11 flex-col items-center justify-center rounded border-2 text-[10px] font-bold text-white shadow ${h.block === selected ? 'border-white' : 'border-black/30'}`}
          style={{ background: h.color }}
          onClick={() => {
            builder.selected = h.block;
            onSelect(h.block);
          }}
        >
          <span>{i + 1}</span>
          <span>{h.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const physics = PHYSICS_DEMO || new URLSearchParams(window.location.search).get('physics') === '1';
  const touch = useIsTouch();
  const [selected, setSelected] = useState<Block>(builder.selected);
  const onSelect = useCallback((b: Block) => setSelected(b), []);
  useEffect(bindKeyboard, []);

  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 55, near: 0.1, far: 200, position: [0, 20, 10] }}>
        <Terrain />
        <Player />
        <CameraRig />
        <Builder onSelect={onSelect} />
        {physics && <LazyPhysics />}
        <CheckProbe player={playerBox} />
      </Canvas>
      {/* crosshair: the Builder ray goes through the screen center */}
      <div data-a8-hud="crosshair" className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 bg-white/90 mix-blend-difference" />
        <div className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-white/90 mix-blend-difference" />
      </div>
      <div data-a8-panel="controls hint" className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white">
        {touch ? TOUCH_HINT : HINT}
      </div>
      <Hotbar selected={selected} onSelect={onSelect} />
      <MobileControls touch={touch} />
    </div>
  );
}
