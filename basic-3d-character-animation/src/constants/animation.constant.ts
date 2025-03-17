import { AnimationType } from "../types/animation";

export const ANIMATION_KEYWORDS: Record<AnimationType, string[]> = {
  IDLE: ["idle", "stand", "waiting"],
  WALK: ["walk", "walking", "walking_man"],
  RUN: ["run", "running", "sprint"],
  JUMP_UP: ["jump", "jumping", "leap", "jump up"],
  FALL_IDLE: ["falling", "midair", "fall idle"],
  FALL_DOWN: ["land", "landing", "fall down"],
  PUNCH: ["punch", "punching"],
  MELEE_ATTACK: ["melee", "attack", "slash", "swing", "melee attack"],
  AIM: ["aim", "aimming", "targeting"],
  AIM_RUN: ["aim run", "aimming run", "shoot run", "pistol run"],
  SHOOT: ["shoot", "shooting"],
  HIT: ["hit", "hurt", "damage", "injured"],
  DIE: ["death", "die", "dead", "dying"],
} as const;
