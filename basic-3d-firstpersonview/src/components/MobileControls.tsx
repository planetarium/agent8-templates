import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { input, pressJump } from '../game/input';

/** Touch device right away (coarse pointer / touch points / `?touch=1`), or as soon as the screen is touched. */
export function useIsTouch() {
  const [touch, setTouch] = useState(
    () =>
      new URLSearchParams(window.location.search).get('touch') === '1' ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches,
  );
  useEffect(() => {
    const on = () => setTouch(true);
    window.addEventListener('touchstart', on, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', on);
  }, []);
  return touch;
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (e: ReactPointerEvent) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const radius = r.width / 2;
    let dx = e.clientX - (r.left + radius);
    let dy = e.clientY - (r.top + radius);
    const len = Math.hypot(dx, dy);
    if (len > radius) {
      dx = (dx / len) * radius;
      dy = (dy / len) * radius;
    }
    setKnob({ x: dx, y: dy });
    input.joyX = dx / radius;
    input.joyY = -dy / radius;
  };
  const release = (e: ReactPointerEvent) => {
    if (e.pointerId !== pointer.current) return;
    pointer.current = null;
    setKnob({ x: 0, y: 0 });
    input.joyX = 0;
    input.joyY = 0;
  };
  useEffect(
    () => () => {
      input.joyX = 0;
      input.joyY = 0;
    },
    [],
  );

  return (
    <div
      ref={base}
      className="pointer-events-auto relative rounded-full border-2 border-white/60 bg-white/20"
      style={{ width: 'clamp(110px, 30vmin, 150px)', height: 'clamp(110px, 30vmin, 150px)', touchAction: 'none' }}
      onPointerDown={(e) => {
        if (pointer.current !== null) return;
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.pointerId === pointer.current && update(e)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className="absolute left-1/2 top-1/2 h-[42%] w-[42%] rounded-full bg-white/85 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

function JumpButton() {
  const [down, setDown] = useState(false);
  return (
    <button
      type="button"
      className={`pointer-events-auto rounded-full border-2 border-white/70 font-bold text-white shadow-xl ${down ? 'scale-95 bg-orange-500/90' : 'bg-orange-400/80'}`}
      style={{ width: 'clamp(80px, 22vmin, 104px)', height: 'clamp(80px, 22vmin, 104px)', touchAction: 'none' }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pressJump();
        setDown(true);
      }}
      onPointerUp={() => setDown(false)}
      onPointerCancel={() => setDown(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      JUMP
    </button>
  );
}

/** Joystick (bottom-left) + jump button (bottom-right). Shown on touch devices before the first touch. */
export function MobileControls({ touch }: { touch: boolean }) {
  if (!touch) return null;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between"
      style={{
        padding: '0 max(20px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
      }}
    >
      <Joystick />
      <JumpButton />
    </div>
  );
}
