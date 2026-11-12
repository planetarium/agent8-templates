// Unified keyboard + touch input. DOM handlers write it, the player step reads it.

export const input = {
  keys: new Set<string>(),
  /** Touch joystick, -1 … 1 (right +, forward +). */
  joyX: 0,
  joyY: 0,
  /** performance.now() seconds of the latest jump press; -Infinity once a jump consumed it. */
  jumpPressedAt: -Infinity,
};

const LEFT = ['KeyA', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];
const UP = ['KeyW', 'ArrowUp'];
const DOWN = ['KeyS', 'ArrowDown'];
const JUMP = ['Space'];

const any = (codes: string[]) => codes.some((c) => input.keys.has(c));

export const nowSeconds = () => performance.now() / 1000;

export function pressJump() {
  input.jumpPressedAt = nowSeconds();
}

/** Move intent in input space: x = right, y = forward. Length ≤ 1. */
export function moveAxis(out: { x: number; y: number }) {
  let x = (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0) + input.joyX;
  let y = (any(UP) ? 1 : 0) - (any(DOWN) ? 1 : 0) + input.joyY;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  out.x = x;
  out.y = y;
  return out;
}

/** Installs window keyboard listeners; returns the cleanup. */
export function bindKeyboard() {
  const down = (e: KeyboardEvent) => {
    if (JUMP.includes(e.code)) {
      e.preventDefault();
      if (!e.repeat) pressJump();
    }
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
