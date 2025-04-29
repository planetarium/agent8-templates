export enum CharacterAction {
  // Idle animations
  /** Standing still */
  IDLE = 'IDLE',
  /** RIFLE IDLE */
  RIFLE_IDLE = 'RIFLE_IDLE',
  /** PISTOL IDLE */
  PISTOL_IDLE = 'PISTOL_IDLE',

  // Movement animations
  /** WALKING AT NORMAL SPEED */
  WALK = 'WALK',
  /** RUNNING AT INCREASED SPEED */
  RUN = 'RUN',
  /** RUNNING AT INCREASED SPEED */
  FAST_RUN = 'FAST_RUN',
  /** RIFLE RUN */
  RIFLE_RUN = 'RIFLE_RUN',
  /** PISTOL RUN */
  PISTOL_RUN = 'PISTOL_RUN',
  /** JUMP ACTION */
  JUMP = 'JUMP',
  /** SWIM */
  SWIM = 'SWIM',

  // Attack animations
  /** ATTACK ACTION */
  PUNCH = 'PUNCH',
  /** KICK ACTION */
  KICK = 'KICK',
  /** MELEE ATTACK */
  MELEE_ATTACK = 'MELEE_ATTACK',
  /** CAST */
  CAST = 'CAST',

  // Other animations
  /** DANCE */
  DANCE = 'DANCE',
  /** ATTACK HIT */
  HIT = 'HIT',
  /** ATTACK HIT */
  DIE = 'DIE',
}
