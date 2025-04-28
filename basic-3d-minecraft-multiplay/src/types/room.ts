/**
 * User state interface
 * Represents the state of a user in the game
 */

import { CubeInfo } from '../store/cubeStore';

export interface RoomState {
  initialized: boolean;
  lastActivity: number;
  userCount: number;
  gameStarted: boolean;
  cubes: Record<string, CubeInfo>;
}
