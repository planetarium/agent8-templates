import Phaser from 'phaser';
import { EventBus, EVENTS, HUDData } from '../EventBus';

interface DropItem {
  sprite: Phaser.GameObjects.Image;
  vel: number;
  type: 'ember' | 'crystal' | 'life';
}

interface Enemy {
  sprite: Phaser.GameObjects.Image;
  hp: number;
  maxHp: number;
  speed: number;
  shootCd: number;
  shootTimer: number;
  wave: number;
  isBoss: boolean;
  variant: 'normal' | 'fast' | 'tank' | 'sniper';
}

export class GameScene extends Phaser.Scene {
  // Player
  private player!: Phaser.GameObjects.Image;
  private playerHP = 5;
  private maxHP = 5;
  private playerInvince = 0;
  private playerBullets: Phaser.GameObjects.Image[] = [];
  private shootCooldown = 0;
  private shootRate = 180;
  private spreadLevel = 1; // 1=single, 2=double, 3=triple

  // Enemies
  private enemies: Enemy[] = [];
  private enemyBullets: Phaser.GameObjects.Image[] = [];
  private waveNumber = 1;
  private waveTimer = 0;
  private waveInterval = 6000;
  private enemiesThisWave = 0;
  private bossAlive = false;

  // Drops
  private drops: DropItem[] = [];
  private emberCollected = 0;
  private emberPending = 0;

  // Score
  private score = 0;

  // Background
  private bg!: Phaser.GameObjects.TileSprite;

  // Input
  private pointerDown = false;
  private pointerX = 0;
  private pointerY = 0;

  // Virtual Joystick
  private joystickActive = false;
  private joystickBaseX = 0;
  private joystickBaseY = 0;
  private joystickDX = 0;
  private joystickDY = 0;
  private joystickRadius = 60;
  private joystickHandleRadius = 26;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickHandle!: Phaser.GameObjects.Arc;
  private joystickBaseRing!: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;

  // Game state
  private gameOver = false;
  private timeSinceShot = 9999;
  private explosions: { x: number; y: number; time: number; circles: Phaser.GameObjects.Arc[] }[] = [];

  // Power-up timers
  private spreadTimer = 0;
  private shieldActive = false;
  private shieldTimer = 0;
  private shieldGfx!: Phaser.GameObjects.Arc;

  // Engine glow
  private engineGlow!: Phaser.GameObjects.Ellipse;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.gameOver = false;
    this.score = 0;
    this.waveNumber = 1;
    this.waveTimer = 0;
    this.enemiesThisWave = 0;
    this.bossAlive = false;
    this.playerHP = 5;
    this.maxHP = 5;
    this.playerInvince = 0;
    this.emberCollected = 0;
    this.emberPending = 0;
    this.timeSinceShot = 9999;
    this.joystickActive = false;
    this.joystickPointerId = null;
    this.joystickDX = 0;
    this.joystickDY = 0;
    this.pointerDown = false;
    this.spreadLevel = 1;
    this.spreadTimer = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.enemies = [];
    this.drops = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.explosions = [];

