// Unified keyboard + touch input for the plane. DOM handlers write it, the flight step reads it.
import type { FlightInput } from './flight';

export const input = {
  keys: new Set<string>(),
  /** Touch joystick, -1 … 1 (right +, forward +). */
  joyX: 0,
  joyY: 0,
  /** Touch throttle rocker and fire button (held). */
  touchThrottle: 0,
  touchFire: false,
  /** Set by R; the flight loop clears it after resetting. */
  resetRequested: false,
};

const PITCH_DOWN = ['KeyW', 'ArrowUp'];
const PITCH_UP = ['KeyS', 'ArrowDown'];
const ROLL_LEFT = ['KeyA', 'ArrowLeft'];
const ROLL_RIGHT = ['KeyD', 'ArrowRight'];
const YAW_LEFT = ['KeyQ'];
const YAW_RIGHT = ['KeyE'];
const FASTER = ['ShiftLeft', 'ShiftRight'];
const SLOWER = ['ControlLeft', 'ControlRight'];
const FIRE = ['Space'];
const RESET = ['KeyR'];

const any = (codes: string[]) => codes.some((c) => input.keys.has(c));
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

/** Stick, rudder and throttle from keys + touch. */
export function readFlight(out: FlightInput) {
  out.pitch = clamp1((any(PITCH_DOWN) ? 1 : 0) - (any(PITCH_UP) ? 1 : 0) + input.joyY);
  out.roll = clamp1((any(ROLL_RIGHT) ? 1 : 0) - (any(ROLL_LEFT) ? 1 : 0) + input.joyX);
  out.yaw = (any(YAW_RIGHT) ? 1 : 0) - (any(YAW_LEFT) ? 1 : 0);
  out.throttle = clamp1((any(FASTER) ? 1 : 0) - (any(SLOWER) ? 1 : 0) + input.touchThrottle);
  return out;
}

export function wantsFire() {
  return any(FIRE) || input.touchFire;
}

/** Installs window keyboard listeners; returns the cleanup. */
export function bindKeyboard() {
  const handled = [...FIRE, ...PITCH_DOWN, ...PITCH_UP, ...ROLL_LEFT, ...ROLL_RIGHT];
  const down = (e: KeyboardEvent) => {
    if (handled.includes(e.code)) e.preventDefault();
    if (RESET.includes(e.code) && !e.repeat) input.resetRequested = true;
    input.keys.add(e.code);
  };
  const up = (e: KeyboardEvent) => input.keys.delete(e.code);
  const blur = () => input.keys.clear();
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
  };
}
