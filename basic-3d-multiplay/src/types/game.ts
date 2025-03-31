import { Transform, UserState } from "./user";
import * as THREE from "three";

/**
 * Player input parameters for action determination
 */
export interface PlayerInputs {
  /** Whether player is being revived */
  isRevive: boolean;
  /** Whether player is dying */
  isDying: boolean;
  /** Whether player is punching */
  isPunching: boolean;
  /** Whether player is being hit */
  isHit: boolean;
  /** Whether player is jumping */
  isJumping: boolean;
  /** Whether player is moving */
  isMoving: boolean;
  /** Whether player is running */
  isRunning: boolean;
  /** Current vertical velocity */
  currentVelY: number;
}

/**
 * Network sync constants
 */
export const NETWORK_CONSTANTS = {
  SYNC: {
    /** Transmission interval (milliseconds) */
    INTERVAL_MS: 100,
    /** Position change threshold (meters) */
    POSITION_CHANGE_THRESHOLD: 0.05,
    /** Rotation change threshold (radians) */
    ROTATION_CHANGE_THRESHOLD: 0.05,
  },
};
