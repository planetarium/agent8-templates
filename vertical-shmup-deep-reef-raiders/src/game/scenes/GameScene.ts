import Phaser from 'phaser';
import { EventBus, EVENTS, HUDData } from '../EventBus';

interface DropItem {
  sprite: Phaser.GameObjects.Image;
  vel: number;
  type: 'pearl' | 'crystal' | 'life';
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
  wobble: number;
  wobbleAmp: number;
}

export class GameScene extends Phaser.Scene {
  // Player
  private player!: Phaser.GameObjects.Image;
  private playerHP = 3;
  private maxHP = 3;
  private playerInvince = 0;
  private playerBullets: Phaser.GameObjects.Image[] = [];
  private shootRate = 220; // ms

  // Enemies
  private enemies: Enemy[] = [];
  private enemyBullets: Phaser.GameObjects.Image[] = [];
  private waveNumber = 1;
  private waveTimer = 0;
  private waveInterval = 8000;
  private bossAlive = false;

  // Drops
  private drops: DropItem[] = [];
  private pearlsCollected = 0;
  private pearlsPending = 0;

  // Score
  private score = 0;

  // Background
  private bg!: Phaser.GameObjects.TileSprite;
  private bgLayer2!: Phaser.GameObjects.TileSprite;

  // Input
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
  private bubbles: { sprite: Phaser.GameObjects.Arc; vy: number; vx: number }[] = [];
  private bubbleTimer = 0;

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
    this.bossAlive = false;
    this.playerHP = 3;
    this.maxHP = 3;
    this.playerInvince = 0;
    this.pearlsCollected = 0;
    this.pearlsPending = 0;
    this.timeSinceShot = 9999;
    this.joystickActive = false;
    this.joystickPointerId = null;
    this.joystickDX = 0;
    this.joystickDY = 0;
    this.enemies = [];
    this.drops = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.explosions = [];
    this.bubbles = [];
    this.bubbleTimer = 0;

