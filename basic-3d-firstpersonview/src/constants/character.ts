import { AnimationType } from 'vibe-starter-3d';

export const CharacterState: { [key: string]: AnimationType } = {
  /** IDLE ACTION */
  IDLE: 'IDLE',
  /** WALKING ACTION */
  WALK: 'WALK',
  /** RUNNING ACTION */
  RUN: 'RUN',
  /** JUMP ACTION */
  JUMP: 'JUMP',
  /** HIT ACTION */
  HIT: 'HIT',
  /** DIE ACTION */
  DIE: 'DIE',
};

export type CharacterState = (typeof CharacterState)[keyof typeof CharacterState];
