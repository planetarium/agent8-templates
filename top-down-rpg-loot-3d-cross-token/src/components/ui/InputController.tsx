import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { IS_MOBILE, useInputStore } from 'vibe-starter-3d';
import { usePlayerActionStore } from '../../stores/playerActionStore';
import nipplejs from 'nipplejs';

type KeyMapping = Record<string, string[]>;

const CONTROL_KEY_MAPPING: KeyMapping = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  leftward: ['KeyA', 'ArrowLeft'],
  rightward: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft', 'ShiftRight'],
};

const ACTION_KEY_MAPPING: KeyMapping = {
  meleeAttack: ['KeyF', 'KeyQ', 'Mouse0'],
};

const MOVEMENT_SPEED_WALK = 0.6;
const MOVEMENT_SPEED_RUN_BOOST = 0.4;
const MOVEMENT_SPEED_MAX = 1.0;
const JOYSTICK_RANGE_MULTIPLIER = 2.0;

interface InputControllerProps {
  disabled?: boolean;
  disableKeyboard?: boolean;
  disableJoystick?: boolean;
}

export const InputController: React.FC<InputControllerProps> = ({
  disabled = false,
  disableKeyboard = false,
  disableJoystick = false,
}) => {
  const { setMovementInput, resetAllInputs, setActiveInputSource } = useInputStore();
  const { setPlayerAction, resetAllPlayerActions } = usePlayerActionStore();

  const [isAttackPressed, setIsAttackPressed] = useState(false);
  const keyboardStateRef = useRef({ forward: false, backward: false, leftward: false, rightward: false, run: false });

  const calculateKeyboardMovement = useCallback(() => {
    const state = keyboardStateRef.current;
    const x = (state.leftward ? 1 : 0) + (state.rightward ? -1 : 0);
    const y = (state.forward ? 1 : 0) + (state.backward ? -1 : 0);
    const direction = new THREE.Vector2(x, y);
    const magnitude = direction.length();
    if (magnitude > 0) direction.normalize();
    const baseIntensity = magnitude > 0 ? MOVEMENT_SPEED_WALK : 0;
    const runBoost = state.run ? MOVEMENT_SPEED_RUN_BOOST : 0;
    return { direction: { x: direction.x, y: direction.y }, intensity: Math.min(baseIntensity + runBoost, MOVEMENT_SPEED_MAX) };
  }, []);

  // Joystick
  useEffect(() => {
    if (disabled || disableJoystick || !IS_MOBILE) return;
    const zone = document.createElement('div');
    zone.style.cssText = 'position:fixed;left:0;top:0;width:50%;height:100%;z-index:1000;pointer-events:auto;touch-action:none;user-select:none;';
    document.body.appendChild(zone);
    const manager = nipplejs.create({ zone, color: 'rgba(176,122,255,0.6)', mode: 'dynamic', shape: 'circle' });
    manager.on('move', (_, data) => {
      if (disabled) return;
      setActiveInputSource('joystick');
      const angle = (data.angle?.radian || 0) - Math.PI / 2;
      const dist = data.distance || 0;
      const maxDist = data.instance.options.size || 100;
      const intensity = Math.min((dist / maxDist) * JOYSTICK_RANGE_MULTIPLIER, MOVEMENT_SPEED_MAX);
      setMovementInput({ x: Math.sin(angle), y: Math.cos(angle) }, intensity, 'joystick');
    });
    manager.on('end', () => setMovementInput({ x: 0, y: 0 }, 0, 'joystick'));
    return () => { manager.destroy(); zone.parentNode?.removeChild(zone); };
  }, [disabled, disableJoystick, setMovementInput, setActiveInputSource]);

  // Keyboard
  useEffect(() => {
    if (disabled || disableKeyboard) return;
    const down = (e: KeyboardEvent) => {
      if (disabled) return;
      let changed = false;
      ['forward', 'backward', 'leftward', 'rightward', 'run'].forEach((k) => {
        if (CONTROL_KEY_MAPPING[k]?.includes(e.code) && !(keyboardStateRef.current as any)[k]) {
          (keyboardStateRef.current as any)[k] = true; changed = true;
        }
      });
      Object.keys(ACTION_KEY_MAPPING).forEach((a) => {
        if (ACTION_KEY_MAPPING[a]?.includes(e.code)) setPlayerAction(a, true);
      });
      if (changed) { const m = calculateKeyboardMovement(); setMovementInput(m.direction, m.intensity, 'keyboard'); }
    };
    const up = (e: KeyboardEvent) => {
      if (disabled) return;
      let changed = false;
      ['forward', 'backward', 'leftward', 'rightward', 'run'].forEach((k) => {
        if (CONTROL_KEY_MAPPING[k]?.includes(e.code) && (keyboardStateRef.current as any)[k]) {
          (keyboardStateRef.current as any)[k] = false; changed = true;
        }
      });
      Object.keys(ACTION_KEY_MAPPING).forEach((a) => {
        if (ACTION_KEY_MAPPING[a]?.includes(e.code)) setPlayerAction(a, false);
      });
      if (changed) { const m = calculateKeyboardMovement(); setMovementInput(m.direction, m.intensity, 'keyboard'); }
    };
    const mdwn = (e: MouseEvent) => {
      Object.keys(ACTION_KEY_MAPPING).forEach((a) => {
        if (ACTION_KEY_MAPPING[a]?.includes(`Mouse${e.button}`)) setPlayerAction(a, true);
      });
    };
    const mup = (e: MouseEvent) => {
      Object.keys(ACTION_KEY_MAPPING).forEach((a) => {
        if (ACTION_KEY_MAPPING[a]?.includes(`Mouse${e.button}`)) setPlayerAction(a, false);
      });
    };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    document.addEventListener('mousedown', mdwn);
    document.addEventListener('mouseup', mup);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
      document.removeEventListener('mousedown', mdwn);
      document.removeEventListener('mouseup', mup);
    };
  }, [disabled, disableKeyboard, setMovementInput, setPlayerAction, calculateKeyboardMovement]);

  useEffect(() => () => { resetAllInputs(); resetAllPlayerActions(); }, []);

  useEffect(() => {
    if (disabled) { keyboardStateRef.current = { forward: false, backward: false, leftward: false, rightward: false, run: false }; resetAllInputs(); resetAllPlayerActions(); setIsAttackPressed(false); }
  }, [disabled]);

  const handleAttackStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return; e.preventDefault(); e.stopPropagation();
    setIsAttackPressed(true); setPlayerAction('meleeAttack', true);
  }, [disabled, setPlayerAction]);

  const handleAttackEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return; e.preventDefault(); e.stopPropagation();
    setIsAttackPressed(false); setPlayerAction('meleeAttack', false);
  }, [disabled, setPlayerAction]);

  if (disableJoystick) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[1001]">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center cursor-pointer select-none touch-none ${isAttackPressed ? 'scale-90' : 'scale-100'} transition-transform`}
        style={{ background: 'radial-gradient(circle, rgba(176,122,255,0.5) 0%, rgba(119,68,204,0.3) 100%)', border: '2px solid rgba(176,122,255,0.6)', boxShadow: '0 0 16px rgba(176,122,255,0.4)' }}
        onMouseDown={handleAttackStart}
        onMouseUp={handleAttackEnd}
        onMouseLeave={handleAttackEnd}
        onTouchStart={handleAttackStart}
        onTouchEnd={handleAttackEnd}
      >
        <span className="text-white text-xs font-bold">⚔ ATTACK</span>
      </div>
    </div>
  );
};
