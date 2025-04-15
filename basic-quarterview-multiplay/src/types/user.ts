/**
 * User state interface
 * Represents the state of a user in the game
 */
export interface UserState {
  /** Unique account identifier */
  account: string;
  /** User's display name */
  nickname?: string;
  /** Whether the user is ready to start the game */
  isReady?: boolean;
  /** Selected character model key */
  character?: string;
  /** User's transform data (position and rotation) */
  transform?: {
    position: [number, number, number];
    rotation: [number, number, number, number];
  };
  /** Current character state/animation */
  state?: string;
  /** User stats for game mechanics */
  stats: {
    /** Maximum health points */
    maxHp: number;
    /** Current health points */
    currentHp: number;
    /** Additional stats can be added here */
    [key: string]: number | boolean | string;
  };
}
