import { AnimationType } from 'vibe-starter-3d';

export const CharacterState: { [key: string]: AnimationType } = {
  IDLE: 'IDLE',
  IDLE_01: 'IDLE_01',
  WALK: 'WALK',
  RUN: 'RUN',
  FAST_RUN: 'FAST_RUN',
  JUMP: 'JUMP',
  PUNCH: 'PUNCH',
  PUNCH_01: 'PUNCH_01',
  KICK: 'KICK',
  KICK_01: 'KICK_01',
  KICK_02: 'KICK_02',
  MELEE_ATTACK: 'MELEE_ATTACK',
  CAST: 'CAST',
  HIT: 'HIT',
  DANCE: 'DANCE',
  DIE: 'DIE',
};

export type CharacterState = (typeof CharacterState)[keyof typeof CharacterState];
