export enum CharacterAction {
  /** Standing still */
  IDLE = "IDLE",
  /** WALKING AT NORMAL SPEED */
  WALK = "WALK",
  /** RUNNING AT INCREASED SPEED */
  RUN = "RUN",
  /** JUMP ACTION */
  JUMP_UP = "JUMP UP",
  /** JUMP ACTION */
  FALL_IDLE = "FALL IDLE",
  /** JUMP ACTION */
  FALL_DOWN = "FALL DOWN",
  /** ATTACK ACTION */
  PUNCH = "PUNCH",
  /** ATTACK HIT */
  HIT = "HIT",
  /** ATTACK HIT */
  DIE = "DIE",
}

export const CHARACTER_CONSTANTS = {
  PHYSICS: {
    // 이동 속도 설정
    MOVE_SPEED: 3,
    RUN_SPEED: 6,
    // 점프 힘
    JUMP_FORCE: 2,
    // 회전 설정
    ROTATION: {
      LERP_FACTOR: 10,
    },
    // 콜라이더 설정
    COLLIDER: {
      // 캡슐 콜라이더 설정
      CAPSULE: {
        RADIUS: 0.3, // 캡슐 반지름
        HEIGHT: 1.1, // 캡슐 높이 (반구 두 개 사이의 실린더 높이)
        OFFSET_Y: 0.85, // 캡슐 중심점의 Y축 오프셋
      },
    },
  },
};
