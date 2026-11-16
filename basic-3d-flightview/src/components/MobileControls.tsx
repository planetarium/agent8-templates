import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { input } from '../game/input';

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

/** Stick: x rolls, y pitches (push up = nose down, like W). */
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

/** A button that is "held" while a finger is on it. */
function HoldButton({
  label,
  className,
  style,
  onChange,
}: {
  label: string;
  className: string;
  style: CSSProperties;
  onChange: (down: boolean) => void;
}) {
  const [down, setDown] = useState(false);
  const set = (v: boolean) => {
    setDown(v);
    onChange(v);
  };
  useEffect(() => () => onChange(false), [onChange]);
  return (
    <button
      type="button"
      className={`pointer-events-auto border-2 border-white/70 font-bold text-white shadow-xl ${className} ${down ? 'scale-95 brightness-110' : ''}`}
      style={{ touchAction: 'none', ...style }}
      onPointerDown={(e) => {
        set(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

const faster = (down: boolean) => (input.touchThrottle = down ? 1 : input.touchThrottle === 1 ? 0 : input.touchThrottle);
const slower = (down: boolean) => (input.touchThrottle = down ? -1 : input.touchThrottle === -1 ? 0 : input.touchThrottle);
const shoot = (down: boolean) => (input.touchFire = down);

/** Joystick (bottom-left), throttle rocker + FIRE (bottom-right). Shown on touch devices before the first touch. */
export function MobileControls({ touch }: { touch: boolean }) {
  if (!touch) return null;
  const rocker = { width: 'clamp(56px, 15vmin, 72px)', height: 'clamp(48px, 13vmin, 62px)' };
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between"
      style={{
        padding: '0 max(20px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
      }}
    >
      <Joystick />
      <div className="flex items-end gap-4">
        {/* throttle rocker: one control, top half speeds up, bottom half slows down */}
        <div className="flex flex-col overflow-hidden rounded-2xl">
          <HoldButton label="▲" className="rounded-t-2xl bg-sky-500/80" style={rocker} onChange={faster} />
          <HoldButton label="▼" className="rounded-b-2xl bg-slate-600/80" style={rocker} onChange={slower} />
        </div>
        <HoldButton
          label="FIRE"
          className="rounded-full bg-red-500/80"
          style={{ width: 'clamp(80px, 22vmin, 104px)', height: 'clamp(80px, 22vmin, 104px)' }}
          onChange={shoot}
        />
      </div>
    </div>
  );
}
