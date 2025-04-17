import { AnimationType } from 'vibe-starter-3d';

export const CharacterState: { [key: string]: AnimationType } = {
  /** Standing still */
  IDLE: 'IDLE',
  /** WALKING AT NORMAL SPEED */
  WALK: 'WALK',
  /** RUNNING AT INCREASED SPEED */
  RUN: 'RUN',
  /** JUMP ACTION */
  JUMP: 'JUMP',
};

export type CharacterState = (typeof CharacterState)[keyof typeof CharacterState];
