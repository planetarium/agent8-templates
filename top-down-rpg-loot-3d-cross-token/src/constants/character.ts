import { AnimationType } from 'vibe-starter-3d';

export const CharacterState: { [key: string]: AnimationType } = {
  /** IDLE ACTION */
  IDLE: 'IDLE',
  /** IDLE ACTION */
  IDLE_01: 'IDLE_01',
  /** WALKING ACTION */
  WALK: 'WALK',
  /** RUNNING ACTION */
  RUN: 'RUN',
  /** SPRINTING ACTION */
  FAST_RUN: 'FAST_RUN',
  /** JUMP ACTION */
  JUMP: 'JUMP',
  /** MELEE ATTACK ACTION */
  MELEE_ATTACK: 'MELEE_ATTACK',
  /** HIT ACTION */
  HIT: 'HIT',
  /** DIE ACTION */
  DIE: 'DIE',
};

export type CharacterState = (typeof CharacterState)[keyof typeof CharacterState];
