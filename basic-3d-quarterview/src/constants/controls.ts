import { KeyboardControlsEntry } from '@react-three/drei';

/**
 * Keyboard control mapping
 *
 * Key definitions for each action
 */
export const keyboardMap: KeyboardControlsEntry[] = [
  { name: 'up', keys: ['ArrowUp', 'KeyW'] },
  { name: 'down', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'action1', keys: ['KeyQ'] }, // Attack action
  { name: 'action2', keys: ['KeyE'] }, // Hit action
  { name: 'action3', keys: ['KeyR'] }, // Death action
  { name: 'action4', keys: ['KeyF'] }, // Revival action
  { name: 'magic', keys: ['KeyF'] }, // Magic action
];
