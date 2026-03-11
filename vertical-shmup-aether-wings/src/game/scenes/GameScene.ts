import Phaser from 'phaser';
import { EventBus, EVENTS, HUDData } from '../EventBus';

interface DropItem {
  sprite: Phaser.GameObjects.Image;
  vel: number;
  type: 'lumina' | 'crystal' | 'life';
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
  private playerBullets: Phaser.GameObjects.Image[] = [];
  private shootCooldown = 0;
  private shootRate = 200; // ms

  // Enemies
  private enemies: Enemy[] = [];
  private enemyBullets: Phaser.GameObjects.Image[] = [];
  private waveNumber = 1;
  private waveTimer = 0;
  private waveInterval = 8000;
  private enemiesThisWave = 0;
  private bossAlive = false;

  // Drops
  private drops: DropItem[] = [];
  private stardustCollected = 0;
  private stardustPending = 0;

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
    this.stardustCollected = 0;
    this.stardustPending = 0;
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

    // Player ship
    this.player = this.add.image(W / 2, H * 0.82, 'player');
    this.player.setDisplaySize(60, 60);
    this.player.setDepth(5);

    // Virtual Joystick visuals
    this.joystickBase = this.add.circle(0, 0, this.joystickRadius, 0xd4af37, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing = this.add.circle(0, 0, this.joystickRadius, 0xffffff, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing.setStrokeStyle(2, 0xd4af37, 0.35);
    this.joystickHandle = this.add.circle(0, 0, this.joystickHandleRadius, 0xffffff, 0.25)
      .setDepth(21).setVisible(false);
    this.joystickHandle.setStrokeStyle(2, 0xd4af37, 0.8);

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
    this.cameras.main.flash(400, 212, 175, 55);
  }

  private emitHUD() {
    const data: HUDData = {
      score: this.score,
      wave: this.waveNumber,
      stardust: this.stardustCollected,
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
      const boss = this.add.image(W / 2, -150, 'boss');
      boss.setDisplaySize(180, 180);
      boss.setDepth(3);
      this.enemies.push({
        sprite: boss,
        hp: 50 + this.waveNumber * 10,
        maxHp: 50 + this.waveNumber * 10,
        speed: 60,
        shootCd: 800,
        shootTimer: 0,
        wave: this.waveNumber,
        isBoss: true,
      });
      this.tweens.add({ targets: boss, y: 140, duration: 1500, ease: 'Cubic.easeOut' });
      this.showWaveBanner(`⚠ ABYSSAL SERAPH WAVE ${this.waveNumber} ⚠`, '#ffcc00');
    } else {
      const count = 4 + Math.floor(this.waveNumber * 1.5);
      this.enemiesThisWave = count;
      for (let i = 0; i < count; i++) {
        this.time.delayedCall(i * 350, () => this.spawnEnemy());
      }
      this.showWaveBanner(`CELESTIAL WAVE ${this.waveNumber}`, '#ffcc00');
    }
  }

  private showWaveBanner(text: string, color: string) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const banner = this.add.text(W / 2, H / 2, text, {
      fontFamily: 'serif',
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
      hold: 1200,
      onComplete: () => banner.destroy(),
    });
  }

  private spawnEnemy() {
    const W = this.cameras.main.width;
    const x = Phaser.Math.Between(40, W - 40);
    const enemy = this.add.image(x, -50, 'enemy');
    const size = 50 + Math.random() * 20;
    enemy.setDisplaySize(size, size);
    enemy.setDepth(3);

    this.enemies.push({
      sprite: enemy,
      hp: 3 + Math.floor(this.waveNumber * 0.8),
      maxHp: 3 + Math.floor(this.waveNumber * 0.8),
      speed: 70 + this.waveNumber * 8,
      shootCd: 2500 - Math.min(this.waveNumber * 120, 1600),
      shootTimer: Math.random() * 1500,
      wave: this.waveNumber,
      isBoss: false,
    });
  }

