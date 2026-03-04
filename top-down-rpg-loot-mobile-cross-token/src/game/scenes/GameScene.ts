import Phaser from 'phaser';
import { EventBus, EVENTS, HUDData } from '../EventBus';

type GemType = 'gem' | 'rareGem' | 'epicGem' | 'life';
type GemValue = 1 | 5 | 20;

interface DropItem {
  sprite: Phaser.GameObjects.Image;
  type: GemType;
  value: GemValue | 0;
  velX: number;
  velY: number;
  lifetime: number;
}

interface Enemy {
  sprite: Phaser.GameObjects.Image;
  hp: number;
  maxHp: number;
  speed: number;
  isBoss: boolean;
  hpBar: Phaser.GameObjects.Rectangle;
  hpBarBg: Phaser.GameObjects.Rectangle;
}

export class GameScene extends Phaser.Scene {
  // Player
  private player!: Phaser.GameObjects.Image;
  private playerHP = 5;
  private maxHP = 5;
  private playerInvince = 0;
  private playerBullets: Phaser.GameObjects.Ellipse[] = [];
  private shootTimer = 0;
  private shootRate = 350; // ms

  // Enemies
  private enemies: Enemy[] = [];
  private floorNumber = 1;
  private enemiesKilled = 0;
  private enemiesThisFloor = 0;
  private bossAlive = false;
  private floorClearTimer = 0;
  private floorClearDelay = 2200;
  private floorCleared = false;

  // Drops
  private drops: DropItem[] = [];
  private gemsCollected = 0;
  private gemsPending = 0;

  // Score
  private score = 0;

  // Background
  private bg!: Phaser.GameObjects.TileSprite;
  private roomBorder!: Phaser.GameObjects.Graphics;

  // Input — virtual joystick
  private joystickActive = false;
  private joystickBaseX = 0;
  private joystickBaseY = 0;
  private joystickDX = 0;
  private joystickDY = 0;
  private joystickRadius = 65;
  private joystickHandleRadius = 28;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickBaseRing!: Phaser.GameObjects.Arc;
  private joystickHandle!: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;

  // Game state
  private gameOver = false;
  private explosions: { circles: Phaser.GameObjects.Arc[]; time: number }[] = [];

  // Room bounds (inner playable area)
  private roomLeft = 0;
  private roomRight = 0;
  private roomTop = 0;
  private roomBottom = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Room bounds — 32px inset from edges for wall border
    const wallSize = 32;
    this.roomLeft = wallSize;
    this.roomRight = W - wallSize;
    this.roomTop = wallSize + 60; // extra space for HUD
    this.roomBottom = H - wallSize;

    // Reset state
    this.gameOver = false;
    this.score = 0;
    this.floorNumber = 1;
    this.enemiesKilled = 0;
    this.enemiesThisFloor = 0;
    this.bossAlive = false;
    this.floorClearTimer = 0;
    this.floorCleared = false;
    this.playerHP = 5;
    this.maxHP = 5;
    this.playerInvince = 0;
    this.gemsCollected = 0;
    this.gemsPending = 0;
    this.shootTimer = 0;
    this.joystickActive = false;
    this.joystickPointerId = null;
    this.joystickDX = 0;
    this.joystickDY = 0;
    this.enemies = [];
    this.drops = [];
    this.playerBullets = [];
    this.explosions = [];

    this.input.removeAllListeners();

    EventBus.emit(EVENTS.SCENE_CHANGE, { scene: 'GameScene' });
    this.emitHUD();

    // Dungeon floor background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.bg.setDisplaySize(W, H);
    this.bg.setAlpha(0.55);
    this.bg.setDepth(0);

    // Room border walls (dark overlay on edges)
    this.roomBorder = this.add.graphics();
    this.roomBorder.setDepth(1);
    this.drawRoomBorder(W, H);

    // Player — starts center of room
    const cx = (this.roomLeft + this.roomRight) / 2;
    const cy = (this.roomTop + this.roomBottom) / 2;
    this.player = this.add.image(cx, cy, 'player');
    this.player.setDisplaySize(56, 56);
    this.player.setDepth(5);

