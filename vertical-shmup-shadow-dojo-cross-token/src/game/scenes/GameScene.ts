import Phaser from 'phaser';
import { EventBus, EVENTS, HUDData } from '../EventBus';

interface DropItem {
  sprite: Phaser.GameObjects.Image;
  vel: number;
  type: 'soul' | 'crystal' | 'life';
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
}

export class GameScene extends Phaser.Scene {
  // Player
  private player!: Phaser.GameObjects.Image;
  private playerHP = 3;
  private maxHP = 3;
  private playerInvince = 0;
  private playerBullets: Phaser.GameObjects.Rectangle[] = [];
  private shootCooldown = 0;
  private shootRate = 200; // ms

  // Enemies
  private enemies: Enemy[] = [];
  private enemyBullets: (Phaser.GameObjects.Ellipse | Phaser.GameObjects.Image)[] = [];
  private waveNumber = 1;
  private waveTimer = 0;
  private waveInterval = 8000;
  private enemiesThisWave = 0;
  private bossAlive = false;

  // Drops
  private drops: DropItem[] = [];
  private soulsCollected = 0;
  private soulsPending = 0;

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
    this.playerHP = 3;
    this.maxHP = 3;
    this.playerInvince = 0;
    this.soulsCollected = 0;
    this.soulsPending = 0;
    this.timeSinceShot = 9999;
    this.joystickActive = false;
    this.joystickPointerId = null;
    this.joystickDX = 0;
    this.joystickDY = 0;
    this.pointerDown = false;
    this.enemies = [];
    this.drops = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.explosions = [];

    // Remove all previous input listeners to prevent duplication on restart
    this.input.removeAllListeners();

