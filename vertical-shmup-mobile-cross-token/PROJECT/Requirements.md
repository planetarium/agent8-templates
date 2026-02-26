# Requirements & Patterns

## Critical: Asset + UI Pair Rule (First Prompt)

> **Assets and UI redesign are mandatory together.** After generating image assets (NanoBanana Pro), you MUST fully redesign `src/App.tsx` — HUD layout, touch overlay, modals, colors — to match the chosen concept. **Do this on the first prompt.** Replacing assets only while leaving UI as a bare div is not allowed.

---

## gameEvents API

The `gameEvents` EventTarget is created in `src/game/events.ts` and imported by both React and Phaser. These event names are the contract between the two layers — **never rename them after definition**.

| Key | Direction | Payload | Purpose |
|-----|-----------|---------|---------|
| `addCoin` | Phaser → React | `{ amount: number }` | Trigger blockchain coin save |
| `updateScore` | Phaser → React | `{ score: number, multiplier: number }` | Refresh score + multiplier display |
| `updateLives` | Phaser → React | `{ lives: number }` | Refresh lives display |
| `updateBombs` | Phaser → React | `{ bombs: number }` | Refresh bomb count display |
| `updateBossHealth` | Phaser → React | `{ current: number, max: number }` | Update boss HP bar |
| `showBossWarning` | Phaser → React | `{ bossName: string }` | Show "WARNING" overlay before boss |
| `hideBossHealth` | Phaser → React | — | Hide boss HP bar after boss defeated |
| `showPowerUpPickup` | Phaser → React | `{ type: string, label: string }` | Brief pickup notification banner |
| `stageComplete` | Phaser → React | `{ stage: number, score: number, coins: number }` | Show stage clear screen |
| `showTitle` | Phaser → React | — | Switch React state to TITLE |
| `gameStart` | Phaser → React | — | Switch React state to PLAYING |
| `showGameOver` | Phaser → React | `{ score: number, stage: number, coins: number }` | Switch React state to GAMEOVER |
| `startGameFromUI` | React → Phaser | — | TitleScene starts MainScene |
| `restartGameFromUI` | React → Phaser | — | GameOverScene restarts (back to TitleScene) |
| `nextStageFromUI` | React → Phaser | — | Continue to next stage after stage clear |
| `touchMove` | React → Phaser | `{ x: number, y: number }` | Finger canvas position for ship lerp |
| `touchEnd` | React → Phaser | — | Finger lifted |
| `useBomb` | React → Phaser | — | Player activates bomb |
| `pauseGame` | React → Phaser | — | Pause physics + timers |
| `resumeGame` | React → Phaser | — | Resume physics + timers |

---

## server.js (Agent8 Blockchain)

Create `server.js` in project root:

```javascript
class Server {
  async addCoin(amount) {
    if (!amount || amount <= 0) return await $asset.get('coin');
    return await $asset.mint('coin', amount);
  }
}
```

Call from Phaser via the Agent8 client SDK when awarding coins (boss kill, stage clear):
```typescript
import { GameServer } from '@agent8/gameserver';
// In MainScene: await GameServer.call('addCoin', [amount]);
```

---

## Asset Generation Rules (Mandatory)

**Tool: NanoBanana Pro — no other image tool is permitted.**

Every prompt must include all four fields:
- `style` — art style and rendering technique
- `colors` — exact palette (hex codes or named colors matching concept theme)
- `details` — subject description, pose, key visual features
- `background` — transparent OR specific treatment

**Pixel Art quality rules** — `"pixel art"` alone produces blurry output. Prevent with:
- **Required in `style`**: at least one of `high-quality`, `high-resolution`, `detailed`, `HD`
- **Required in `details`**: `clean edges`, `vibrant colors`, `professional sprite quality`
- **Forbidden**: `"pixel art"` alone, `low-res`, `retro low quality`, `simple`, `minimal`
- **Good**: `style: "high-quality pixel art, clean edges, vibrant palette, professional game sprite, HD rendering"`

### Required Image Assets