    // Virtual Joystick
    this.joystickBase = this.add.circle(0, 0, this.joystickRadius, 0x000000, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing = this.add.circle(0, 0, this.joystickRadius, 0xffffff, 0)
      .setDepth(20).setVisible(false);
    this.joystickBaseRing.setStrokeStyle(2, 0xaa55ff, 0.4);
    this.joystickHandle = this.add.circle(0, 0, this.joystickHandleRadius, 0xaa55ff, 0.3)
      .setDepth(21).setVisible(false);
    this.joystickHandle.setStrokeStyle(2, 0xdd99ff, 0.85);

    // Touch input
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

    // Keyboard arrow keys
    this.input.keyboard?.createCursorKeys();

    // Spawn first floor
    this.spawnFloor();
    this.cameras.main.flash(400, 0, 0, 30);
  }

  private drawRoomBorder(W: number, H: number) {
    const g = this.roomBorder;
    g.clear();
    // Dark semi-transparent wall overlay on all 4 sides
    g.fillStyle(0x000000, 0.75);
    g.fillRect(0, 0, W, this.roomTop);           // top wall
    g.fillRect(0, this.roomBottom, W, H - this.roomBottom); // bottom wall
    g.fillRect(0, 0, this.roomLeft, H);           // left wall
    g.fillRect(this.roomRight, 0, W - this.roomRight, H); // right wall
    // Purple border glow line
    g.lineStyle(3, 0x9955ff, 0.7);
    g.strokeRect(this.roomLeft, this.roomTop, this.roomRight - this.roomLeft, this.roomBottom - this.roomTop);
  }

  private emitHUD() {
    const data: HUDData = {
      score: this.score,
      floor: this.floorNumber,
      gems: this.gemsCollected,
      hp: this.playerHP,
      maxHp: this.maxHP,
    };
    EventBus.emit(EVENTS.HUD_UPDATE, data);
  }

  private spawnFloor() {
    const isBossFloor = this.floorNumber % 5 === 0;
    this.floorCleared = false;
    this.floorClearTimer = 0;

    if (isBossFloor) {
      this.bossAlive = true;
      this.enemiesThisFloor = 1;
      this.spawnBoss();
      this.showFloorBanner(`⚠ BOSS FLOOR ${this.floorNumber} ⚠`, '#ff3300');
    } else {
      const count = 3 + Math.floor(this.floorNumber * 1.4);
      this.enemiesThisFloor = count;
      for (let i = 0; i < count; i++) {
        this.time.delayedCall(i * 400 + 300, () => this.spawnEnemy());
      }
      this.showFloorBanner(`FLOOR ${this.floorNumber}`, '#aa44ff');
    }
  }

