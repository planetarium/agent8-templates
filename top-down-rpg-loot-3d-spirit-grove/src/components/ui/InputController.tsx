import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useInputStore } from 'vibe-starter-3d';
import { usePlayerActionStore } from '../../stores/playerActionStore';
import nipplejs from 'nipplejs';

type KeyMapping = Record<string, string[]>;

const CONTROL_KEY_MAPPING: KeyMapping = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  leftward: ['KeyA', 'ArrowLeft'],
  rightward: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  run: ['ShiftLeft', 'ShiftRight'],
};

const ACTION_KEY_MAPPING: KeyMapping = {
  punch: ['KeyF', 'Mouse0'],
  kick: ['KeyG', 'Mouse2'],
  meleeAttack: ['KeyQ', 'KeyC'],
  cast: ['KeyE', 'Mouse1'],
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

export const InputController: React.FC<InputControllerProps> = ({ disabled = false, disableKeyboard = false, disableJoystick = false }) => {
  const { setMovementInput, setActionInput, resetAllInputs, setActiveInputSource } = useInputStore();
  const { setPlayerAction, resetAllPlayerActions } = usePlayerActionStore();

  const [isJumpPressed, setIsJumpPressed] = useState(false);
  const [isAttackPressed, setIsAttackPressed] = useState(false);

  const keyboardStateRef = useRef({
    forward: false,
    backward: false,
    leftward: false,
    rightward: false,
    run: false,
  });

  const calculateKeyboardMovement = useCallback(() => {
    const state = keyboardStateRef.current;
    const x = (state.leftward ? 1 : 0) + (state.rightward ? -1 : 0);
    const y = (state.forward ? 1 : 0) + (state.backward ? -1 : 0);

    const direction = new THREE.Vector2(x, y);
    const magnitude = direction.length();

    if (magnitude > 0) {
      direction.normalize();
    }

    const baseIntensity = magnitude > 0 ? MOVEMENT_SPEED_WALK : 0;
    const runBoost = state.run ? MOVEMENT_SPEED_RUN_BOOST : 0;
    const intensity = Math.min(baseIntensity + runBoost, MOVEMENT_SPEED_MAX);

    return {
      direction: { x: direction.x, y: direction.y },
      intensity,
    };
  }, []);

  useEffect(() => {
    if (disabled || disableJoystick) return;

    const joystickZone = document.createElement('div');
    joystickZone.style.position = 'fixed';
    joystickZone.style.left = '0';
    joystickZone.style.top = '0';
    joystickZone.style.width = '50%';
    joystickZone.style.height = '100%';
    joystickZone.style.zIndex = '1000';
    joystickZone.style.pointerEvents = 'auto';
    joystickZone.style.backgroundColor = 'transparent';
    joystickZone.style.touchAction = 'none';
    joystickZone.style.userSelect = 'none';
    joystickZone.style.setProperty('-webkit-user-select', 'none');
    joystickZone.style.setProperty('-webkit-touch-callout', 'none');
    document.body.appendChild(joystickZone);

    const options: nipplejs.JoystickManagerOptions = {
      zone: joystickZone,
      color: '#6b8f4e',
      mode: 'dynamic',
      shape: 'circle',
    };

    const manager = nipplejs.create(options);

    manager.on('move', (evt, data) => {
      if (disabled || disableJoystick) return;
      setActiveInputSource('joystick');

      const angle = data.angle?.radian || 0;
      const distance = data.distance || 0;
      const maxDistance = data.instance.options.size || 100;

      const gameAngle = angle - Math.PI / 2;
      const directionX = Math.sin(gameAngle);
      const directionY = Math.cos(gameAngle);

      const intensity = Math.min((distance / maxDistance) * JOYSTICK_RANGE_MULTIPLIER, MOVEMENT_SPEED_MAX);

      setMovementInput({ x: directionX, y: directionY }, intensity, 'joystick');
    });

    manager.on('end', () => {
      if (disabled || disableJoystick) return;
      setMovementInput({ x: 0, y: 0 }, 0, 'joystick');
    });

    return () => {
      manager.destroy();
      if (joystickZone.parentNode) {
        joystickZone.parentNode.removeChild(joystickZone);
      }
    };
  }, [disabled, disableJoystick, setMovementInput, setActiveInputSource]);

  useEffect(() => {
    if (disabled || disableKeyboard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || disableKeyboard) return;
      let stateChanged = false;

      if (CONTROL_KEY_MAPPING['forward']?.includes(event.code) && !keyboardStateRef.current.forward) { keyboardStateRef.current.forward = true; stateChanged = true; }
      if (CONTROL_KEY_MAPPING['backward']?.includes(event.code) && !keyboardStateRef.current.backward) { keyboardStateRef.current.backward = true; stateChanged = true; }
      if (CONTROL_KEY_MAPPING['leftward']?.includes(event.code) && !keyboardStateRef.current.leftward) { keyboardStateRef.current.leftward = true; stateChanged = true; }
      if (CONTROL_KEY_MAPPING['rightward']?.includes(event.code) && !keyboardStateRef.current.rightward) { keyboardStateRef.current.rightward = true; stateChanged = true; }
      if (CONTROL_KEY_MAPPING['run']?.includes(event.code) && !keyboardStateRef.current.run) { keyboardStateRef.current.run = true; stateChanged = true; }

      if (CONTROL_KEY_MAPPING['jump']?.includes(event.code)) { setActionInput('jump', true, 'keyboard'); }

      Object.keys(ACTION_KEY_MAPPING).forEach((action) => {
        if (ACTION_KEY_MAPPING[action]?.includes(event.code)) { setPlayerAction(action, true); }
      });

      if (stateChanged) {
        const movement = calculateKeyboardMovement();
        setMovementInput(movement.direction, movement.intensity, 'keyboard');
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (disabled || disableKeyboard) return;
      let stateChanged = false;

      if (CONTROL_KEY_MAPPING['forward']?.includes(event.code) && keyboardStateRef.current.forward) { keyboardStateRef.current.forward = false; stateChanged = true; }
      if (CONTROL_KEY_MAPPING['backward']?.includes(event.code) && keyboardStateRef.current.backward) { keyboardStateRef.current.backward = false; stateChanged = true; }
      if (CONTROL_KEY_MAPPING['leftward']?.includes(event.code) && keyboardStateRef.current.leftward) { keyboardStateRef.current.leftward = false; stateChanged = true; }
      if (CONTROL_KEY_MAPPING['rightward']?.includes(event.code) && keyboardStateRef.current.rightward) { keyboardStateRef.current.rightward = false; stateChanged = true; }
      if (CONTROL_KEY_MAPPING['run']?.includes(event.code) && keyboardStateRef.current.run) { keyboardStateRef.current.run = false; stateChanged = true; }

      if (CONTROL_KEY_MAPPING['jump']?.includes(event.code)) { setActionInput('jump', false, 'keyboard'); }

      Object.keys(ACTION_KEY_MAPPING).forEach((action) => {
        if (ACTION_KEY_MAPPING[action]?.includes(event.code)) { setPlayerAction(action, false); }
      });

      if (stateChanged) {
        const movement = calculateKeyboardMovement();
        setMovementInput(movement.direction, movement.intensity, 'keyboard');
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (disabled || disableKeyboard) return;
      const mouseButton = `Mouse${event.button}`;
      Object.keys(ACTION_KEY_MAPPING).forEach((action) => {
        if (ACTION_KEY_MAPPING[action]?.includes(mouseButton)) { setPlayerAction(action, true); }
      });
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (disabled || disableKeyboard) return;
      const mouseButton = `Mouse${event.button}`;
      Object.keys(ACTION_KEY_MAPPING).forEach((action) => {
        if (ACTION_KEY_MAPPING[action]?.includes(mouseButton)) { setPlayerAction(action, false); }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [disabled, disableKeyboard, setMovementInput, setActionInput, setPlayerAction, calculateKeyboardMovement]);

  useEffect(() => {
    return () => {
      resetAllInputs();
      resetAllPlayerActions();
    };
  }, [resetAllInputs, resetAllPlayerActions]);

  useEffect(() => {
    if (disabled || disableKeyboard || disableJoystick) {
      if (disabled || disableKeyboard) {
        keyboardStateRef.current = { forward: false, backward: false, leftward: false, rightward: false, run: false };
      }
      setIsJumpPressed(false);
      setIsAttackPressed(false);
      resetAllInputs();
      resetAllPlayerActions();
    }
  }, [disabled, disableKeyboard, disableJoystick, resetAllInputs, resetAllPlayerActions]);

  const handleJumpStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.stopPropagation();
      setIsJumpPressed(true);
      setActionInput('jump', true, 'touch');
    },
    [disabled, setActionInput],
  );

  const handleJumpEnd = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.stopPropagation();
      setIsJumpPressed(false);
      setActionInput('jump', false, 'touch');
    },
    [disabled, setActionInput],
  );

  const handleAttackStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.stopPropagation();
      setIsAttackPressed(true);
      setPlayerAction('punch', true);
    },
    [disabled, setPlayerAction],
  );

  const handleAttackEnd = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.stopPropagation();
      setIsAttackPressed(false);
      setPlayerAction('punch', false);
    },
    [disabled, setPlayerAction],
  );

  if (disableJoystick) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      right: 32,
      zIndex: 1001,
    }}>
      {/* Spell Cast Button - Forest Spirit style */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: isAttackPressed ? 'rgba(107, 143, 78, 0.4)' : 'rgba(107, 143, 78, 0.1)',
          border: '2px solid rgba(196, 162, 101, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'none',
          transform: isAttackPressed ? 'scale(0.92)' : 'scale(1)',
          transition: 'transform 0.1s, background 0.1s',
          boxShadow: isAttackPressed ? '0 0 25px rgba(107,143,78,0.4)' : '0 0 12px rgba(107,143,78,0.1)',
        }}
        onMouseDown={handleAttackStart}
        onMouseUp={handleAttackEnd}
        onMouseLeave={handleAttackEnd}
        onTouchStart={handleAttackStart}
        onTouchEnd={handleAttackEnd}
      >
        <span style={{
          color: '#c4a265',
          fontSize: '10px',
          fontWeight: 'bold',
          fontFamily: "'Cinzel', serif",
          letterSpacing: '1px',
          textShadow: '0 0 8px rgba(196,162,101,0.4)',
        }}>SPELL</span>
      </div>

      {/* Jump Button */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: -48,
          top: -48,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: isJumpPressed ? 'rgba(196, 162, 101, 0.35)' : 'rgba(196, 162, 101, 0.08)',
          border: '2px solid rgba(196, 162, 101, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'none',
          transform: isJumpPressed ? 'scale(0.92)' : 'scale(1)',
          transition: 'transform 0.1s, background 0.1s',
          boxShadow: isJumpPressed ? '0 0 15px rgba(196,162,101,0.3)' : '0 0 8px rgba(196,162,101,0.08)',
        }}
        onMouseDown={handleJumpStart}
        onMouseUp={handleJumpEnd}
        onMouseLeave={handleJumpEnd}
        onTouchStart={handleJumpStart}
        onTouchEnd={handleJumpEnd}
      >
        <span style={{
          color: '#c4a265',
          fontSize: '9px',
          fontWeight: 'bold',
          fontFamily: "'Cinzel', serif",
          letterSpacing: '1px',
          textShadow: '0 0 6px rgba(196,162,101,0.4)',
        }}>LEAP</span>
      </div>
    </div>
  );
};
