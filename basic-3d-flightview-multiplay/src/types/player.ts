/**
 * Player input parameters for action determination
 */
export interface PlayerInputs {
  /** Whether player is being revived */
  isRevive: boolean;
  /** Whether player is dying */
  isDying: boolean;
  /** Whether player is being hit */
  isHit: boolean;
  /** Whether player is moving */
  isMoving: boolean;
}
