import Phaser from 'phaser';
import Assets from '../../assets.json';
import { gameEvents } from '../../App';
import { GAME_CONFIG } from '../../config/gameConfig';
import { getImageUrl } from '../../utils/getAssetUrl';
import { ABILITIES } from '../../config/abilities';
import { ENEMY_TYPES } from '../../config/enemyTypes';
import { WaveSystem } from '../systems/WaveSystem';
import { createPlayer, registerPlayerAnimations } from '../entities/Player';
import { createEnemy, updateEnemyBehavior } from '../entities/Enemy';
import { createProjectile } from '../entities/Projectile';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private gems!: Phaser.Physics.Arcade.Group;

  private maxHealth: number = GAME_CONFIG.player.maxHealth;
  private playerHealth: number = GAME_CONFIG.player.maxHealth;
  private isGameOver = false;
  private isPaused = false;

  private playerXp = 0;
  private playerLevel = 1;
  private nextLevelXp: number = GAME_CONFIG.xp.initialNextLevelXp;

  private playerSpeed: number = GAME_CONFIG.player.speed;
  private fireRate: number = GAME_CONFIG.player.fireRate;
  private projectileDamage: number = GAME_CONFIG.player.projectileDamage;
  private projectileSpeed: number = GAME_CONFIG.player.projectileSpeed;
  private multishotCount = 1;
  private pierceEnabled = false;
  private aoeRadius = 0;
  private aoeDamage = 0;
  private orbitCount = 0;
  private orbitDamage = 0;
  private orbitOrbs: Phaser.Physics.Arcade.Sprite[] = [];
  private orbitAngle = 0;

  private lastFired = 0;
  private spawnTimer = 0;

  private waveSystem = new WaveSystem();

  private joystickX = 0;
  private joystickY = 0;
  private isJoystickActive = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    const assets = Assets as { images: Record<string, { url?: string }> };
    const bgUrl = getImageUrl(assets, 'background');
    if (bgUrl) this.load.image('bg', bgUrl);
    const currencyUrl = getImageUrl(assets, GAME_CONFIG.currency.spriteKey);
    if (currencyUrl) this.load.image(GAME_CONFIG.currency.spriteKey, currencyUrl);
    const xpUrl = getImageUrl(assets, GAME_CONFIG.xp.spriteKey);
    if (xpUrl) this.load.image(GAME_CONFIG.xp.spriteKey, xpUrl);
    const projectileUrl = getImageUrl(assets, GAME_CONFIG.projectile.spriteKey);
    if (projectileUrl) this.load.image(GAME_CONFIG.projectile.spriteKey, projectileUrl);

    const spriteKeys = new Set(ENEMY_TYPES.map((e) => e.spriteKey));
    spriteKeys.add(GAME_CONFIG.player.spriteKey);

    for (const key of spriteKeys) {
      const sheet = Assets.spritesheets[key as keyof typeof Assets.spritesheets];
      if (sheet) {
        this.load.spritesheet(key, sheet.url, {
          frameWidth: sheet.frameWidth,
          frameHeight: sheet.frameHeight,
        });
      }
    }
  }

  create() {
    const width = this.sys.game.canvas.width;
    const height = this.sys.game.canvas.height;

    const bg = this.add.tileSprite(width / 2, height / 2, width * 2, height * 2, 'bg');
    bg.setDisplaySize(width * 2, height * 2);
    bg.setScrollFactor(0);

    this.playerHealth = this.maxHealth;
    this.isGameOver = false;
    this.isPaused = false;
    this.playerXp = 0;
    this.playerLevel = 1;
    this.nextLevelXp = GAME_CONFIG.xp.initialNextLevelXp;
    this.playerSpeed = GAME_CONFIG.player.speed;
    this.fireRate = GAME_CONFIG.player.fireRate;
    this.projectileDamage = GAME_CONFIG.player.projectileDamage;
    this.projectileSpeed = GAME_CONFIG.player.projectileSpeed;
    this.multishotCount = 1;
    this.pierceEnabled = false;
    this.aoeRadius = 0;
    this.aoeDamage = 0;

    gameEvents.dispatchEvent(
      new CustomEvent('updateHealth', { detail: { health: this.playerHealth, max: this.maxHealth } })
    );
    gameEvents.dispatchEvent(
      new CustomEvent('updateXp', {
        detail: { xp: this.playerXp, max: this.nextLevelXp, level: this.playerLevel },
      })
    );

    registerPlayerAnimations(this, GAME_CONFIG.player.spriteKey, Assets);
    for (const et of ENEMY_TYPES) {
      if (!this.anims.exists(et.animKey)) {
        const sheet = Assets.spritesheets[et.spriteKey as keyof typeof Assets.spritesheets];
        if (sheet?.animations?.walk) {
          this.anims.create({
            key: et.animKey,
            frames: this.anims.generateFrameNumbers(et.spriteKey, {
              start: sheet.animations.walk.start,
              end: sheet.animations.walk.end,
            }),
            frameRate: 8,
            repeat: -1,
          });
        }
      }
    }

    this.player = createPlayer(this, width / 2, height / 2, Assets);
    this.cameras.main.startFollow(this.player);

    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.coins = this.physics.add.group();
    this.gems = this.physics.add.group();

    this.add.existing(this.enemies);
    this.add.existing(this.projectiles);
    this.add.existing(this.coins);
    this.add.existing(this.gems);

    // Particle texture for juice effects (circle)
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle_circle', 8, 8);
    g.destroy();

    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);
    this.physics.add.overlap(this.player, this.gems, this.collectGem, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, undefined, this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Phaser.Types.Input.Keyboard.CursorKeys;

    const handleJoystickMove = (e: Event) => {
      const ce = e as CustomEvent;
      this.isJoystickActive = true;
      this.joystickX = ce.detail.x;
      this.joystickY = ce.detail.y;
    };
    const handleJoystickStop = () => {
      this.isJoystickActive = false;
      this.joystickX = 0;
      this.joystickY = 0;
    };
    const handlePause = () => {
      this.isPaused = true;
      this.physics.pause();
    };
    const handleResume = () => {
      this.isPaused = false;
      this.physics.resume();
    };
    const handleForceGameOver = () => {
      if (!this.isGameOver) {
        this.playerHealth = 0;
        gameEvents.dispatchEvent(
          new CustomEvent('updateHealth', { detail: { health: 0, max: this.maxHealth } })
        );
        this.triggerGameOver();
      }
    };

    gameEvents.addEventListener('joystickMove', handleJoystickMove);
    gameEvents.addEventListener('joystickStop', handleJoystickStop);
    gameEvents.addEventListener('selectAbility', this.handleSelectAbility);
    gameEvents.addEventListener('pauseGame', handlePause);
    gameEvents.addEventListener('resumeGame', handleResume);
    gameEvents.addEventListener('forceGameOver', handleForceGameOver);

    this.events.on('shutdown', () => {
      gameEvents.removeEventListener('joystickMove', handleJoystickMove);
      gameEvents.removeEventListener('joystickStop', handleJoystickStop);
      gameEvents.removeEventListener('selectAbility', this.handleSelectAbility);
      gameEvents.removeEventListener('pauseGame', handlePause);
      gameEvents.removeEventListener('resumeGame', handleResume);
      gameEvents.removeEventListener('forceGameOver', handleForceGameOver);
    });
  }

  private triggerGameOver() {
    this.isGameOver = true;
    this.player.setVelocity(0, 0);
    this.player.setTint(0x555555);
    this.player.play(`${GAME_CONFIG.player.spriteKey}_dead`);

    this.enemies.getChildren().forEach((e: unknown) => {
      const sprite = e as Phaser.Physics.Arcade.Sprite;
      if (sprite.active) sprite.setVelocity(0, 0);
    });

    this.isJoystickActive = false;
    gameEvents.dispatchEvent(new Event('gameOver'));

    this.time.delayedCall(2000, () => {
      this.scene.start('GameOverScene');
    });
  }

  private handleSelectAbility = (e: Event) => {
    const ce = e as CustomEvent;
    const abilityKey = ce.detail.ability as string;
    const ability = ABILITIES.find((a) => a.key === abilityKey);
    if (!ability) return;

    const eff = ability.effect;
    if (eff.type === 'stat') {
      switch (eff.stat) {
        case 'speed':
          this.playerSpeed += eff.delta;
          break;
        case 'fireRate':
          this.fireRate = Math.max(100, this.fireRate + eff.delta);
          break;
        case 'maxHealth':
          this.maxHealth += eff.delta;
          if (eff.fullHealOnPick) {
            this.playerHealth = this.maxHealth;
            gameEvents.dispatchEvent(
              new CustomEvent('updateHealth', {
                detail: { health: this.playerHealth, max: this.maxHealth },
              })
            );
          }
          break;
        case 'projectileDamage':
          this.projectileDamage += eff.delta;
          break;
        case 'projectileSpeed':
          this.projectileSpeed += eff.delta;
          break;
      }
    } else if (eff.type === 'multishot') {
      this.multishotCount += eff.count;
    } else if (eff.type === 'pierce') {
      this.pierceEnabled = true;
    } else if (eff.type === 'aoe') {
      this.aoeRadius = eff.radius;
      this.aoeDamage = eff.damage;
    } else if (eff.type === 'orbit') {
      this.orbitCount += eff.count;
      this.orbitDamage += eff.damage;
    }

    this.isPaused = false;
    this.physics.resume();
  };

  levelUp() {
    this.playerLevel += 1;
    this.playerXp -= this.nextLevelXp;
    this.nextLevelXp = Math.floor(
      this.nextLevelXp * GAME_CONFIG.xp.levelMultiplier
    );

    gameEvents.dispatchEvent(
      new CustomEvent('updateXp', {
        detail: { xp: this.playerXp, max: this.nextLevelXp, level: this.playerLevel },
      })
    );
    gameEvents.dispatchEvent(new Event('showLevelUp'));

    this.player.setVelocity(0, 0);
    this.isPaused = true;
    this.physics.pause();
  }

  update(time: number) {
    if (this.isGameOver || this.isPaused) return;

    const bg = this.children.list[0] as Phaser.GameObjects.TileSprite;
    bg.tilePositionX = this.cameras.main.scrollX;
    bg.tilePositionY = this.cameras.main.scrollY;

    let vx = 0;
    let vy = 0;
    const speed = this.playerSpeed;

    if (this.isJoystickActive) {
      const angle = Math.atan2(this.joystickY, this.joystickX);
      vx = Math.cos(angle) * speed;
      vy = -Math.sin(angle) * speed;
    } else {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed;
      if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
      if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;
      if (vx !== 0 && vy !== 0) {
        vx *= 0.7071;
        vy *= 0.7071;
      }
    }

    this.player.setVelocity(vx, vy);
    if (vx > 0) this.player.setFlipX(false);
    else if (vx < 0) this.player.setFlipX(true);

    const wave = this.waveSystem.getCurrentWave(time);
    this.waveSystem.update(time);

    const spawnInterval = this.waveSystem.getSpawnInterval(wave);
    const maxEnemies = this.waveSystem.getMaxConcurrentEnemies(wave);

    if (time > this.spawnTimer && this.enemies.getLength() < maxEnemies) {
      this.spawnEnemy(wave);
      this.spawnTimer = time + spawnInterval;
    }

    this.enemies.getChildren().forEach((e: unknown) => {
      updateEnemyBehavior(this, e as Phaser.Physics.Arcade.Sprite, this.player);
    });

    if (this.orbitCount > 0) {
      this.orbitAngle += 0.05;
      const radius = 100;
      for (let i = 0; i < this.orbitCount; i++) {
        if (!this.orbitOrbs[i]) {
          const orb = this.physics.add.sprite(this.player.x, this.player.y, GAME_CONFIG.projectile.spriteKey);
          orb.setDisplaySize(30, 30);
          orb.setData('damage', this.orbitDamage);
          orb.setData('isOrbit', true);
          this.orbitOrbs.push(orb);
          this.projectiles.add(orb);
        }
        const angle = this.orbitAngle + (i * (Math.PI * 2) / this.orbitCount);
        this.orbitOrbs[i].setPosition(
          this.player.x + Math.cos(angle) * radius,
          this.player.y + Math.sin(angle) * radius
        );
      }
    }

    if (time > this.lastFired) {
      this.fireProjectile();
      this.lastFired = time + this.fireRate;
    }
  }

  spawnEnemy(wave: number) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 500;
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    const enemyType = this.waveSystem.pickEnemyType(wave);
    const enemy = createEnemy(this, x, y, enemyType, this.playerLevel);
    this.enemies.add(enemy);
  }

  fireProjectile() {
    const activeEnemies = this.enemies.getChildren().filter((e) => (e as Phaser.GameObjects.GameObject & { active: boolean }).active);
    if (activeEnemies.length === 0) return;

    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let minDistance = Infinity;

    for (const e of activeEnemies) {
      const enemy = e as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = enemy;
      }
    }

    if (nearest && minDistance < 400) {
      const baseAngle = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        nearest.x,
        nearest.y
      );
      const spread = 0.15;
      const count = this.multishotCount;

      for (let i = 0; i < count; i++) {
        const angleOffset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
        const angle = baseAngle + angleOffset;
        const targetX = this.player.x + Math.cos(angle) * 400;
        const targetY = this.player.y + Math.sin(angle) * 400;

        createProjectile(
          this,
          this.player.x,
          this.player.y,
          targetX,
          targetY,
          {
            damage: this.projectileDamage,
            speed: this.projectileSpeed,
            size: GAME_CONFIG.player.projectileSize,
            textureKey: GAME_CONFIG.projectile.spriteKey,
          },
          this.projectiles
        );
      }
    }
  }

  private spawnFloatingText(
    x: number,
    y: number,
    text: string,
    options: { color: number; fontSize?: number; shadowColor?: string; glow?: boolean }
  ) {
    const { color, fontSize = 28, shadowColor = 'rgba(0,0,0,0.8)', glow = false } = options;
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    const t = this.add.text(x, y, text, {
      fontFamily: '"Orbitron", "Arial Black", sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: hex,
      stroke: '#000000',
      strokeThickness: 5,
      resolution: 2,
    });
    t.setOrigin(0.5, 0.5);
    t.setScale(0.3);
    t.setAlpha(0);
    if (glow) {
      t.setShadow(0, 0, hex, 16, false, true);
    } else {
      t.setShadow(2, 2, shadowColor, 3, true, true);
    }
    const driftX = Phaser.Math.Between(-12, 12);
    this.tweens.add({
      targets: t,
      scale: 1.15,
      alpha: 1,
      duration: 120,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: t,
          x: x + driftX,
          y: y - 70,
          alpha: 0,
          scale: 0.85,
          duration: 520,
          delay: 60,
          ease: 'Power2.in',
          onComplete: () => t.destroy(),
        });
      },
    });
  }

  private spawnParticleBurst(x: number, y: number, color: number, count = 12) {
    const emitter = this.add.particles(x, y, 'particle_circle', {
      speed: { min: 80, max: 180 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      quantity: count,
      tint: color,
      emitting: false,
    });
    emitter.explode(count);
    this.time.delayedCall(450, () => emitter.destroy());
  }

  hitEnemy(projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody, enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const proj = projectile as Phaser.Physics.Arcade.Sprite;
    const en = enemy as Phaser.Physics.Arcade.Sprite;
    if (!proj.active || !en.active) return;

    const damage = proj.getData('damage') ?? 1;
    this.spawnParticleBurst(en.x, en.y, 0xff6666, 8);

    if (!this.pierceEnabled && !proj.getData('isOrbit')) {
      proj.destroy();
    }

    en.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (en.active) {
        const et = en.getData('enemyType');
        if (et?.tint !== undefined) en.setTint(et.tint);
        else en.clearTint();
      }
    });

    let hp = en.getData('hp') as number;
    hp -= damage;
    en.setData('hp', hp);

    if (hp <= 0) {
      const deadX = en.x;
      const deadY = en.y;
      const et = en.getData('enemyType');
      const goldChance = et?.goldChance ?? 0.2;
      if (Math.random() < goldChance) this.dropGold(deadX, deadY);
      this.dropGem(deadX, deadY);
      en.destroy();

      if (this.aoeRadius > 0 && this.aoeDamage > 0) {
        this.enemies.getChildren().forEach((other: unknown) => {
          const o = other as Phaser.Physics.Arcade.Sprite;
          if (!o.active || o === en) return;
          const dist = Phaser.Math.Distance.Between(deadX, deadY, o.x, o.y);
          if (dist <= this.aoeRadius) {
            this.spawnParticleBurst(o.x, o.y, 0xffaa00, 6);
            let oHp = o.getData('hp') as number;
            oHp -= this.aoeDamage;
            o.setData('hp', oHp);
            o.setTint(0xff6600);
            this.time.delayedCall(100, () => {
              if (o.active) {
                const oEt = o.getData('enemyType');
                if (oEt?.tint !== undefined) o.setTint(oEt.tint);
                else o.clearTint();
              }
            });
            if (oHp <= 0) {
              const oGoldChance = (o.getData('enemyType') as { goldChance?: number })?.goldChance ?? 0.2;
              if (Math.random() < oGoldChance) this.dropGold(o.x, o.y);
              this.dropGem(o.x, o.y);
              o.destroy();
            }
          }
        });
      }
    }
  }

  dropGold(x: number, y: number) {
    const coin = this.physics.add.sprite(x, y, GAME_CONFIG.currency.spriteKey);
    coin.setDisplaySize(48, 48);
    coin.y = y - 40;
    coin.alpha = 0;

    this.tweens.add({
      targets: coin,
      y,
      alpha: 1,
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        if (!coin.active) return;
        this.tweens.add({
          targets: coin,
          displayWidth: 56,
          displayHeight: 56,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });
    this.coins.add(coin);
  }

  dropGem(x: number, y: number) {
    const offsetX = Phaser.Math.Between(-10, 10);
    const gem = this.physics.add.sprite(x + offsetX, y, GAME_CONFIG.xp.spriteKey);
    gem.setDisplaySize(24, 24);
    gem.y = y - 30;
    gem.alpha = 0;

    this.tweens.add({
      targets: gem,
      y: y + Phaser.Math.Between(0, 10),
      alpha: 1,
      duration: 400,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        if (!gem.active) return;
        this.tweens.add({
          targets: gem,
          y: gem.y - 5,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });
    this.gems.add(gem);
  }

  collectCoin(_player: Phaser.Types.Physics.Arcade.GameObjectWithBody, coin: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const p = _player as Phaser.Physics.Arcade.Sprite;
    const c = coin as Phaser.Physics.Arcade.Sprite;
    if (!c.active) return;
    const cx = c.x;
    const cy = c.y;
    this.spawnFloatingText(cx, cy, '+1 GOLD', {
      color: 0xfbbf24,
      fontSize: 26,
      shadowColor: 'rgba(200,150,0,0.7)',
      glow: true,
    });
    this.spawnParticleBurst(cx, cy, 0xfbbf24, 14);
    c.destroy();
    gameEvents.dispatchEvent(new Event('addGold'));
    const baseSize = GAME_CONFIG.player.playerSize;
    this.tweens.killTweensOf(p);
    this.tweens.add({
      targets: p,
      displayWidth: { from: baseSize, to: baseSize * 1.2 },
      displayHeight: { from: baseSize, to: baseSize * 1.2 },
      duration: 100,
      yoyo: true,
    });
  }

  collectGem(_player: Phaser.Types.Physics.Arcade.GameObjectWithBody, gem: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const p = _player as Phaser.Physics.Arcade.Sprite;
    const g = gem as Phaser.Physics.Arcade.Sprite;
    if (!g.active) return;
    const gx = g.x;
    const gy = g.y;
    this.spawnFloatingText(gx, gy, '+1 XP', {
      color: 0x38bdf8,
      fontSize: 26,
      shadowColor: 'rgba(0,100,150,0.6)',
      glow: true,
    });
    this.spawnParticleBurst(gx, gy, 0x22d3ee, 14);
    g.destroy();

    this.playerXp += 1;

    if (this.playerXp >= this.nextLevelXp) {
      this.levelUp();
    } else {
      gameEvents.dispatchEvent(
        new CustomEvent('updateXp', {
          detail: {
            xp: this.playerXp,
            max: this.nextLevelXp,
            level: this.playerLevel,
          },
        })
      );
    }

    const baseSize = GAME_CONFIG.player.playerSize;
    this.tweens.killTweensOf(p);
    this.tweens.add({
      targets: p,
      displayWidth: { from: baseSize, to: baseSize * 1.1 },
      displayHeight: { from: baseSize, to: baseSize * 1.1 },
      duration: 80,
      yoyo: true,
    });
  }

  hitPlayer(player: Phaser.Types.Physics.Arcade.GameObjectWithBody, _enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const p = player as Phaser.Physics.Arcade.Sprite;
    const enemy = _enemy as Phaser.Physics.Arcade.Sprite;
    if (this.isGameOver || this.isPaused) return;
    if (p.tintTopLeft === 0xff0000) return;

    this.playerHealth -= 1;
    gameEvents.dispatchEvent(
      new CustomEvent('updateHealth', {
        detail: { health: this.playerHealth, max: this.maxHealth },
      })
    );

    if (this.playerHealth <= 0) {
      this.triggerGameOver();
      return;
    }

    p.setTint(0xff0000);
    this.cameras.main.shake(200, 0.01);

    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, p.x, p.y);
    p.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);

    this.time.delayedCall(1000, () => {
      if (p.active && !this.isGameOver) p.clearTint();
    });
  }
}
