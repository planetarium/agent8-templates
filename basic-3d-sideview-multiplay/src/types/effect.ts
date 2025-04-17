/**
 * Effect type enumeration
 */
export enum EffectType {
  FIREBALL = 'FIREBALL',
  EXPLOSION = 'EXPLOSION',
  // Effect types to be added in the future
  // LIGHTNING = 'lightning',
  // ICE_BLAST = 'ice-blast',
  // TELEPORT = 'teleport',
}

/**
 * Base effect data interface
 * Basic structure for all effect-related data
 */
export interface EffectData {
  type: string;
  config: { [key: string]: any };
}

/**
 * Active effect interface
 * Effect instance managed on the client
 */
export interface ActiveEffect {
  key: number;
  // Sender account
  sender?: string;
  effectData: EffectData;
}

/**
 * Effect message exchanged between server and client
 */
export interface EffectEventMessage {
  sender: string;
  effectData: EffectData;
  timestamp: number;
}
