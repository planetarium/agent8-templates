import { AnimationType } from 'vibe-starter-3d';

/**
 * Character state definitions
 */
export const CharacterState = {
  IDLE: 'IDLE',
  WALK: 'WALK',
  RUN: 'RUN',
  JUMP: 'JUMP',
  PUNCH: 'PUNCH',
  HIT: 'HIT',
  DIE: 'DIE',
  ATTACK: 'ATTACK',
} as const;

export type CharacterState = (typeof CharacterState)[keyof typeof CharacterState];

/**
 * Default character height definition
 */
export const DEFAULT_HEIGHT = 1.7;
