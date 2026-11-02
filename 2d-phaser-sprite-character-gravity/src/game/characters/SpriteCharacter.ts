import Phaser from "phaser";

// 이동·점프 손맛 상수. 시간 값은 모두 초 단위이고 update에 넘어온 delta로 잰다(프레임 수가 아님).
const MOVE_SPEED = 200; // 최대 좌우 속도(px/s)
const JUMP_POWER = 900; // 점프 순간 위쪽 속도(px/s)
const GROUND_ACCEL = 2000; // 지상 가속(px/s²) — 0.1초에 최대 속도
const GROUND_DECEL = 2000; // 지상 감속(px/s²) — 0.1초에 정지
const AIR_ACCEL = 1400; // 공중 가속(px/s²) — 약 0.14초에 최대 속도
const AIR_DECEL = 1400; // 공중 감속(px/s²) — 약 0.14초에 정지
const COYOTE_TIME = 0.12; // 발판을 벗어난 뒤에도 점프를 받아 주는 시간(초)
const JUMP_BUFFER_TIME = 0.1; // 착지 전에 누른 점프를 기억해 두는 시간(초)

export class SpriteCharacter extends Phaser.Physics.Arcade.Sprite {
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private waitingForTakeoff: boolean = false;
  private isAttacking: boolean = false;
  private attackHitbox: Phaser.GameObjects.Rectangle | null = null;
  private attackSound: Phaser.Sound.BaseSound | null = null;
  private attackAnimComplete: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string) {
    super(scene, x, y, key);

    this.setupAnimations();

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setBounce(0.2);
    this.setCollideWorldBounds(true);

    this.body.setSize(62, 75);
    this.body.setOffset(23, -5);
  }

  setupAnimations() {
    // key 값을 기반으로 애니메이션 이름 생성
    const spriteKey = this.texture.key;
    const leftAnim = `${spriteKey}-left`;
    const rightAnim = `${spriteKey}-right`;
    const turnAnim = `${spriteKey}-turn`;
    const jumpAnim = `${spriteKey}-jump`;
    const attackAnim = `${spriteKey}-attack`;

    // 해당 애니메이션이 이미 존재하는지 확인
    if (this.scene.anims.exists(leftAnim)) return;

    // 왼쪽 이동 애니메이션
    this.scene.anims.create({
      key: leftAnim,
      frames: this.scene.anims.generateFrameNumbers(spriteKey, {
        start: 4,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // 정지 애니메이션
    this.scene.anims.create({
      key: turnAnim,
      frames: [{ key: spriteKey, frame: 0 }],
      frameRate: 20,
    });

    // 오른쪽 이동 애니메이션
    this.scene.anims.create({
      key: rightAnim,
      frames: this.scene.anims.generateFrameNumbers(spriteKey, {
        start: 8,
        end: 11,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // 점프 애니메이션
    this.scene.anims.create({
      key: jumpAnim,
      frames: [{ key: spriteKey, frame: 3 }],
      frameRate: 10,
    });

    // 공격 애니메이션
    this.scene.anims.create({
      key: attackAnim,
      frames: this.scene.anims.generateFrameNumbers(spriteKey, {
        start: 12,
        end: 15,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // 공격 애니메이션 완료 이벤트 리스너
    this.on(`animationcomplete-${attackAnim}`, this.onAttackAnimComplete, this);
  }

  onAttackAnimComplete() {
    this.isAttacking = false;
    this.attackAnimComplete = true;

    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }
  }

  isGrounded() {
    // body.touching.down과 body.blocked.down 둘 다 확인
    return this.body.touching.down || this.body.blocked.down;
  }

  // 좌우 속도를 목표 속도 쪽으로 이번 프레임 몫(가속도 × dt)만큼만 옮긴다.
  // 입력이 있으면 가속, 없으면 감속 값을 쓰고, 지상과 공중의 값을 따로 둔다.
  private accelerateTo(targetVelocityX: number, dt: number) {
    const grounded = this.isGrounded();
    const rate =
      targetVelocityX !== 0
        ? grounded ? GROUND_ACCEL : AIR_ACCEL
        : grounded ? GROUND_DECEL : AIR_DECEL;
    const maxChange = rate * dt;
    const velocityX = this.body.velocity.x;
    const diff = targetVelocityX - velocityX;

    this.setVelocityX(
      Math.abs(diff) <= maxChange
        ? targetVelocityX
        : velocityX + Math.sign(diff) * maxChange
    );
  }

  moveLeft(dt: number) {
    if (this.isAttacking) return;

    this.accelerateTo(-MOVE_SPEED, dt);
    this.anims.play(`${this.texture.key}-left`, true);
    this.setFlipX(true);
  }

  moveRight(dt: number) {
    if (this.isAttacking) return;

    this.accelerateTo(MOVE_SPEED, dt);
    this.anims.play(`${this.texture.key}-right`, true);
    this.setFlipX(false);
  }

  // Sprite.stop()을 덮어쓰므로 dt는 선택 인자다. 인자 없이 부르면 속도는 그대로 둔다.
  stop(dt: number = 0) {
    if (this.isAttacking) return this;

    this.accelerateTo(0, dt);
    this.anims.play(`${this.texture.key}-turn`);
    return this;
  }

  // 코요테 타임 안(바닥에 있거나 막 벗어난 직후)일 때만 뛴다.
  jump() {
    if (this.isAttacking) return false;
    if (this.coyoteTimer <= 0) return false;

    this.setVelocityY(-JUMP_POWER);
    this.anims.play(`${this.texture.key}-jump`);

    // 유예와 버퍼를 다 써서, 같은 입력이나 남은 유예로 공중에서 한 번 더 뛰지 않게 한다.
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.waitingForTakeoff = true;
    return true;
  }

  attack() {
    this.isAttacking = true;
    this.attackAnimComplete = false;
    this.anims.play(`${this.texture.key}-attack`);

    // 공격 중에는 이동 속도 감소
    this.setVelocityX(this.body.velocity.x * 0.5);

    // 공격 사운드 재생
    if (this.attackSound) {
      try {
        this.attackSound.play();
      } catch (error) {
        console.error("Error playing attack sound:", error);
      }
    }

    // 공격 히트박스 생성
    this.createAttackHitbox();

    // 안전장치: 애니메이션이 끝나지 않을 경우를 대비해 타이머 설정
    this.scene.time.delayedCall(500, () => {
      if (this.isAttacking && !this.attackAnimComplete) {
        this.onAttackAnimComplete();
      }
    });

    return true;
  }

  createAttackHitbox() {
    // 기존 히트박스 제거
    if (this.attackHitbox) {
      this.attackHitbox.destroy();
    }

    // 캐릭터 방향에 따라 히트박스 위치 조정
    const facingLeft = this.flipX;
    const offsetX = facingLeft ? -50 : 50;

    // 디버그 모드 확인
    const isDebugMode = this.scene.physics.world.debugGraphic?.visible ?? false;

    // 히트박스 생성 (디버그 모드일 때만 색상 표시)
    this.attackHitbox = this.scene.add.rectangle(
      this.x + offsetX,
      this.y,
      60,
      100,
      0xff0000,
      isDebugMode ? 0.3 : 0 // 디버그 모드일 때만 알파값 설정
    );

    // 히트박스에 물리 속성 추가
    this.scene.physics.add.existing(this.attackHitbox, false);

    // 히트박스 자동 제거 타이머
    this.scene.time.delayedCall(300, () => {
      if (this.attackHitbox) {
        this.attackHitbox.destroy();
        this.attackHitbox = null;
      }
    });

    return this.attackHitbox;
  }

  getAttackHitbox() {
    return this.attackHitbox;
  }

  isInAttackState() {
    return this.isAttacking;
  }

  // delta는 Scene.update(time, delta)가 받은 밀리초 값을 그대로 넘긴다.
  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, delta: number) {
    const dt = delta / 1000;

    // 코요테 타임: 바닥에 있는 동안 채우고, 떠 있으면 시간만큼 줄인다.
    // 점프 직후 물리 스텝이 아직 안 돈 프레임은 바닥 판정이 남아 있으므로, 실제로 뜰 때까지 채우지 않는다.
    if (this.waitingForTakeoff && !this.isGrounded()) {
      this.waitingForTakeoff = false;
    }
    if (this.isGrounded() && !this.waitingForTakeoff) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer -= dt;
    }

    // 점프 입력 버퍼: 새로 누른 순간만 넣는다. 누르고 있기만 해서는 다시 뛰지 않는다.
    // 공격 중에도 매 프레임 읽어 두어야 공격이 끝난 뒤 오래된 입력으로 뛰지 않는다.
    if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
      this.jumpBufferTimer = JUMP_BUFFER_TIME;
    } else {
      this.jumpBufferTimer -= dt;
    }

    // 공격 중이면 다른 입력 무시
    if (this.isAttacking) return;

    // 좌우 이동
    if (cursors.left.isDown) {
      this.moveLeft(dt);
    } else if (cursors.right.isDown) {
      this.moveRight(dt);
    } else {
      this.stop(dt);
    }

    // 점프
    if (this.jumpBufferTimer > 0) {
      this.jump();
    }

    // 공격
    if (cursors.space.isDown && !this.isAttacking) {
      this.attack();
    }
  }
}
