import { useEffect, useState } from 'react';
import { Joystick, VirtualButton } from 'ecctrl/input';

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

/** Same CSS sizes as the kinematic variant's stick and JUMP button. */
const STICK = 'clamp(110px, 30vmin, 150px)';
const BUTTON = 'clamp(80px, 22vmin, 104px)';
const stickPx = () => Math.min(150, Math.max(110, 0.3 * Math.min(window.innerWidth, window.innerHeight)));

function useStickRadius() {
  const [r, setR] = useState(() => stickPx() / 2);
  useEffect(() => {
    const on = () => setR(stickPx() / 2);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return r;
}

/**
 * ecctrl's Joystick (bottom-left) + VirtualButton "jump" (bottom-right), styled
 * and placed like the kinematic variant's controls. Shown on touch devices before the first touch.
 * <Player> reads their stores.
 */
export function MobileControls({ touch }: { touch: boolean }) {
  const radius = useStickRadius();
  if (!touch) return null;
  return (
    <>
      <Joystick
        joystickMaxRadius={radius}
        joystickWrapperStyle={{
          left: 'max(20px, env(safe-area-inset-left))',
          bottom: 'max(24px, env(safe-area-inset-bottom))',
          width: STICK,
          height: STICK,
        }}
        joystickBaseStyle={{
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '2px solid rgba(255, 255, 255, 0.6)',
          boxSizing: 'border-box',
        }}
        joystickKnobStyle={{
          width: '42%',
          height: '42%',
          background: 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        }}
      />
      <VirtualButton
        id="jump"
        label="JUMP"
        buttonWrapperStyle={{
          right: 'max(20px, env(safe-area-inset-right))',
          bottom: 'max(24px, env(safe-area-inset-bottom))',
          width: BUTTON,
          height: BUTTON,
          background: 'transparent',
        }}
        buttonCapStyle={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          background: 'rgba(251, 146, 60, 0.8)',
          border: '2px solid rgba(255, 255, 255, 0.7)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          color: 'white',
          fontSize: '16px',
        }}
      />
    </>
  );
}