| Asset | Key in assets.json | Notes |
|-------|-------------------|-------|
| Background layer 1 | `bg_layer1` | Slowest scroll — far background, seamlessly tileable vertically |
| Background layer 2 | `bg_layer2` | Mid-speed scroll — tileable |
| Player ship | `player` | Top-down view, facing upward, concept-themed |
| Player bullet | `bullet_player` | Small, bright, distinct silhouette |
| Enemy type 1 | `enemy_1` | Primary grunt — readable at 48×48 |
| Enemy type 2 | `enemy_2` | Second variant (faster or different pattern) |
| Enemy type 3 | `enemy_3` | Third variant (tanky or stationary shooter) |
| Boss | `boss` | Large sprite (concept-themed mega enemy), top-down |
| Enemy bullet | `bullet_enemy` | Color clearly distinct from player bullet |
| Power-up: weapon | `powerup_weapon` | Weapon upgrade icon |
| Power-up: shield | `powerup_shield` | Shield icon |
| Power-up: bomb | `powerup_bomb` | Extra bomb icon |
| Power-up: score | `powerup_score` | Score multiplier icon |
| Coin / currency | `coin` | Blockchain currency — concept-themed (e.g. "crystal", "star") |
| Explosion | `explosion` | Spritesheet 8+ frames, enemy death animation |

> After generating assets: **immediately redesign `src/App.tsx` in the same prompt.**

---

## Technical Rules

- **`setDisplaySize()` mandatory** — call immediately after every `add.image()` or `add.sprite()`. Never leave size unspecified.
- **No `scaleX` / `scaleY` in Tweens** — use `displayWidth` / `displayHeight` instead. The engine overrides in `Game.ts` remap scale to display dimensions.
- **Gravity = 0** — all movement uses `setVelocity()`. Never rely on physics gravity.
- **Bullet pool mandatory** — use `Physics.Arcade.Group` with `maxSize`. Never `add.sprite()` per bullet. Recycle via `setActive(false).setVisible(false).setPosition(-100, -100)`.
- **No hardcoded balance values in scene/system files** — all numbers live in `src/config/`.
- **Multiline strings** — use backticks, not concatenation.
- **Touch coordinate pass-through** — React touch events use CSS pixel coordinates (`clientX`, `clientY`). Pass them directly via `touchMove`; Phaser converts to game coordinates as needed.
- **Touch overlay z-index** — React touch div sits above Phaser canvas (`z-index: 10`). Phaser canvas pointer events are effectively captured by the React overlay.

---

## Gameplay System Specifications

### Player Ship — Touch Lerp Movement

```typescript
// MainScene fields
private targetX = 0;
private targetY = 0;
private touchActive = false;

// In create(): listen for touch events
gameEvents.addEventListener('touchMove', (e: any) => {
  this.targetX = e.detail.x;
  this.targetY = e.detail.y;
  this.touchActive = true;
});
gameEvents.addEventListener('touchEnd', () => {
  this.touchActive = false;
});

// In update(): smooth lerp to finger
if (this.touchActive) {
  this.player.x = Phaser.Math.Linear(this.player.x, this.targetX, GAME_CONFIG.player.lerpFactor);
  this.player.y = Phaser.Math.Linear(this.player.y, this.targetY, GAME_CONFIG.player.lerpFactor);
}
// Clamp within bounds
this.player.x = Phaser.Math.Clamp(this.player.x, 30, this.scale.width - 30);
this.player.y = Phaser.Math.Clamp(this.player.y, 30, this.scale.height - 30);
```

### Parallax Scrolling Background

```typescript
// In create():
this.bg1 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg_layer1')
  .setOrigin(0).setDepth(-2);
this.bg2 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg_layer2')
  .setOrigin(0).setDepth(-1);

// In update():
this.bg1.tilePositionY -= GAME_CONFIG.scroll.layer1Speed;
this.bg2.tilePositionY -= GAME_CONFIG.scroll.layer2Speed;
```

### Bullet Object Pool

```typescript
// In create():
this.playerBullets = this.physics.add.group({
  maxSize: 60,
  runChildUpdate: false,
});
this.enemyBullets = this.physics.add.group({
  maxSize: 200,
  runChildUpdate: false,
});

// Fire player bullet:
firePlayerBullet() {
  const b = this.playerBullets.get(this.player.x, this.player.y, 'bullet_player');
  if (!b) return;
  b.setActive(true).setVisible(true);
  b.setDisplaySize(GAME_CONFIG.player.bulletWidth, GAME_CONFIG.player.bulletHeight);
  b.body.enable = true;
  b.setVelocity(0, -GAME_CONFIG.player.bulletSpeed);
}

// Recycle off-screen bullets in update():
this.playerBullets.getChildren().forEach((b: any) => {
  if (b.active && b.y < -20) b.setActive(false).setVisible(false);
});
this.enemyBullets.getChildren().forEach((b: any) => {
  if (b.active && (b.y > this.scale.height + 20 || b.y < -20)) {
    b.setActive(false).setVisible(false);
  }
});
```

### Enemy Bullet Patterns

Implement these in `src/config/bulletPatterns.ts` and call from `EnemyShip`:

