/**
 * Add userData property to AnimationClip
 */
declare module "three" {
  interface AnimationClip {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userData: Record<string, any>;
  }
}

/** Animation type */
export type AnimationType =
  | "IDLE"
  | "WALK"
  | "RUN"
  | "JUMP_UP"
  | "FALL_IDLE"
  | "FALL_DOWN"
  | "PUNCH"
  | "MELEE_ATTACK"
  | "AIM"
  | "SHOOT"
  | "AIM_RUN"
  | "HIT"
  | "DIE";

/** Animation configuration interface */
export interface AnimationConfig {
  /** Animation name */
  animationType: AnimationType;
  /** Whether the animation should loop */
  loop: boolean;
  /** Optional animation duration in seconds */
  duration?: number;
  /** Whether to clamp the animation at the last frame when finished */
  clampWhenFinished?: boolean;
  /** Optional callback function to execute when animation completes (for non-looping animations) */
  onComplete?: () => void;
}

/**
 * Animation configuration map type
 */
export type AnimationConfigMap<ActionType extends string> = Record<
  ActionType,
  AnimationConfig
>;