    this.input.removeAllListeners();

    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'GameScene' });
    this.emitHUD();

    // Dark ocean background layer
    this.add.rectangle(W / 2, H / 2, W, H, 0x02060f).setDepth(0);

    // Scrolling BG
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);
    this.bg.setDepth(1);
    this.bg.setAlpha(0.85);

    // Second parallax layer (slightly offset speed)
    this.bgLayer2 = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bgLayer2.setDisplaySize(W, H);
    this.bgLayer2.setDepth(0);
    this.bgLayer2.setAlpha(0.3);
    this.bgLayer2.setTint(0x0033aa);
    this.bgLayer2.setTilePosition(W / 2, 0);

    // Player submarine
    this.player = this.add.image(W / 2, H * 0.82, 'player');
    this.player.setDisplaySize(64, 64);
    this.player.setDepth(5);

    // Virtual Joystick visuals
    this.joystickBase = this.add.circle(0, 0, this.joystickRadius, 0x000000, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing = this.add.circle(0, 0, this.joystickRadius, 0x00ffee, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing.setStrokeStyle(2, 0x00ffee, 0.4);
    this.joystickHandle = this.add.circle(0, 0, this.joystickHandleRadius, 0x00ccdd, 0.3)
      .setDepth(21).setVisible(false);
    this.joystickHandle.setStrokeStyle(2, 0x00ffee, 0.85);

    // Touch / mouse input
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

    // Initial wave
    this.spawnWave();
    this.cameras.main.flash(500, 0, 20, 60);
  }

  private emitHUD() {
    const data: HUDData = {
      score: this.score,
      wave: this.waveNumber,
      stardust: this.pearlsCollected,
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
        hp: 45 + this.waveNumber * 8,
        maxHp: 45 + this.waveNumber * 8,
        speed: 55,
        shootCd: 750,
        shootTimer: 0,
        wave: this.waveNumber,
        isBoss: true,
        wobble: 0,
        wobbleAmp: 1,
      });
      this.tweens.add({ targets: boss, y: 130, duration: 1400, ease: 'Back.easeOut' });
      this.showWaveBanner(`⚠ KRAKEN WAVE ${this.waveNumber} ⚠`, '#cc44ff');
    } else {
      const count = 3 + Math.floor(this.waveNumber * 1.5);
      for (let i = 0; i < count; i++) {
        this.time.delayedCall(i * 380, () => this.spawnEnemy());
      }
      this.showWaveBanner(`DEPTH ${this.waveNumber}`, '#00ffee');
    }
  }

  private showWaveBanner(text: string, color: string) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const banner = this.add.text(W / 2, H / 2, text, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color,
      stroke: '#000022',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      y: H / 2 - 20,
      duration: 400,
      yoyo: true,
      hold: 900,
      onComplete: () => banner.destroy(),
    });
  }

  private spawnEnemy() {
    const W = this.cameras.main.width;
    const x = Phaser.Math.Between(30, W - 30);
    const enemy = this.add.image(x, -35, 'enemy');
    const size = 46 + Math.random() * 22;
    enemy.setDisplaySize(size, size);
    enemy.setDepth(3);

    this.enemies.push({
      sprite: enemy,
      hp: 2 + Math.floor(this.waveNumber * 0.7),
      maxHp: 2 + Math.floor(this.waveNumber * 0.7),
      speed: 58 + this.waveNumber * 10,
      shootCd: 2600 - Math.min(this.waveNumber * 130, 1600),
      shootTimer: Math.random() * 1800,
      wave: this.waveNumber,
      isBoss: false,
      wobble: Math.random() * Math.PI * 2,
      wobbleAmp: 0.5 + Math.random() * 1.2,
    });
  }

  private fireBullet() {
    const b = this.add.image(this.player.x, this.player.y - 38, 'playerBullet');
    b.setDisplaySize(10, 28);
    b.setDepth(4);
    b.setBlendMode(Phaser.BlendModes.ADD);
    this.playerBullets.push(b);
  }

  private fireEnemyBullet(enemy: Enemy) {
    const dx = this.player.x - enemy.sprite.x;
    const dy = this.player.y - enemy.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = enemy.isBoss ? 240 : 195;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const b = this.add.image(enemy.sprite.x, enemy.sprite.y, 'enemyBullet');
    b.setDisplaySize(enemy.isBoss ? 24 : 16, enemy.isBoss ? 24 : 16);
    b.setDepth(4);
    b.setData('vx', vx);
    b.setData('vy', vy);
    this.enemyBullets.push(b);
  }

  private spawnDrop(x: number, y: number, isBoss = false) {
    const roll = Math.random();
    const type: 'pearl' | 'crystal' | 'life' = isBoss
      ? 'pearl'
      : roll < 0.78 ? 'pearl' : roll < 0.92 ? 'crystal' : 'life';

    const key = type === 'pearl' || type === 'crystal' ? 'pearl' : 'pearl';
    const tint = type === 'life' ? 0xff8877 : 0xffffff;
    const sprite = this.add.image(x, y, key);
    const size = type === 'pearl' ? 28 : 22;
    sprite.setDisplaySize(size, size);
    sprite.setDepth(4);
    sprite.setTint(tint);

    this.tweens.add({
      targets: sprite,
      displayWidth: sprite.displayWidth * 1.4,
      displayHeight: sprite.displayHeight * 1.4,
      duration: 220,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    this.drops.push({ sprite, vel: 90 + Math.random() * 55, type });
  }

  private spawnBubble(x: number, y: number) {
    const r = Phaser.Math.Between(2, 7);
    const colors = [0x00ddff, 0x88ffee, 0xaaddff, 0x44aacc];
    const c = this.add.circle(x, y, r, Phaser.Math.RND.pick(colors), 0.7).setDepth(8);
    c.setStrokeStyle(1, 0xffffff, 0.4);
    this.bubbles.push({
      sprite: c,
      vy: -(Phaser.Math.Between(50, 130)),
      vx: Phaser.Math.FloatBetween(-30, 30),
    });
  }

  private explodeAt(x: number, y: number, big = false) {
    const count = big ? 22 : 14;
    const circles: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = big ? Phaser.Math.Between(65, 170) : Phaser.Math.Between(40, 110);
      const r = big ? Phaser.Math.Between(4, 13) : Phaser.Math.Between(2, 8);
      // Ocean explosion colors: teal, cyan, purple, white
      const colors = [0x00ffdd, 0x00aaff, 0xaa44ff, 0xffffff, 0x00ddcc];
      const c = this.add.circle(x, y, r, Phaser.Math.RND.pick(colors)).setDepth(8);
      c.setData('vx', Math.cos(angle) * speed);
      c.setData('vy', Math.sin(angle) * speed);
      circles.push(c);
    }
    this.explosions.push({ x, y, time: 0, circles });

    // Spawn bubbles on explosion
    for (let b = 0; b < (big ? 12 : 6); b++) {
      this.spawnBubble(
        x + Phaser.Math.Between(-30, 30),
        y + Phaser.Math.Between(-20, 20)
      );
    }

    if (big) this.cameras.main.shake(220, 0.013);
  }

  update(time: number, delta: number) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Scroll backgrounds (parallax)
    this.bg.tilePositionY -= 1.2;
    this.bgLayer2.tilePositionY -= 0.5;

    // Ambient bubbles
    this.bubbleTimer += delta;
    if (this.bubbleTimer > 400) {
      this.bubbleTimer = 0;
      this.spawnBubble(
        Phaser.Math.Between(10, W - 10),
        H + 10
      );
    }

    // Update bubbles
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bub = this.bubbles[i];
      bub.sprite.y += bub.vy * dt;
      bub.sprite.x += bub.vx * dt;
      bub.sprite.setAlpha(bub.sprite.alpha - dt * 0.5);
      if (bub.sprite.alpha <= 0 || bub.sprite.y < -20) {
        bub.sprite.destroy();
        this.bubbles.splice(i, 1);
      }
    }

    // Player movement via virtual joystick
    if (this.joystickActive && (this.joystickDX !== 0 || this.joystickDY !== 0)) {
      const speed = 310;
      this.player.x = Phaser.Math.Clamp(
        this.player.x + this.joystickDX * speed * dt, 30, W - 30
      );
      this.player.y = Phaser.Math.Clamp(
        this.player.y + this.joystickDY * speed * dt, H * 0.2, H - 30
      );
    }

    // Auto-shoot torpedoes
    this.timeSinceShot += delta;
    if (this.timeSinceShot >= this.shootRate) {
      this.timeSinceShot = 0;
      this.fireBullet();
    }

    // Move player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.y -= 680 * dt;
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

      e.wobble += delta * 0.002;

      if (e.isBoss) {
        // Boss oscillates side to side
        const targetX = W / 2 + Math.sin(time * 0.0008) * W * 0.32;
        s.x += (targetX - s.x) * 1.8 * dt;
        s.y += (140 - s.y) * 1.4 * dt;
        // Boss slowly rotates
        s.rotation += 0.3 * dt;
      } else {
        // Enemies move toward player with side wobble
        const dx = this.player.x - s.x;
        const dy = this.player.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        s.x += (dx / dist) * e.speed * dt + Math.sin(e.wobble * 3) * e.wobbleAmp;
        s.y += (dy / dist) * e.speed * dt * 0.38;
        s.y += e.speed * 0.28 * dt;
        s.rotation = Math.sin(e.wobble) * 0.2;
      }

      // Enemy shooting
      e.shootTimer += delta;
      if (e.shootTimer >= e.shootCd) {
        e.shootTimer = 0;
        this.fireEnemyBullet(e);
        if (e.isBoss) {
          // Boss spread shot — ink burst
          for (let a = -40; a <= 40; a += 13) {
            const bx = this.add.image(s.x, s.y, 'enemyBullet');
            bx.setDisplaySize(22, 22);
            bx.setDepth(4);
            const angle = Math.atan2(this.player.y - s.y, this.player.x - s.x) + Phaser.Math.DegToRad(a);
            bx.setData('vx', Math.cos(angle) * 215);
            bx.setData('vy', Math.sin(angle) * 215);
            this.enemyBullets.push(bx);
          }
        }
      }

      // Player bullet collision
      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const b = this.playerBullets[j];
        const dx = b.x - s.x;
        const dy = b.y - s.y;
        const hitR = e.isBoss ? 52 : 24;
        if (Math.sqrt(dx * dx + dy * dy) < hitR) {
          b.destroy();
          this.playerBullets.splice(j, 1);
          e.hp -= 1;
          this.tweens.add({ targets: s, alpha: 0.25, duration: 60, yoyo: true });

          if (e.hp <= 0) {
            this.explodeAt(s.x, s.y, e.isBoss);
            const drops = e.isBoss ? Phaser.Math.Between(16, 22) : Phaser.Math.Between(1, 4);
            for (let d = 0; d < drops; d++) {
              this.spawnDrop(
                s.x + Phaser.Math.Between(-45, 45),
                s.y + Phaser.Math.Between(-25, 25),
                e.isBoss
              );
            }
            const pts = e.isBoss ? 5500 + this.waveNumber * 600 : 110 + this.waveNumber * 12;
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
      d.sprite.rotation += dt * 1.5;

      const dx = d.sprite.x - this.player.x;
      const dy = d.sprite.y - this.player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 36) {
        if (d.type === 'pearl') {
          this.pearlsCollected++;
          this.pearlsPending++;
          this.showFloatText(d.sprite.x, d.sprite.y, '+1 ◉', '#00ffee');
        } else if (d.type === 'crystal') {
          this.pearlsCollected += 3;
          this.pearlsPending += 3;
          this.score += 160;
          this.showFloatText(d.sprite.x, d.sprite.y, '+3 ◉', '#88eeff');
        } else {
          if (this.playerHP < this.maxHP) this.playerHP++;
          this.showFloatText(d.sprite.x, d.sprite.y, '+HULL', '#ff9988');
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
      const life = 650;
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

    // Next wave
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
    this.cameras.main.flash(110, 60, 0, 80);
    this.cameras.main.shake(140, 0.011);

    if (this.playerHP <= 0) {
      this.explodeAt(this.player.x, this.player.y, true);
      this.player.setVisible(false);
      this.time.delayedCall(700, () => this.endGame());
    }
  }

  private showFloatText(x: number, y: number, msg: string, color: string) {
    const t = this.add.text(x, y, msg, {
      fontFamily: 'monospace', fontSize: '15px', color,
      stroke: '#000011', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: t, y: y - 55, alpha: 0, duration: 950,
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
    this.bubbles.forEach(b => b.sprite.destroy());
    this.bubbles = [];

    const best = parseInt(localStorage.getItem('deepreef_best') || '0', 10);
    if (this.score > best) localStorage.setItem('deepreef_best', String(this.score));

    this.scene.start('GameOverScene', {
      score: this.score,
      wave: this.waveNumber,
      stardust: this.pearlsCollected,
      stardustPending: this.pearlsPending,
    });
  }

  getStardust() { return this.pearlsCollected; }
}
