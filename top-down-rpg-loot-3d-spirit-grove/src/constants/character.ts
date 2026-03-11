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
  /** SPELL GATHER ACTION */
  PUNCH: 'PUNCH',
  /** SPELL CAST ACTION */
  PUNCH_01: 'PUNCH_01',
  /** NATURE PUSH ACTION */
  KICK: 'KICK',
  /** ROOT STRIKE ACTION */
  KICK_01: 'KICK_01',
  /** VINE WHIP ACTION */
  KICK_02: 'KICK_02',
  /** SPIRIT CHANNEL ACTION */
  MELEE_ATTACK: 'MELEE_ATTACK',
  /** ARCANE RITUAL ACTION */
  CAST: 'CAST',
  /** NATURE RECOIL ACTION */
  HIT: 'HIT',
  /** FOREST DANCE ACTION */
  DANCE: 'DANCE',
  /** WATER GLIDE ACTION */
  SWIM: 'SWIM',
  /** SPIRIT FADE ACTION */
  DIE: 'DIE',
};

export type CharacterState = (typeof CharacterState)[keyof typeof CharacterState];