| Pattern | Logic |
|---------|-------|
| `aimed` | `this.physics.moveTo(bullet, playerX, playerY, speed)` |
| `spread_3` | 3 bullets at angles: −20°, 0°, +20° from downward |
| `spread_5` | 5 bullets at −40°, −20°, 0°, +20°, +40° |
| `circle_8` | 8 bullets at 45° increments (full circle) |
| `spiral` | Angle += step each fire tick; single bullet per tick on timer |
| `curtain` | Rapid sequence sweeping left→right across screen width |

```typescript
// Pattern helper — fire bullet at angle (degrees, 0=up, 90=right)
fireBulletAtAngle(fromX: number, fromY: number, angleDeg: number, speed: number) {
  const b = this.enemyBullets.get(fromX, fromY, 'bullet_enemy');
  if (!b) return;
  b.setActive(true).setVisible(true);
  b.setDisplaySize(12, 12);
  b.body.enable = true;
  const rad = Phaser.Math.DegToRad(angleDeg);
  b.setVelocity(Math.sin(rad) * speed, Math.cos(rad) * speed);
}
```

### Boss Fight System

```typescript
// MainScene fields
private bossMaxHP = 0;
private bossCurrentHP = 0;
private bossPhase = 0;

// On boss HP damage:
damageBoss(amount: number) {
  this.bossCurrentHP = Math.max(0, this.bossCurrentHP - amount);
  gameEvents.dispatchEvent(new CustomEvent('updateBossHealth', {
    detail: { current: this.bossCurrentHP, max: this.bossMaxHP }
  }));
  this.checkBossPhase();
  if (this.bossCurrentHP <= 0) this.defeatBoss();
}

// Phase transitions at HP thresholds (e.g. 60% and 30%):
checkBossPhase() {
  const ratio = this.bossCurrentHP / this.bossMaxHP;
  if (ratio < 0.3 && this.bossPhase < 3) {
    this.bossPhase = 3; // enrage
    this.cameras.main.shake(500, 0.02);
  } else if (ratio < 0.6 && this.bossPhase < 2) {
    this.bossPhase = 2;
  }
}
```

### Bomb System

```typescript
// On useBomb event:
activateBomb() {
  if (this.bombCount <= 0) return;
  this.bombCount--;
  gameEvents.dispatchEvent(new CustomEvent('updateBombs', { detail: { bombs: this.bombCount } }));

  // Clear all enemy bullets
  this.enemyBullets.getChildren().forEach((b: any) => {
    if (b.active) b.setActive(false).setVisible(false);
  });
  // Damage all on-screen enemies
  this.enemies.getChildren().forEach((e: any) => {
    if (e.active) this.damageEnemy(e, GAME_CONFIG.bomb.damage);
  });
  // Screen flash
  this.cameras.main.flash(300, 255, 255, 255);
}
```

### Score & Multiplier

```typescript
// Fields
private score = 0;
private multiplier = 1;
private killStreak = 0;

// On enemy kill:
addScore(baseValue: number) {
  this.killStreak++;
  this.multiplier = Math.min(
    GAME_CONFIG.scoring.maxMultiplier,
    1 + Math.floor(this.killStreak / 5) * GAME_CONFIG.scoring.multiplierStep
  );
  this.score += Math.floor(baseValue * this.multiplier);
  gameEvents.dispatchEvent(new CustomEvent('updateScore', {
    detail: { score: this.score, multiplier: this.multiplier }
  }));
}

// On player hit:
resetMultiplier() {
  this.killStreak = 0;
  this.multiplier = 1;
  gameEvents.dispatchEvent(new CustomEvent('updateScore', {
    detail: { score: this.score, multiplier: this.multiplier }
  }));
}
```

---

## Code Patterns

- **Config separation** — all tunable numbers (speed, HP, damage, timing, size) live in `src/config/`. Scene/entity/system files import and use only.
- **Depth ordering** — backgrounds: depth -2, -1; power-ups: 0; enemies: 1; player: 2; player bullets: 3; enemy bullets: 4; effects/UI: 5+
- **Visual feedback** — use `this.cameras.main.shake(duration, intensity)` on player hit; `this.cameras.main.flash()` on bomb; play explosion animation on enemy death.
- **Phaser ↔ React interop** — dispatch: `gameEvents.dispatchEvent(new CustomEvent('key', { detail: payload }))` / listen: `gameEvents.addEventListener('key', (e: any) => { e.detail })`
- **Entity factory pattern** — `createPlayerShip()`, `createEnemyShip()` are pure factory functions returning configured sprites. Runtime state stored via `sprite.setData('key', value)` / `sprite.getData('key')`.
