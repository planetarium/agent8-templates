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
  transform?: Transform;
  /** Current character state/animation */
  state?: string;
}

/**
 * Transform interface
 * Represents position and rotation in 3D space
 */
export interface Transform {
  /** Position as [x, y, z] */
  position: [number, number, number];
  /** Rotation as [x, y, z, w] quaternion */
  rotation: [number, number, number, number];
}
