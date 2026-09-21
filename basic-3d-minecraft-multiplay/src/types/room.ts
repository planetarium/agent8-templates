/**
 * User state interface
 * Represents the state of a user in the game
 */

import { CubeInfo } from '../store/cubeStore';

export interface RoomState {
  // Seeded by onRoomCreate, so present for the whole life of the room.
  initialized: boolean;
  createdAt: number;
  // Written lazily by the server paths named alongside each one, so they are
  // simply absent on a room nobody has acted in yet. Optional here rather than
  // required-and-missing, which is what the type used to claim.
  lastActivity?: number; // toggleReady, addCube, initializeCubes
  gameStarted?: boolean; // toggleReady
  cubes?: Record<string, CubeInfo>; // addCube, initializeCubes
}