  private showFloorBanner(text: string, color: string) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const banner = this.add.text(W / 2, H / 2, text, {
      fontFamily: 'monospace',
      fontSize: '30px',
      color,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(25).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      y: H / 2 - 25,
      duration: 400,
      yoyo: true,
      hold: 900,
      onComplete: () => banner.destroy(),
    });
  }

  private spawnEnemy() {
    if (this.gameOver) return;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    // Spawn at random edge of the room
    const side = Phaser.Math.Between(0, 3);
    let x: number, y: number;
    if (side === 0) { x = Phaser.Math.Between(this.roomLeft + 20, this.roomRight - 20); y = this.roomTop + 20; }
    else if (side === 1) { x = Phaser.Math.Between(this.roomLeft + 20, this.roomRight - 20); y = this.roomBottom - 20; }
    else if (side === 2) { x = this.roomLeft + 20; y = Phaser.Math.Between(this.roomTop + 20, this.roomBottom - 20); }
    else { x = this.roomRight - 20; y = Phaser.Math.Between(this.roomTop + 20, this.roomBottom - 20); }

    const size = 40 + Math.random() * 16;
    const enemy = this.add.image(x, y, 'enemy');
    enemy.setDisplaySize(size, size);
    enemy.setDepth(4);
    enemy.setAlpha(0);

    const hp = 2 + Math.floor(this.floorNumber * 0.8);

    // HP bar background
    const hpBarBg = this.add.rectangle(x, y - size / 2 - 8, size, 6, 0x330000).setDepth(6);
    // HP bar fill
    const hpBar = this.add.rectangle(x, y - size / 2 - 8, size, 6, 0x22cc44).setDepth(7);

    this.tweens.add({ targets: enemy, alpha: 1, duration: 300 });

    this.enemies.push({
      sprite: enemy,
      hp,
      maxHp: hp,
      speed: 70 + this.floorNumber * 8,
      isBoss: false,
      hpBar,
      hpBarBg,
    });
  }

  private spawnBoss() {
    const W = this.cameras.main.width;
    const cx = (this.roomLeft + this.roomRight) / 2;
    const boss = this.add.image(cx, this.roomTop + 20, 'boss');
    boss.setDisplaySize(120, 120);
    boss.setDepth(4);
    boss.setAlpha(0);

    const hp = 50 + this.floorNumber * 12;
    const hpBarBg = this.add.rectangle(cx, this.roomTop + 8, 140, 10, 0x330000).setDepth(6);
    const hpBar = this.add.rectangle(cx, this.roomTop + 8, 140, 10, 0xff4400).setDepth(7);

    this.tweens.add({ targets: boss, alpha: 1, y: this.roomTop + 90, duration: 1000, ease: 'Cubic.easeOut' });
    this.cameras.main.shake(300, 0.015);

    this.enemies.push({
      sprite: boss,
      hp,
      maxHp: hp,
      speed: 55,
      isBoss: true,
      hpBar,
      hpBarBg,
    });
  }

  private fireBullet(targetX: number, targetY: number) {
    const dx = targetX - this.player.x;
    const dy = targetY - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 480;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const b = this.add.ellipse(this.player.x, this.player.y, 10, 10, 0x9933ff).setDepth(5);
    b.setData('vx', vx);
    b.setData('vy', vy);
    this.playerBullets.push(b);
  }

  private spawnDrop(x: number, y: number, isBoss = false) {
    const roll = Math.random();
    let type: GemType;
    let value: GemValue | 0;

    if (isBoss) {
      // Boss always drops epic gems
      type = 'epicGem';
      value = 20;
    } else if (roll < 0.65) {
      type = 'gem';
      value = 1;
    } else if (roll < 0.90) {
      type = 'rareGem';
      value = 5;
    } else if (roll < 0.97) {
      type = 'epicGem';
      value = 20;
    } else {
      type = 'life';
      value = 0;
    }

    const key = type === 'life' ? 'gem' : type;
    const sprite = this.add.image(x, y, key);
    const size = type === 'epicGem' ? 36 : type === 'rareGem' ? 28 : 22;
    sprite.setDisplaySize(size, size);
    sprite.setDepth(4);

    if (type === 'life') sprite.setTint(0xff4444);
    else if (type === 'rareGem') sprite.setTint(0xcc44ff);
    else if (type === 'epicGem') sprite.setTint(0xffcc00);

    this.tweens.add({
      targets: sprite,
      displayWidth: sprite.displayWidth * 1.4,
      displayHeight: sprite.displayHeight * 1.4,
      duration: 180,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    // Random scatter direction
    const angle = Math.random() * Math.PI * 2;
    const dropSpeed = 60 + Math.random() * 80;

    this.drops.push({
      sprite,
      type,
      value,
      velX: Math.cos(angle) * dropSpeed,
      velY: Math.sin(angle) * dropSpeed,
      lifetime: 0,
    });
  }

  private explodeAt(x: number, y: number, big = false) {
    const count = big ? 22 : 12;
    const circles: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = big ? Phaser.Math.Between(70, 180) : Phaser.Math.Between(40, 110);
      const r = big ? Phaser.Math.Between(5, 14) : Phaser.Math.Between(2, 8);
      const colors = [0xaa33ff, 0xdd77ff, 0xffcc44, 0xff6600];
      const c = this.add.circle(x, y, r, Phaser.Math.RND.pick(colors)).setDepth(9);
      c.setData('vx', Math.cos(angle) * speed);
      c.setData('vy', Math.sin(angle) * speed);
      circles.push(c);
    }
    this.explosions.push({ circles, time: 0 });
    if (big) this.cameras.main.shake(220, 0.014);
  }

  private findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;
    for (const e of this.enemies) {
      const dx = e.sprite.x - this.player.x;
      const dy = e.sprite.y - this.player.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Slow background pan
    this.bg.tilePositionX += 0.2;

    // Player movement via virtual joystick
    const speed = 280;
    if (this.joystickActive && (this.joystickDX !== 0 || this.joystickDY !== 0)) {
      this.player.x = Phaser.Math.Clamp(
        this.player.x + this.joystickDX * speed * dt,
        this.roomLeft + 28, this.roomRight - 28
      );
      this.player.y = Phaser.Math.Clamp(
        this.player.y + this.joystickDY * speed * dt,
        this.roomTop + 28, this.roomBottom - 28
      );
    }

    // Keyboard movement
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors) {
      const spd = speed * dt;
      if (cursors.left?.isDown) this.player.x = Math.max(this.roomLeft + 28, this.player.x - spd);
      if (cursors.right?.isDown) this.player.x = Math.min(this.roomRight - 28, this.player.x + spd);
      if (cursors.up?.isDown) this.player.y = Math.max(this.roomTop + 28, this.player.y - spd);
      if (cursors.down?.isDown) this.player.y = Math.min(this.roomBottom - 28, this.player.y + spd);
    }

    // Auto-attack nearest enemy
    this.shootTimer += delta;
    if (this.shootTimer >= this.shootRate && this.enemies.length > 0) {
      this.shootTimer = 0;
      const target = this.findNearestEnemy();
      if (target) {
        this.fireBullet(target.sprite.x, target.sprite.y);
        // Rotate player to face enemy
        const dx = target.sprite.x - this.player.x;
        const dy = target.sprite.y - this.player.y;
        this.player.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
      }
    }

    // Move player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.x += b.getData('vx') * dt;
      b.y += b.getData('vy') * dt;

      // Out of room bounds — destroy
      if (b.x < this.roomLeft || b.x > this.roomRight || b.y < this.roomTop || b.y > this.roomBottom) {
        b.destroy();
        this.playerBullets.splice(i, 1);
        continue;
      }

      // Bullet-enemy collision
      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        const dx = b.x - e.sprite.x;
        const dy = b.y - e.sprite.y;
        const hitR = e.isBoss ? 56 : 24;
        if (Math.sqrt(dx * dx + dy * dy) < hitR) {
          b.destroy();
          this.playerBullets.splice(i, 1);
          e.hp--;
          hit = true;

          // HP bar update
          const pct = Math.max(0, e.hp / e.maxHp);
          const barW = e.isBoss ? 140 : e.sprite.displayWidth;
          e.hpBar.displayWidth = barW * pct;

          this.tweens.add({
            targets: e.sprite,
            alpha: 0.2,
            duration: 50,
            yoyo: true,
          });

          if (e.hp <= 0) {
            this.explodeAt(e.sprite.x, e.sprite.y, e.isBoss);
            const dropCount = e.isBoss ? Phaser.Math.Between(12, 18) : Phaser.Math.Between(1, 3);
            for (let d = 0; d < dropCount; d++) {
              this.spawnDrop(
                e.sprite.x + Phaser.Math.Between(-35, 35),
                e.sprite.y + Phaser.Math.Between(-25, 25),
                e.isBoss
              );
            }
            const pts = e.isBoss ? 5000 + this.floorNumber * 500 : 80 + this.floorNumber * 15;
            this.score += pts;
            if (e.isBoss) this.bossAlive = false;
            e.hpBar.destroy();
            e.hpBarBg.destroy();
            e.sprite.destroy();
            this.enemies.splice(j, 1);
            this.enemiesKilled++;
            this.emitHUD();
          }
          break;
        }
      }
      if (hit) continue;
    }

    // Enemy AI — chase player
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const s = e.sprite;
      const dx = this.player.x - s.x;
      const dy = this.player.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      if (e.isBoss) {
        // Boss: circular orbit + direct approach
        const orbitX = s.x + Math.sin(_time * 0.0012) * 60;
        s.x += (orbitX - s.x) * 0.8 * dt;
        s.y += (dy / dist) * e.speed * 0.6 * dt;
      } else {
        s.x += (dx / dist) * e.speed * dt;
        s.y += (dy / dist) * e.speed * dt;
      }

      // Clamp enemies inside room
      s.x = Phaser.Math.Clamp(s.x, this.roomLeft + 20, this.roomRight - 20);
      s.y = Phaser.Math.Clamp(s.y, this.roomTop + 20, this.roomBottom - 20);

      // Update HP bar position
      const halfH = s.displayHeight / 2;
      const barW = e.isBoss ? 140 : s.displayWidth;
      e.hpBarBg.setPosition(s.x, s.y - halfH - 8);
      e.hpBarBg.displayWidth = barW;
      e.hpBar.setPosition(s.x - (barW - e.hpBar.displayWidth) / 2, s.y - halfH - 8);

      // Enemy-player collision (melee damage)
      if (this.playerInvince <= 0) {
        const dx2 = s.x - this.player.x;
        const dy2 = s.y - this.player.y;
        const contactR = e.isBoss ? 54 : 30;
        if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < contactR) {
          this.hitPlayer();
          if (!e.isBoss) {
            // Normal enemy gets knocked back on hit
            const kbAngle = Math.atan2(s.y - this.player.y, s.x - this.player.x);
            s.x += Math.cos(kbAngle) * 40;
            s.y += Math.sin(kbAngle) * 40;
          }
        }
      }
    }

    // Move drops (scatter then stop, attract to player when close)
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.lifetime += delta;

      // Initial scatter (first 400ms), then slow down
      const friction = d.lifetime < 400 ? 0.85 : 0.92;
      d.velX *= friction;
      d.velY *= friction;

      // Attraction to player when within 80px
      const dx = this.player.x - d.sprite.x;
      const dy = this.player.y - d.sprite.y;
      const distToPlayer = Math.sqrt(dx * dx + dy * dy);
      if (distToPlayer < 80) {
        const attractSpeed = 200 * dt;
        d.velX += (dx / distToPlayer) * attractSpeed;
        d.velY += (dy / distToPlayer) * attractSpeed;
      }

      d.sprite.x += d.velX * dt;
      d.sprite.y += d.velY * dt;

      // Collect
      if (distToPlayer < 28) {
        if (d.type === 'gem') {
          this.gemsCollected += 1;
          this.gemsPending += 1;
          this.score += 10;
          this.showFloatText(d.sprite.x, d.sprite.y, '+1 ◆', '#44ff88');
        } else if (d.type === 'rareGem') {
          this.gemsCollected += 5;
          this.gemsPending += 5;
          this.score += 50;
          this.showFloatText(d.sprite.x, d.sprite.y, '+5 ◆', '#cc44ff');
        } else if (d.type === 'epicGem') {
          this.gemsCollected += 20;
          this.gemsPending += 20;
          this.score += 200;
          this.showFloatText(d.sprite.x, d.sprite.y, '+20 ◆', '#ffcc00');
        } else {
          // Life restore
          if (this.playerHP < this.maxHP) {
            this.playerHP++;
            this.showFloatText(d.sprite.x, d.sprite.y, '+LIFE', '#ff5555');
          }
        }
        this.emitHUD();
        d.sprite.destroy();
        this.drops.splice(i, 1);
        continue;
      }

      // Destroy stray drops that drift outside room
      if (d.sprite.x < this.roomLeft - 10 || d.sprite.x > this.roomRight + 10 ||
          d.sprite.y < this.roomTop - 10 || d.sprite.y > this.roomBottom + 10) {
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
      this.player.setAlpha(Math.sin(this.playerInvince * 0.025) > 0 ? 1 : 0.3);
      if (this.playerInvince <= 0) this.player.setAlpha(1);
    }

    // Floor clear check
    if (!this.bossAlive && this.enemies.length === 0 && !this.floorCleared) {
      this.floorCleared = true;
      this.floorClearTimer = 0;
      this.showFloorBanner('FLOOR CLEARED!', '#44ff88');
    }
    if (this.floorCleared) {
      this.floorClearTimer += delta;
      if (this.floorClearTimer >= this.floorClearDelay) {
        this.floorNumber++;
        this.emitHUD();
        this.spawnFloor();
      }
    }
  }

  private hitPlayer() {
    this.playerHP--;
    this.playerInvince = 1800;
    this.emitHUD();
    this.cameras.main.flash(100, 120, 0, 0);
    this.cameras.main.shake(130, 0.009);

    if (this.playerHP <= 0) {
      this.explodeAt(this.player.x, this.player.y, true);
      this.player.setVisible(false);
      this.time.delayedCall(700, () => this.endGame());
    }
  }

  private showFloatText(x: number, y: number, msg: string, color: string) {
    const t = this.add.text(x, y, msg, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  private endGame() {
    this.gameOver = true;

    this.enemies.forEach(e => {
      e.sprite.destroy();
      e.hpBar.destroy();
      e.hpBarBg.destroy();
    });
    this.enemies = [];
    this.drops.forEach(d => d.sprite.destroy());
    this.drops = [];
    this.playerBullets.forEach(b => b.destroy());
    this.playerBullets = [];

    const best = parseInt(localStorage.getItem('crystaldungeon_best') || '0', 10);
    if (this.score > best) localStorage.setItem('crystaldungeon_best', String(this.score));

    this.scene.start('GameOverScene', {
      score: this.score,
      floor: this.floorNumber,
      gems: this.gemsCollected,
      gemsPending: this.gemsPending,
    });
  }

  getGems() { return this.gemsCollected; }
}
