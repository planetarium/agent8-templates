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
  /** PUNCH ACTION */
  PUNCH: 'PUNCH',
  /** PUNCH ACTION */
  PUNCH_01: 'PUNCH_01',
  /** KICK ACTION */
  KICK: 'KICK',
  /** KICK ACTION */
  KICK_01: 'KICK_01',
  /** KICK ACTION */
  KICK_02: 'KICK_02',
  /** MELEE ATTACK ACTION */
  MELEE_ATTACK: 'MELEE_ATTACK',
  /** CAST ACTION */
  CAST: 'CAST',
  /** HIT ACTION */
  HIT: 'HIT',
  /** DIE ACTION */
  DIE: 'DIE',
};

export type CharacterState = (typeof CharacterState)[keyof typeof CharacterState];

export const DEFAULT_HEIGHT = 1.6;
