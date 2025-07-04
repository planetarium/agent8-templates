import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { IS_MOBILE, useInputStore } from 'vibe-starter-3d';
import { usePlayerActionStore } from '../../stores/playerActionStore';
import nipplejs from 'nipplejs';

/**
 * Key mapping configuration - simple Record<string, string[]>
 */
type KeyMapping = Record<string, string[]>; // action: [key1, key2, ...]

/**
 * Controller key mapping
 */
const CONTROL_KEY_MAPPING: KeyMapping = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  leftward: ['KeyA', 'ArrowLeft'],
  rightward: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  run: ['ShiftLeft', 'ShiftRight'],
};

/**
 * Player action key mapping
 */
const ACTION_KEY_MAPPING: KeyMapping = {
  addCube: ['KeyF', 'Mouse0'],
  removeCube: ['KeyG', 'Mouse2'],
};

// Movement speed constants
const MOVEMENT_SPEED_WALK = 0.6;
const MOVEMENT_SPEED_RUN_BOOST = 0.4;
const MOVEMENT_SPEED_MAX = 1.0;
const JOYSTICK_RANGE_MULTIPLIER = 2.0; // Converts joystick range (0~0.5) to full range (0~1.0)

interface InputControllerProps {
  disabled?: boolean;
  disableKeyboard?: boolean;
  disableJoystick?: boolean;
}