    this.input.removeAllListeners();

    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'GameScene' });
    this.emitHUD();

    // Background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);

    // Player ship (dragon)
    this.player = this.add.image(W / 2, H * 0.82, 'player');
    this.player.setDisplaySize(64, 64);
    this.player.setDepth(5);

    // Engine glow underneath player
    this.engineGlow = this.add.ellipse(W / 2, H * 0.82 + 30, 28, 12, 0xff6600, 0.5);
    this.engineGlow.setDepth(4);
    this.tweens.add({
      targets: this.engineGlow,
      displayWidth: 38,
      displayHeight: 18,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Shield visual (hidden initially)
    this.shieldGfx = this.add.circle(W / 2, H * 0.82, 40, 0x44aaff, 0.15);
    this.shieldGfx.setStrokeStyle(2, 0x44ccff, 0.6);
    this.shieldGfx.setDepth(6);
    this.shieldGfx.setVisible(false);

    // Virtual Joystick visuals
    this.joystickBase = this.add.circle(0, 0, this.joystickRadius, 0x000000, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing = this.add.circle(0, 0, this.joystickRadius, 0xffffff, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing.setStrokeStyle(2, 0xff8833, 0.35);
    this.joystickHandle = this.add.circle(0, 0, this.joystickHandleRadius, 0xff6600, 0.25)
      .setDepth(21).setVisible(false);
    this.joystickHandle.setStrokeStyle(2, 0xffaa44, 0.8);

    // Touch / mouse
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.joystickPointerId === p.id && this.joystickActive) {
        const dx = p.x - this.joystickBaseX;
        const dy = p.y - this.joystickBaseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, this.joystickRadius);
        const angle = Math.atan2(dy, dx);
        this.joystickDX = (clampedDist / this.joystickRadius) * Math.cos(angle);
        this.joystickDY = (clampedDist / this.joystickRadius) * Math.sin(angle);
        const hx = this.joystickBaseX + Math.cos(angle) * clampedDist;
        const hy = this.joystickBaseY + Math.sin(angle) * clampedDist;
        this.joystickHandle.setPosition(hx, hy);
      }
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.joystickActive) {
        this.joystickActive = true;
        this.joystickPointerId = p.id;
        this.joystickBaseX = p.x;
        this.joystickBaseY = p.y;
        this.joystickDX = 0;
        this.joystickDY = 0;
        this.joystickBase.setPosition(p.x, p.y).setVisible(true);
        this.joystickBaseRing.setPosition(p.x, p.y).setVisible(true);
        this.joystickHandle.setPosition(p.x, p.y).setVisible(true);
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.id === this.joystickPointerId) {
        this.joystickActive = false;
        this.joystickPointerId = null;
        this.joystickDX = 0;
        this.joystickDY = 0;
        this.joystickBase.setVisible(false);
        this.joystickBaseRing.setVisible(false);
        this.joystickHandle.setVisible(false);
      }
    });

    this.input.keyboard?.addKey('SPACE')?.on('down', () => { this.pointerDown = true; });
    this.input.keyboard?.addKey('SPACE')?.on('up', () => { this.pointerDown = false; });

    // Initial wave
    this.spawnWave();

    // Camera flash-in
    this.cameras.main.flash(400, 30, 0, 0);
  }

  private emitHUD() {
    const data: HUDData = {
      score: this.score,
      wave: this.waveNumber,
      stardust: this.emberCollected,
      hp: this.playerHP,
      maxHp: this.maxHP,
    };
    EventBus.emit(EVENTS.HUD_UPDATE, data);
  }

  private spawnWave() {
    const W = this.cameras.main.width;
    const isBossWave = this.waveNumber % 5 === 0;

    if (isBossWave) {
      this.bossAlive = true;
      const boss = this.add.image(W / 2, -100, 'boss');
      boss.setDisplaySize(120, 120);
      boss.setDepth(3);
      this.enemies.push({
        sprite: boss,
        hp: 50 + this.waveNumber * 10,
        maxHp: 50 + this.waveNumber * 10,
        speed: 50,
        shootCd: 700,
        shootTimer: 0,
        wave: this.waveNumber,
        isBoss: true,
        variant: 'normal',
      });
      // Boss entrance tween
      this.tweens.add({ targets: boss, y: 130, duration: 1500, ease: 'Cubic.easeOut' });
      this.cameras.main.shake(400, 0.015);
      this.showWaveBanner(`BOSS WAVE ${this.waveNumber}`, '#ff4400');
    } else {
      const count = 3 + Math.floor(this.waveNumber * 1.3);
      this.enemiesThisWave = count;
      for (let i = 0; i < count; i++) {
        this.time.delayedCall(i * 320, () => this.spawnEnemy());
      }
      this.showWaveBanner(`WAVE ${this.waveNumber}`, '#ffaa33');
    }
  }

  private showWaveBanner(text: string, color: string) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const banner = this.add.text(W / 2, H / 2, text, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      y: H / 2 - 20,
      duration: 400,
      yoyo: true,
      hold: 800,
      onComplete: () => banner.destroy(),
    });
  }

  private spawnEnemy() {
    const W = this.cameras.main.width;
    const x = Phaser.Math.Between(30, W - 30);
    const enemy = this.add.image(x, -30, 'enemy');

    // Assign variant based on wave and randomness
    const roll = Math.random();
    let variant: 'normal' | 'fast' | 'tank' | 'sniper';
    if (this.waveNumber >= 8 && roll < 0.15) {
      variant = 'sniper';
    } else if (this.waveNumber >= 5 && roll < 0.35) {
      variant = 'tank';
    } else if (this.waveNumber >= 3 && roll < 0.55) {
      variant = 'fast';
    } else {
      variant = 'normal';
    }

    let size = 44;
    let hp = 2 + Math.floor(this.waveNumber * 0.7);
    let speed = 65 + this.waveNumber * 8;
    let shootCd = 2500 - Math.min(this.waveNumber * 100, 1500);

    switch (variant) {
      case 'fast':
        size = 36;
        speed *= 1.6;
        hp = Math.max(1, hp - 1);
        enemy.setTint(0xffaa00);
        break;
      case 'tank':
        size = 56;
        speed *= 0.6;
        hp = Math.floor(hp * 2.5);
        enemy.setTint(0x884422);
        break;
      case 'sniper':
        size = 40;
        speed *= 0.8;
        shootCd = Math.max(400, shootCd * 0.5);
        enemy.setTint(0xff2200);
        break;
    }

    enemy.setDisplaySize(size, size);
    enemy.setDepth(3);

    this.enemies.push({
      sprite: enemy,
      hp,
      maxHp: hp,
      speed,
      shootCd,
      shootTimer: Math.random() * 1500,
      wave: this.waveNumber,
      isBoss: false,
      variant,
    });
  }

  private fireBullet() {
    const px = this.player.x;
    const py = this.player.y - 32;

    if (this.spreadLevel >= 3) {
      // Triple shot
      for (const offset of [-12, 0, 12]) {
        const b = this.add.image(px + offset, py, 'playerBullet');
        b.setDisplaySize(14, 28);
        b.setDepth(4);
        b.setBlendMode(Phaser.BlendModes.ADD);
        b.setData('offsetAngle', offset * 0.03);
        this.playerBullets.push(b);
      }
    } else if (this.spreadLevel >= 2) {
      // Double shot
      for (const offset of [-8, 8]) {
        const b = this.add.image(px + offset, py, 'playerBullet');
        b.setDisplaySize(14, 28);
        b.setDepth(4);
        b.setBlendMode(Phaser.BlendModes.ADD);
        b.setData('offsetAngle', 0);
        this.playerBullets.push(b);
      }
    } else {
      // Single shot
      const b = this.add.image(px, py, 'playerBullet');
      b.setDisplaySize(14, 28);
      b.setDepth(4);
      b.setBlendMode(Phaser.BlendModes.ADD);
      b.setData('offsetAngle', 0);
      this.playerBullets.push(b);
    }
  }

  private fireEnemyBullet(enemy: Enemy) {
    const dx = this.player.x - enemy.sprite.x;
    const dy = this.player.y - enemy.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = enemy.isBoss ? 280 : (enemy.variant === 'sniper' ? 300 : 200);
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const b = this.add.image(enemy.sprite.x, enemy.sprite.y, 'enemyBullet');
    b.setDisplaySize(16, 16);
    b.setDepth(4);
    b.setBlendMode(Phaser.BlendModes.ADD);
    b.setData('vx', vx);
    b.setData('vy', vy);
    this.enemyBullets.push(b);
  }

  private spawnDrop(x: number, y: number, isBoss = false) {
    const roll = Math.random();
    let type: 'ember' | 'crystal' | 'life';

    if (isBoss) {
      type = 'ember';
    } else if (roll < 0.70) {
      type = 'ember';
    } else if (roll < 0.85) {
      type = 'crystal';
    } else {
      type = 'life';
    }

    const key = type === 'ember' ? 'ember' : 'crystal';
    const tint = type === 'life' ? 0xff4444 : 0xffffff;
    const sprite = this.add.image(x, y, key);
    const size = type === 'ember' ? 28 : 22;
    sprite.setDisplaySize(size, size);
    sprite.setDepth(4);
    sprite.setTint(tint);

    this.tweens.add({
      targets: sprite,
      displayWidth: sprite.displayWidth * 1.35,
      displayHeight: sprite.displayHeight * 1.35,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    this.drops.push({ sprite, vel: 100 + Math.random() * 60, type });
  }

  private explodeAt(x: number, y: number, big = false) {
    const count = big ? 24 : 14;
    const circles: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = big ? Phaser.Math.Between(70, 180) : Phaser.Math.Between(40, 110);
      const r = big ? Phaser.Math.Between(4, 14) : Phaser.Math.Between(2, 8);
      const colors = [0xff4400, 0xff8800, 0xffcc00, 0xff2200, 0xcc3300];
      const c = this.add.circle(x, y, r, Phaser.Math.RND.pick(colors)).setDepth(8);
      c.setData('vx', Math.cos(angle) * speed);
      c.setData('vy', Math.sin(angle) * speed);
      circles.push(c);
    }
    this.explosions.push({ x, y, time: 0, circles });

    if (big) this.cameras.main.shake(250, 0.015);
  }

  update(time: number, delta: number) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Scroll background
    this.bg.tilePositionY -= 1.8;

    // Player movement via virtual joystick
    if (this.joystickActive && (this.joystickDX !== 0 || this.joystickDY !== 0)) {
      const speed = 340;
      this.player.x = Phaser.Math.Clamp(
        this.player.x + this.joystickDX * speed * dt, 30, W - 30
      );
      this.player.y = Phaser.Math.Clamp(
        this.player.y + this.joystickDY * speed * dt, H * 0.2, H - 30
      );
    } else if (this.pointerDown) {
      const tx = Phaser.Math.Clamp(this.pointerX, 30, W - 30);
      const ty = Phaser.Math.Clamp(this.pointerY, H * 0.4, H - 30);
      this.player.x += (tx - this.player.x) * 8 * dt;
      this.player.y += (ty - this.player.y) * 8 * dt;
    }

    // Update engine glow position
    this.engineGlow.setPosition(this.player.x, this.player.y + 30);
    this.shieldGfx.setPosition(this.player.x, this.player.y);

    // Power-up timers
    if (this.spreadTimer > 0) {
      this.spreadTimer -= delta;
      if (this.spreadTimer <= 0) {
        this.spreadLevel = 1;
        this.spreadTimer = 0;
      }
    }
    if (this.shieldTimer > 0) {
      this.shieldTimer -= delta;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this.shieldGfx.setVisible(false);
        this.shieldTimer = 0;
      }
    }

    // Auto-shoot
    this.timeSinceShot += delta;
    if (this.timeSinceShot >= this.shootRate) {
      this.timeSinceShot = 0;
      this.fireBullet();
    }

    // Move player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      const offsetAngle = b.getData('offsetAngle') || 0;
      b.y -= 750 * dt;
      b.x += offsetAngle * 200 * dt;
      if (b.y < -20) {
        b.destroy();
        this.playerBullets.splice(i, 1);
      }
    }

    // Move enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.getData('vx') * dt;
      b.y += b.getData('vy') * dt;
      if (b.y > H + 20 || b.x < -20 || b.x > W + 20 || b.y < -20) {
        b.destroy();
        this.enemyBullets.splice(i, 1);
        continue;
      }
      if (this.playerInvince <= 0) {
        const dx = b.x - this.player.x;
        const dy = b.y - this.player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 22) {
          b.destroy();
          this.enemyBullets.splice(i, 1);
          this.hitPlayer();
        }
      }
    }

    // Enemy AI
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const s = e.sprite;

      if (e.isBoss) {
        // Boss sways side to side
        const targetX = W / 2 + Math.sin(time * 0.0012) * W * 0.32;
        s.x += (targetX - s.x) * 2.2 * dt;
        s.y += (130 - s.y) * 1.5 * dt;
      } else {
        const dx = this.player.x - s.x;
        const dy = this.player.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        switch (e.variant) {
          case 'fast':
            s.x += (dx / dist) * e.speed * dt;
            s.y += e.speed * 0.7 * dt;
            break;
          case 'tank':
            s.y += e.speed * 0.4 * dt;
            s.x += Math.sin(time * 0.002 + i) * 30 * dt;
            break;
          case 'sniper':
            // Snipers try to stay at range
            if (s.y < H * 0.3) {
              s.y += e.speed * 0.5 * dt;
            }
            s.x += (dx / dist) * e.speed * 0.3 * dt;
            break;
          default:
            s.x += (dx / dist) * e.speed * dt;
            s.y += (dy / dist) * e.speed * dt * 0.4;
            s.y += e.speed * 0.3 * dt;
            break;
        }
      }

      // Enemy shooting
      e.shootTimer += delta;
      if (e.shootTimer >= e.shootCd) {
        e.shootTimer = 0;
        this.fireEnemyBullet(e);
        if (e.isBoss) {
          // Boss spread attack
          for (let a = -25; a <= 25; a += 10) {
            const bx = this.add.image(s.x, s.y, 'enemyBullet');
            bx.setDisplaySize(18, 18);
            bx.setDepth(4);
            bx.setBlendMode(Phaser.BlendModes.ADD);
            const angle = Math.atan2(this.player.y - s.y, this.player.x - s.x) + Phaser.Math.DegToRad(a);
            bx.setData('vx', Math.cos(angle) * 240);
            bx.setData('vy', Math.sin(angle) * 240);
            this.enemyBullets.push(bx);
          }
        }
      }

      // Player bullet collision
      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const b = this.playerBullets[j];
        const dx = b.x - s.x;
        const dy = b.y - s.y;
        const hitR = e.isBoss ? 55 : 24;
        if (Math.sqrt(dx * dx + dy * dy) < hitR) {
          b.destroy();
          this.playerBullets.splice(j, 1);
          e.hp -= 1;
          this.tweens.add({ targets: s, alpha: 0.2, duration: 60, yoyo: true });

          if (e.hp <= 0) {
            this.explodeAt(s.x, s.y, e.isBoss);
            // Boss drops 15-25, normal enemies 1-4
            const drops = e.isBoss ? Phaser.Math.Between(15, 25) : Phaser.Math.Between(1, 4);
            for (let d = 0; d < drops; d++) {
              this.spawnDrop(
                s.x + Phaser.Math.Between(-45, 45),
                s.y + Phaser.Math.Between(-30, 30),
                e.isBoss
              );
            }
            const pts = e.isBoss ? 5000 + this.waveNumber * 500 : 100 + this.waveNumber * 15;
            this.score += pts;
            if (e.isBoss) this.bossAlive = false;
            s.destroy();
            this.enemies.splice(i, 1);
            this.emitHUD();
            break;
          }
        }
      }

      // Enemy collide with player
      if (this.playerInvince <= 0 && !e.isBoss) {
        const dx = s.x - this.player.x;
        const dy = s.y - this.player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 28) {
          this.explodeAt(s.x, s.y);
          s.destroy();
          this.enemies.splice(i, 1);
          this.hitPlayer();
          continue;
        }
      }

      if (s.y > H + 80) {
        s.destroy();
        this.enemies.splice(i, 1);
      }
    }

    // Move drops
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.sprite.y += d.vel * dt;

      const dx = d.sprite.x - this.player.x;
      const dy = d.sprite.y - this.player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 36) {
        if (d.type === 'ember') {
          this.emberCollected++;
          this.emberPending++;
          this.showFloatText(d.sprite.x, d.sprite.y, '+1', '#ff8844');
        } else if (d.type === 'crystal') {
          // Crystal = power-up (spread shot OR shield)
          const powerRoll = Math.random();
          if (powerRoll < 0.5) {
            this.spreadLevel = Math.min(3, this.spreadLevel + 1);
            this.spreadTimer = 12000;
            this.showFloatText(d.sprite.x, d.sprite.y, 'SPREAD!', '#44aaff');
          } else {
            this.shieldActive = true;
            this.shieldTimer = 8000;
            this.shieldGfx.setVisible(true);
            this.showFloatText(d.sprite.x, d.sprite.y, 'SHIELD!', '#44ffaa');
          }
          this.score += 200;
          // Crystal also gives some embers
          this.emberCollected += 2;
          this.emberPending += 2;
        } else {
          if (this.playerHP < this.maxHP) {
            this.playerHP++;
          }
          this.showFloatText(d.sprite.x, d.sprite.y, '+LIFE', '#ff4444');
        }
        this.emitHUD();
        d.sprite.destroy();
        this.drops.splice(i, 1);
        continue;
      }

      if (d.sprite.y > H + 30) {
        d.sprite.destroy();
        this.drops.splice(i, 1);
      }
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.time += delta;
      const life = 700;
      if (ex.time > life) {
        ex.circles.forEach(c => c.destroy());
        this.explosions.splice(i, 1);
        continue;
      }
      const progress = ex.time / life;
      ex.circles.forEach(c => {
        c.x += c.getData('vx') * dt;
        c.y += c.getData('vy') * dt;
        c.setAlpha(1 - progress);
      });
    }

    // Player invincibility flash
    if (this.playerInvince > 0) {
      this.playerInvince -= delta;
      this.player.setAlpha(Math.sin(this.playerInvince * 0.02) > 0 ? 1 : 0.3);
      if (this.playerInvince <= 0) this.player.setAlpha(1);
    }

    // Next wave logic
    if (!this.bossAlive && this.enemies.length === 0) {
      this.waveTimer += delta;
      if (this.waveTimer > this.waveInterval) {
        this.waveTimer = 0;
        this.waveNumber++;
        this.emitHUD();
        this.spawnWave();
      }
    }

    // Keyboard movement
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors) {
      const spd = 240 * dt;
      if (cursors.left.isDown) this.player.x = Math.max(30, this.player.x - spd);
      if (cursors.right.isDown) this.player.x = Math.min(W - 30, this.player.x + spd);
      if (cursors.up.isDown) this.player.y = Math.max(H * 0.3, this.player.y - spd);
      if (cursors.down.isDown) this.player.y = Math.min(H - 30, this.player.y + spd);
    }
  }

  private hitPlayer() {
    if (this.shieldActive) {
      this.shieldActive = false;
      this.shieldGfx.setVisible(false);
      this.shieldTimer = 0;
      this.cameras.main.flash(100, 0, 100, 200);
      this.showFloatText(this.player.x, this.player.y - 30, 'BLOCKED!', '#44ccff');
      return;
    }

    this.playerHP--;
    this.playerInvince = 2000;
    this.emitHUD();
    this.cameras.main.flash(120, 180, 30, 0);
    this.cameras.main.shake(150, 0.012);

    if (this.playerHP <= 0) {
      this.explodeAt(this.player.x, this.player.y, true);
      this.player.setVisible(false);
      this.engineGlow.setVisible(false);
      this.time.delayedCall(600, () => this.endGame());
    }
  }

  private showFloatText(x: number, y: number, msg: string, color: string) {
    const t = this.add.text(x, y, msg, {
      fontFamily: 'monospace', fontSize: '14px', color,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: t, y: y - 50, alpha: 0, duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  private endGame() {
    this.gameOver = true;
    this.enemies.forEach(e => e.sprite.destroy());
    this.enemies = [];
    this.drops.forEach(d => d.sprite.destroy());
    this.drops = [];
    this.playerBullets.forEach(b => b.destroy());
    this.playerBullets = [];
    this.enemyBullets.forEach(b => b.destroy());
    this.enemyBullets = [];

    const best = parseInt(localStorage.getItem('dragonforge_best') || '0', 10);
    if (this.score > best) localStorage.setItem('dragonforge_best', String(this.score));

    this.scene.start('GameOverScene', {
      score: this.score,
      wave: this.waveNumber,
      stardust: this.emberCollected,
      stardustPending: this.emberPending,
    });
  }

  getStardust() { return this.emberCollected; }
}
