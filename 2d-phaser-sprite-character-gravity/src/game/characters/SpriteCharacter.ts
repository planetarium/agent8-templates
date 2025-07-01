import Phaser from "phaser";

export class SpriteCharacter extends Phaser.Physics.Arcade.Sprite {
  private moveSpeed: number = 200;
  private jumpPower: number = 900;
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

  moveLeft() {
    if (this.isAttacking) return;

    this.setVelocityX(-this.moveSpeed);
    this.anims.play(`${this.texture.key}-left`, true);
    this.setFlipX(true);
  }

  moveRight() {
    if (this.isAttacking) return;

    this.setVelocityX(this.moveSpeed);
    this.anims.play(`${this.texture.key}-right`, true);
    this.setFlipX(false);
  }

  stop() {
    if (this.isAttacking) return this;

    this.setVelocityX(0);
    this.anims.play(`${this.texture.key}-turn`);
    return this;
  }

  jump() {
    if (this.isAttacking) return false;

    // body.touching.down과 body.blocked.down 둘 다 확인
    if (this.body.touching.down || this.body.blocked.down) {
      this.setVelocityY(-this.jumpPower);
      this.anims.play(`${this.texture.key}-jump`);
      console.log("Jumping!"); // 디버깅 로그
      return true;
    }
    return false;
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

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    // 공격 중이면 다른 입력 무시
    if (this.isAttacking) return;

    // 좌우 이동
    if (cursors.left.isDown) {
      this.moveLeft();
    } else if (cursors.right.isDown) {
      this.moveRight();
    } else {
      this.stop();
    }

    // 점프
    if (cursors.up.isDown) {
      this.jump();
    }

    // 공격
    if (cursors.space.isDown && !this.isAttacking) {
      this.attack();
    }
  }
}