export const InputController: React.FC<InputControllerProps> = ({ disabled = false, disableKeyboard = false, disableJoystick = false }) => {
  // Store actions to controller
  const { setMovementInput, setActionInput, resetAllInputs, setActiveInputSource } = useInputStore();
  const { setPlayerAction, resetAllPlayerActions } = usePlayerActionStore();

  // Button states
  const [isJumpPressed, setIsJumpPressed] = useState(false);
  const [isAddCubePressed, setIsAddCubePressed] = useState(false);

  // Keyboard state tracking
  const keyboardStateRef = useRef({
    forward: false,
    backward: false,
    leftward: false,
    rightward: false,
    run: false,
  });

  // Helper function to calculate movement from keyboard state
  const calculateKeyboardMovement = useCallback(() => {
    const state = keyboardStateRef.current;

    // Calculate direction
    const x = (state.leftward ? 1 : 0) + (state.rightward ? -1 : 0);
    const y = (state.forward ? 1 : 0) + (state.backward ? -1 : 0);

    // Use Three.js Vector2 for efficient normalization
    const direction = new THREE.Vector2(x, y);
    const magnitude = direction.length();

    // Normalize diagonal movement
    if (magnitude > 0) {
      direction.normalize();
    }

    // Calculate intensity: base speed + run boost
    const baseIntensity = magnitude > 0 ? MOVEMENT_SPEED_WALK : 0; // Base walking speed
    const runBoost = state.run ? MOVEMENT_SPEED_RUN_BOOST : 0; // Additional speed when running
    const intensity = Math.min(baseIntensity + runBoost, MOVEMENT_SPEED_MAX);

    return {
      direction: { x: direction.x, y: direction.y },
      intensity,
    };
  }, []);

  // Joystick input handling with analog support
  useEffect(() => {
    if (disabled || disableJoystick || !IS_MOBILE) return;

    // Create div element for left side area of screen
    const joystickZone = document.createElement('div');
    joystickZone.style.position = 'fixed';
    joystickZone.style.left = '0';
    joystickZone.style.top = '0';
    joystickZone.style.width = '50%'; // Left 50% of screen
    joystickZone.style.height = '100%';
    joystickZone.style.zIndex = '1000';
    joystickZone.style.pointerEvents = 'auto';
    joystickZone.style.backgroundColor = 'transparent';
    // Disable long touch events
    joystickZone.style.touchAction = 'none';
    joystickZone.style.userSelect = 'none';
    joystickZone.style.setProperty('-webkit-user-select', 'none');
    joystickZone.style.setProperty('-webkit-touch-callout', 'none');
    document.body.appendChild(joystickZone);

    const options: nipplejs.JoystickManagerOptions = {
      zone: joystickZone,
      color: 'white',
      mode: 'dynamic',
      shape: 'circle',
    };

    const manager = nipplejs.create(options);

    manager.on('move', (evt, data) => {
      if (disabled || disableJoystick) return; // Check disabled state
      setActiveInputSource('joystick');

      // Extract analog data from nipplejs
      const angle = data.angle?.radian || 0; // Angle in radians
      const distance = data.distance || 0; // Distance from center
      const maxDistance = data.instance.options.size || 100; // Maximum distance

      // Calculate normalized direction vector
      // nipplejs uses mathematical coordinate system (0° = right, 90° = up)
      // We need to convert to game coordinate system (0° = up, 90° = right)
      const gameAngle = angle - Math.PI / 2; // Rotate by -90 degrees
      const directionX = Math.sin(gameAngle); // Right/Left
      const directionY = Math.cos(gameAngle); // Forward/Backward

      // Calculate intensity (0.0 to 1.0) based on distance from center
      const intensity = Math.min((distance / maxDistance) * JOYSTICK_RANGE_MULTIPLIER, MOVEMENT_SPEED_MAX);

      // Set analog movement input
      setMovementInput({ x: directionX, y: directionY }, intensity, 'joystick');
    });

    manager.on('end', () => {
      if (disabled || disableJoystick) return; // Check disabled state
      // Reset all inputs when joystick ends
      setMovementInput({ x: 0, y: 0 }, 0, 'joystick');
    });

    return () => {
      manager.destroy();
      if (joystickZone.parentNode) {
        joystickZone.parentNode.removeChild(joystickZone);
      }
    };
  }, [disabled, disableJoystick, setMovementInput, setActiveInputSource]);

  // Keyboard input handling - convert to movement immediately
  useEffect(() => {
    if (disabled || disableKeyboard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || disableKeyboard) return; // Additional check in handler
      let stateChanged = false;

      // Handle movement keys
      if (CONTROL_KEY_MAPPING['forward']?.includes(event.code) && !keyboardStateRef.current.forward) {
        keyboardStateRef.current.forward = true;
        stateChanged = true;
      }
      if (CONTROL_KEY_MAPPING['backward']?.includes(event.code) && !keyboardStateRef.current.backward) {
        keyboardStateRef.current.backward = true;
        stateChanged = true;
      }
      if (CONTROL_KEY_MAPPING['leftward']?.includes(event.code) && !keyboardStateRef.current.leftward) {
        keyboardStateRef.current.leftward = true;
        stateChanged = true;
      }
      if (CONTROL_KEY_MAPPING['rightward']?.includes(event.code) && !keyboardStateRef.current.rightward) {
        keyboardStateRef.current.rightward = true;
        stateChanged = true;
      }
      if (CONTROL_KEY_MAPPING['run']?.includes(event.code) && !keyboardStateRef.current.run) {
        keyboardStateRef.current.run = true;
        stateChanged = true;
      }

      // Handle action keys
      if (CONTROL_KEY_MAPPING['jump']?.includes(event.code)) {
        setActionInput('jump', true, 'keyboard');
      }

      // Handle player action keys
      Object.keys(ACTION_KEY_MAPPING).forEach((action) => {
        if (ACTION_KEY_MAPPING[action]?.includes(event.code)) {
          setPlayerAction(action, true);
        }
      });

      // Update movement if any movement-related key changed
      if (stateChanged) {
        const movement = calculateKeyboardMovement();
        setMovementInput(movement.direction, movement.intensity, 'keyboard');
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (disabled || disableKeyboard) return; // Additional check in handler
      let stateChanged = false;

      // Handle movement keys
      if (CONTROL_KEY_MAPPING['forward']?.includes(event.code) && keyboardStateRef.current.forward) {
        keyboardStateRef.current.forward = false;
        stateChanged = true;
      }
      if (CONTROL_KEY_MAPPING['backward']?.includes(event.code) && keyboardStateRef.current.backward) {
        keyboardStateRef.current.backward = false;
        stateChanged = true;
      }
      if (CONTROL_KEY_MAPPING['leftward']?.includes(event.code) && keyboardStateRef.current.leftward) {
        keyboardStateRef.current.leftward = false;
        stateChanged = true;
      }
      if (CONTROL_KEY_MAPPING['rightward']?.includes(event.code) && keyboardStateRef.current.rightward) {
        keyboardStateRef.current.rightward = false;
        stateChanged = true;
      }
      if (CONTROL_KEY_MAPPING['run']?.includes(event.code) && keyboardStateRef.current.run) {
        keyboardStateRef.current.run = false;
        stateChanged = true;
      }

      // Handle action keys
      if (CONTROL_KEY_MAPPING['jump']?.includes(event.code)) {
        setActionInput('jump', false, 'keyboard');
      }

      // Handle player action keys
      Object.keys(ACTION_KEY_MAPPING).forEach((action) => {
        if (ACTION_KEY_MAPPING[action]?.includes(event.code)) {
          setPlayerAction(action, false);
        }
      });

      // Update movement if any movement-related key changed
      if (stateChanged) {
        const movement = calculateKeyboardMovement();
        setMovementInput(movement.direction, movement.intensity, 'keyboard');
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (disabled || disableKeyboard) return; // Additional check in handler

      // Handle player action mouse keys
      const mouseButton = `Mouse${event.button}`;
      Object.keys(ACTION_KEY_MAPPING).forEach((action) => {
        if (ACTION_KEY_MAPPING[action]?.includes(mouseButton)) {
          setPlayerAction(action, true);
        }
      });
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (disabled || disableKeyboard) return; // Additional check in handler

      // Handle player action mouse keys
      const mouseButton = `Mouse${event.button}`;
      Object.keys(ACTION_KEY_MAPPING).forEach((action) => {
        if (ACTION_KEY_MAPPING[action]?.includes(mouseButton)) {
          setPlayerAction(action, false);
        }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAllInputs();
      resetAllPlayerActions();
    };
  }, [resetAllInputs, resetAllPlayerActions]);

  // Reset inputs when disabled
  useEffect(() => {
    if (disabled || disableKeyboard || disableJoystick) {
      // Reset keyboard state if keyboard is disabled
      if (disabled || disableKeyboard) {
        keyboardStateRef.current = {
          forward: false,
          backward: false,
          leftward: false,
          rightward: false,
          run: false,
        };
      }
      // Reset button states
      setIsJumpPressed(false);
      setIsAddCubePressed(false);
      resetAllInputs();
      resetAllPlayerActions();
    }
  }, [disabled, disableKeyboard, disableJoystick, resetAllInputs, resetAllPlayerActions]);

  // Button handlers
  const handleJumpStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.stopPropagation(); // Prevent event propagation
      setIsJumpPressed(true);
      setActionInput('jump', true, 'touch');
    },
    [disabled, setActionInput],
  );

  const handleJumpEnd = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.stopPropagation(); // Prevent event propagation
      setIsJumpPressed(false);
      setActionInput('jump', false, 'touch');
    },
    [disabled, setActionInput],
  );

  const handleAddCubeStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.stopPropagation();
      setIsAddCubePressed(true);
      // NOTE: change to other action if needed
      setPlayerAction('addCube', true);
    },
    [disabled, setPlayerAction],
  );

  const handleAddCubeEnd = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.stopPropagation();
      setIsAddCubePressed(false);
      // NOTE: change to other action if needed
      setPlayerAction('addCube', false);
    },
    [disabled, setPlayerAction],
  );

  // Don't render action buttons if joystick is disabled
  if (disableJoystick) {
    return null;
  }

  // Render action buttons
  return (
    <div className="fixed bottom-8 right-8 z-[1001]">
      {/* Add cube Button */}
      <div
        className={`w-20 h-20 rounded-full bg-white/30 
                   flex items-center justify-center cursor-pointer select-none touch-none
                   ${isAddCubePressed ? 'scale-90' : 'scale-100'} transition-transform`}
        onMouseDown={handleAddCubeStart}
        onMouseUp={handleAddCubeEnd}
        onMouseLeave={handleAddCubeEnd}
        onTouchStart={handleAddCubeStart}
        onTouchEnd={handleAddCubeEnd}
      >
        <span className="text-white text-xs font-bold">ADD CUBE</span>
      </div>

      {/* Attack Button */}
      <div
        className={`absolute bottom-0 -left-12 -top-12 w-14 h-14 rounded-full bg-white/30 
                   flex items-center justify-center cursor-pointer select-none touch-none
                   ${isJumpPressed ? 'scale-90' : 'scale-100'} transition-transform`}
        onMouseDown={handleJumpStart}
        onMouseUp={handleJumpEnd}
        onMouseLeave={handleJumpEnd}
        onTouchStart={handleJumpStart}
        onTouchEnd={handleJumpEnd}
      >
        <span className="text-white text-xs font-bold">JUMP</span>
      </div>
    </div>
  );
};