  private fireBullet() {
    const b = this.add.image(
      this.player.x, this.player.y - 36, 'playerBullet'
    ).setDepth(4);
    b.setDisplaySize(20, 40);
    this.playerBullets.push(b);
  }

  private fireEnemyBullet(enemy: Enemy) {
    const dx = this.player.x - enemy.sprite.x;
    const dy = this.player.y - enemy.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = enemy.isBoss ? 280 : 220;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const b = this.add.image(enemy.sprite.x, enemy.sprite.y, 'enemyBullet')
      .setDepth(4);
    b.setDisplaySize(15, 15);
    b.setData('vx', vx);
    b.setData('vy', vy);
    this.enemyBullets.push(b);
  }

  private spawnDrop(x: number, y: number, isBoss = false) {
    // Boss drops always lumina; normal: 80% lumina, 12% crystal, 8% life
    const roll = Math.random();
    const type: 'lumina' | 'crystal' | 'life' = isBoss
      ? 'lumina'
      : roll < 0.80 ? 'lumina' : roll < 0.92 ? 'crystal' : 'life';

    const key = type === 'lumina' ? 'lumina' : 'crystal';
    const tint = type === 'life' ? 0xffaaaa : 0xffffff;
    const sprite = this.add.image(x, y, key);
    const size = type === 'lumina' ? 35 : 25;
    sprite.setDisplaySize(size, size);
    sprite.setDepth(4);
    sprite.setTint(tint);

    this.tweens.add({
      targets: sprite,
      displayWidth: sprite.displayWidth * 1.35,
      displayHeight: sprite.displayHeight * 1.35,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.drops.push({ sprite, vel: 120 + Math.random() * 60, type });
  }

  private explodeAt(x: number, y: number, big = false) {
    const count = big ? 25 : 15;
    const circles: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = big ? Phaser.Math.Between(80, 200) : Phaser.Math.Between(50, 120);
      const r = big ? Phaser.Math.Between(5, 15) : Phaser.Math.Between(3, 10);
      const colors = [0xffd700, 0xff8c00, 0xffffff, 0xb8860b];
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
    this.bg.tilePositionY -= 2.0;

    // Player movement via virtual joystick
    if (this.joystickActive && (this.joystickDX !== 0 || this.joystickDY !== 0)) {
      const speed = 360;
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
      b.y -= 800 * dt;
      if (b.y < -40) {
        b.destroy();
        this.playerBullets.splice(i, 1);
      }
    }

    // Move enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.getData('vx') * dt;
      b.y += b.getData('vy') * dt;
      if (b.y > H + 40 || b.x < -40 || b.x > W + 40) {
        b.destroy();
        this.enemyBullets.splice(i, 1);
        continue;
      }
      if (this.playerInvince <= 0) {
        const dx = b.x - this.player.x;
        const dy = b.y - this.player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 24) {
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
        const targetX = W / 2 + Math.sin(time * 0.0008) * W * 0.35;
        s.x += (targetX - s.x) * 1.5 * dt;
        s.y += (140 - s.y) * 1.0 * dt;
      } else {
        const dx = this.player.x - s.x;
        const dy = this.player.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        s.x += (dx / dist) * e.speed * dt * 0.8;
        s.y += (dy / dist) * e.speed * dt * 0.3;
        s.y += e.speed * 0.4 * dt;
      }

      // Enemy shooting
      e.shootTimer += delta;
      if (e.shootTimer >= e.shootCd) {
        e.shootTimer = 0;
        this.fireEnemyBullet(e);
        if (e.isBoss) {
          for (let a = -45; a <= 45; a += 15) {
            const bx = this.add.image(s.x, s.y, 'enemyBullet');
            bx.setDisplaySize(25, 25);
            bx.setDepth(4);
            bx.setBlendMode(Phaser.BlendModes.SCREEN);
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
        const hitR = e.isBoss ? 80 : 30;
        if (Math.sqrt(dx * dx + dy * dy) < hitR) {
          b.destroy();
          this.playerBullets.splice(j, 1);
          e.hp -= 1;
          this.tweens.add({ targets: s, alpha: 0.3, duration: 80, yoyo: true });

          if (e.hp <= 0) {
            this.explodeAt(s.x, s.y, e.isBoss);
            // Boss drops 15-25 lumina, normal enemies drop 1-5
            const drops = e.isBoss ? Phaser.Math.Between(15, 25) : Phaser.Math.Between(1, 5);
            for (let d = 0; d < drops; d++) {
              this.spawnDrop(
                s.x + Phaser.Math.Between(-60, 60),
                s.y + Phaser.Math.Between(-40, 40),
                e.isBoss
              );
            }
            const pts = e.isBoss ? 10000 + this.waveNumber * 1000 : 200 + this.waveNumber * 20;
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
        if (Math.sqrt(dx * dx + dy * dy) < 32) {
          this.explodeAt(s.x, s.y);
          s.destroy();
          this.enemies.splice(i, 1);
          this.hitPlayer();
          continue;
        }
      }

      if (s.y > H + 100) {
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
      if (Math.sqrt(dx * dx + dy * dy) < 45) {
        if (d.type === 'lumina') {
          this.stardustCollected++;
          this.stardustPending++;
          this.showFloatText(d.sprite.x, d.sprite.y, '+1 ✧', '#ffd700');
        } else if (d.type === 'crystal') {
          // Crystal gives lumina AND bonus score
          this.stardustCollected += 5;
          this.stardustPending += 5;
          this.score += 250;
          this.showFloatText(d.sprite.x, d.sprite.y, '+5 ✧', '#ffffff');
        } else {
          if (this.playerHP < this.maxHP) {
            this.playerHP++;
          }
          this.showFloatText(d.sprite.x, d.sprite.y, '+LIGHT', '#ffaaaa');
        }
        this.emitHUD();
        d.sprite.destroy();
        this.drops.splice(i, 1);
        continue;
      }

      if (d.sprite.y > H + 40) {
        d.sprite.destroy();
        this.drops.splice(i, 1);
      }
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.time += delta;
      const life = 800;
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
        c.setScale(1 + progress * 0.5);
      });
    }

    // Player invincibility flash
    if (this.playerInvince > 0) {
      this.playerInvince -= delta;
      this.player.setAlpha(Math.sin(this.playerInvince * 0.03) > 0 ? 1 : 0.3);
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
      const spd = 260 * dt;
      if (cursors.left.isDown) this.player.x = Math.max(30, this.player.x - spd);
      if (cursors.right.isDown) this.player.x = Math.min(W - 30, this.player.x + spd);
      if (cursors.up.isDown) this.player.y = Math.max(H * 0.3, this.player.y - spd);
      if (cursors.down.isDown) this.player.y = Math.min(H - 30, this.player.y + spd);
    }
  }

  private hitPlayer() {
    this.playerHP--;
    this.playerInvince = 2500;
    this.emitHUD();
    this.cameras.main.flash(150, 255, 200, 200);
    this.cameras.main.shake(200, 0.012);

    if (this.playerHP <= 0) {
      this.explodeAt(this.player.x, this.player.y, true);
      this.player.setVisible(false);
      this.time.delayedCall(800, () => this.endGame());
    }
  }

  private showFloatText(x: number, y: number, msg: string, color: string) {
    const t = this.add.text(x, y, msg, {
      fontFamily: 'serif', fontSize: '18px', color,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: t, y: y - 70, alpha: 0, duration: 1000,
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

    const best = parseInt(localStorage.getItem('aetherwings_best') || '0', 10);
    if (this.score > best) localStorage.setItem('aetherwings_best', String(this.score));

    this.scene.start('GameOverScene', {
      score: this.score,
      wave: this.waveNumber,
      stardust: this.stardustCollected,
      stardustPending: this.stardustPending,
    });
  }

  getStardust() { return this.stardustCollected; }
}