    // Notify React
    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'GameScene' });
    this.emitHUD();

    // Background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);

    // Player ninja
    this.player = this.add.image(W / 2, H * 0.82, 'player');
    this.player.setDisplaySize(60, 60);
    this.player.setDepth(5);

    // Virtual Joystick visuals
    this.joystickBase = this.add.circle(0, 0, this.joystickRadius, 0x000000, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing = this.add.circle(0, 0, this.joystickRadius, 0xffffff, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing.setStrokeStyle(2, 0xff4466, 0.35);
    this.joystickHandle = this.add.circle(0, 0, this.joystickHandleRadius, 0xff4466, 0.2)
      .setDepth(21).setVisible(false);
    this.joystickHandle.setStrokeStyle(2, 0xff6688, 0.8);

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
    this.cameras.main.flash(400, 40, 0, 20);
  }

  private emitHUD() {
    const data: HUDData = {
      score: this.score,
      wave: this.waveNumber,
      souls: this.soulsCollected,
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
      const boss = this.add.image(W / 2, -80, 'boss');
      boss.setDisplaySize(110, 110);
      boss.setDepth(3);
      this.enemies.push({
        sprite: boss,
        hp: 40 + this.waveNumber * 8,
        maxHp: 40 + this.waveNumber * 8,
        speed: 60,
        shootCd: 800,
        shootTimer: 0,
        wave: this.waveNumber,
        isBoss: true,
      });
      this.tweens.add({ targets: boss, y: 120, duration: 1200, ease: 'Cubic.easeOut' });
      this.showWaveBanner(`⛩ DEMON LORD · WAVE ${this.waveNumber} ⛩`, '#ff2244');
    } else {
      const count = 3 + Math.floor(this.waveNumber * 1.5);
      this.enemiesThisWave = count;
      for (let i = 0; i < count; i++) {
        this.time.delayedCall(i * 350, () => this.spawnEnemy());
      }
      this.showWaveBanner(`WAVE ${this.waveNumber}`, '#cc44ff');
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
      strokeThickness: 4,
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
    const size = 44 + Math.random() * 20;
    enemy.setDisplaySize(size, size);
    enemy.setDepth(3);

    this.enemies.push({
      sprite: enemy,
      hp: 2 + Math.floor(this.waveNumber * 0.7),
      maxHp: 2 + Math.floor(this.waveNumber * 0.7),
      speed: 60 + this.waveNumber * 10,
      shootCd: 2500 - Math.min(this.waveNumber * 120, 1500),
      shootTimer: Math.random() * 1500,
      wave: this.waveNumber,
      isBoss: false,
    });
  }

  private fireBullet() {
    const b = this.add.rectangle(
      this.player.x, this.player.y - 36, 5, 18, 0xff3355
    ).setDepth(4);
    this.playerBullets.push(b);
  }

  private fireEnemyBullet(enemy: Enemy) {
    const dx = this.player.x - enemy.sprite.x;
    const dy = this.player.y - enemy.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = enemy.isBoss ? 260 : 200;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const b = this.add.ellipse(enemy.sprite.x, enemy.sprite.y, 10, 14,
      enemy.isBoss ? 0x44ff44 : 0x22ff44
    ).setDepth(4);
    b.setData('vx', vx);
    b.setData('vy', vy);
    this.enemyBullets.push(b);
  }

  private spawnDrop(x: number, y: number, isBoss = false) {
    const roll = Math.random();
    const type: 'soul' | 'crystal' | 'life' = isBoss
      ? 'soul'
      : roll < 0.80 ? 'soul' : roll < 0.92 ? 'crystal' : 'life';

    const key = type === 'soul' ? 'soulEssence' : 'crystal';
    const tint = type === 'life' ? 0xff4444 : 0xffffff;
    const sprite = this.add.image(x, y, key);
    const size = type === 'soul' ? 30 : 22;
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
    const count = big ? 20 : 12;
    const circles: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = big ? Phaser.Math.Between(60, 160) : Phaser.Math.Between(40, 100);
      const r = big ? Phaser.Math.Between(4, 12) : Phaser.Math.Between(2, 8);
      const colors = [0xcc0033, 0xff4466, 0x880044, 0x440022];
      const c = this.add.circle(x, y, r, Phaser.Math.RND.pick(colors)).setDepth(8);
      c.setData('vx', Math.cos(angle) * speed);
      c.setData('vy', Math.sin(angle) * speed);
      circles.push(c);
    }
    this.explosions.push({ x, y, time: 0, circles });

    if (big) this.cameras.main.shake(200, 0.012);
  }

  update(time: number, delta: number) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Scroll background
    this.bg.tilePositionY -= 1.5;

    // Player movement via virtual joystick
    if (this.joystickActive && (this.joystickDX !== 0 || this.joystickDY !== 0)) {
      const speed = 320;
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

    // Auto-shoot
    this.timeSinceShot += delta;
    if (this.timeSinceShot >= this.shootRate) {
      this.timeSinceShot = 0;
      this.fireBullet();
    }

    // Move player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.y -= 700 * dt;
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
      if (b.y > H + 20 || b.x < -20 || b.x > W + 20) {
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
        const targetX = W / 2 + Math.sin(time * 0.001) * W * 0.3;
        s.x += (targetX - s.x) * 2 * dt;
        s.y += (130 - s.y) * 1.5 * dt;
      } else {
        const dx = this.player.x - s.x;
        const dy = this.player.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        s.x += (dx / dist) * e.speed * dt;
        s.y += (dy / dist) * e.speed * dt * 0.4;
        s.y += e.speed * 0.3 * dt;
      }

      // Enemy shooting
      e.shootTimer += delta;
      if (e.shootTimer >= e.shootCd) {
        e.shootTimer = 0;
        this.fireEnemyBullet(e);
        if (e.isBoss) {
          for (let a = -30; a <= 30; a += 15) {
            const bx = this.add.image(s.x, s.y, 'enemyBullet');
            bx.setDisplaySize(20, 20);
            bx.setDepth(4);
            bx.setBlendMode(Phaser.BlendModes.ADD);
            const angle = Math.atan2(this.player.y - s.y, this.player.x - s.x) + Phaser.Math.DegToRad(a);
            bx.setData('vx', Math.cos(angle) * 220);
            bx.setData('vy', Math.sin(angle) * 220);
            this.enemyBullets.push(bx);
          }
        }
      }

      // Player bullet collision
      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const b = this.playerBullets[j];
        const dx = b.x - s.x;
        const dy = b.y - s.y;
        const hitR = e.isBoss ? 50 : 24;
        if (Math.sqrt(dx * dx + dy * dy) < hitR) {
          b.destroy();
          this.playerBullets.splice(j, 1);
          e.hp -= 1;
          this.tweens.add({ targets: s, alpha: 0.2, duration: 60, yoyo: true });

          if (e.hp <= 0) {
            this.explodeAt(s.x, s.y, e.isBoss);
            const drops = e.isBoss ? Phaser.Math.Between(15, 20) : Phaser.Math.Between(1, 4);
            for (let d = 0; d < drops; d++) {
              this.spawnDrop(
                s.x + Phaser.Math.Between(-40, 40),
                s.y + Phaser.Math.Between(-25, 25),
                e.isBoss
              );
            }
            const pts = e.isBoss ? 5000 + this.waveNumber * 500 : 100 + this.waveNumber * 10;
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
        if (d.type === 'soul') {
          this.soulsCollected++;
          this.soulsPending++;
          this.showFloatText(d.sprite.x, d.sprite.y, '+1 魂', '#cc66ff');
        } else if (d.type === 'crystal') {
          this.soulsCollected += 3;
          this.soulsPending += 3;
          this.score += 150;
          this.showFloatText(d.sprite.x, d.sprite.y, '+3 魂', '#aa44ff');
        } else {
          if (this.playerHP < this.maxHP) {
            this.playerHP++;
          }
          this.showFloatText(d.sprite.x, d.sprite.y, '+LIFE', '#ff4466');
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
      const life = 600;
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
      const spd = 220 * dt;
      if (cursors.left.isDown) this.player.x = Math.max(30, this.player.x - spd);
      if (cursors.right.isDown) this.player.x = Math.min(W - 30, this.player.x + spd);
      if (cursors.up.isDown) this.player.y = Math.max(H * 0.3, this.player.y - spd);
      if (cursors.down.isDown) this.player.y = Math.min(H - 30, this.player.y + spd);
    }
  }

  private hitPlayer() {
    this.playerHP--;
    this.playerInvince = 2000;
    this.emitHUD();
    this.cameras.main.flash(120, 80, 0, 20);
    this.cameras.main.shake(150, 0.01);

    if (this.playerHP <= 0) {
      this.explodeAt(this.player.x, this.player.y, true);
      this.player.setVisible(false);
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

    const best = parseInt(localStorage.getItem('shadowdojo_best') || '0', 10);
    if (this.score > best) localStorage.setItem('shadowdojo_best', String(this.score));

    this.scene.start('GameOverScene', {
      score: this.score,
      wave: this.waveNumber,
      souls: this.soulsCollected,
      soulsPending: this.soulsPending,
    });
  }

  getSouls() { return this.soulsCollected; }
}
