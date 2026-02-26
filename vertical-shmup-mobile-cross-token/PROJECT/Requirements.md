# Requirements & Patterns

## Critical: Asset + UI Pair Rule (First Prompt)

> **Assets and UI redesign are mandatory together.** After generating any image assets (NanoBanana Pro), you MUST fully redesign `src/App.tsx` — layout, colors, HUD, touch overlay, modals — to match the chosen concept. **Do this on the first prompt** — do not defer UI to a later prompt or follow-up. **Replacing assets only while leaving the UI unchanged is not allowed.**

---

## Immutable gameEvents Keys

These event names are hardcoded in both React and Phaser. **Never rename them after initial implementation.**

| Key | Direction | Payload | Purpose |
|-----|-----------|---------|---------|
| `addCoin` | Phaser → React | `{ amount: number }` | Increment coin counter (blockchain save) |
| `updateScore` | Phaser → React | `{ score: number, multiplier: number }` | Refresh score display |
| `updateLives` | Phaser → React | `{ lives: number }` | Refresh lives display |
| `updateBossHealth` | Phaser → React | `{ current: number, max: number }` | Update boss HP bar |
| `showBossWarning` | Phaser → React | `{ bossName: string }` | Show "WARNING" boss incoming overlay |
| `hideBossHealth` | Phaser → React | — | Hide boss HP bar after boss defeated |
| `showPowerUpPickup` | Phaser → React | `{ type: string, label: string }` | Brief power-up pickup notification |
| `stageComplete` | Phaser → React | `{ stage: number, coins: number }` | Show stage clear screen |
| `showTitle` | Phaser → React | — | Show title screen state |
| `gameStart` | Phaser → React | — | Game started (hide title) |
| `showGameOver` | Phaser → React | `{ score: number, stage: number, coins: number }` | Show game over screen |
| `gameOver` | Phaser → React | `{ score: number, stage: number, coins: number }` | Game ended (final stats) |
| `startGameFromUI` | React → Phaser | — | Transition TitleScene → MainScene |
| `restartGameFromUI` | React → Phaser | — | Transition GameOverScene → TitleScene |
| `nextStageFromUI` | React → Phaser | — | Advance to next stage after stage clear |
| `touchMove` | React → Phaser | `{ x: number, y: number }` | Finger world position for ship tracking |
| `touchEnd` | React → Phaser | — | Finger lifted — ship stops tracking |
| `useBomb` | React → Phaser | — | Player activates bomb |
| `pauseGame` | React → Phaser | — | Pause physics + timers |
| `resumeGame` | React → Phaser | — | Resume physics + timers |

---

## Asset Generation Rules (Mandatory)

**Tool: NanoBanana Pro — no other image tool is permitted.**

All generated assets must look like they were crafted by a professional game artist. Apply the following standards to every image prompt:

- **Style**: Specify explicit art direction (e.g. "hand-painted 2D", "cel-shaded cartoon", "high-quality pixel art with HD rendering"). For pixel art, see quality rules below.
- **Pixel Art quality rules** — "pixel art" alone produces blurry, low-res output. Prevent this:
  - **Never use** `"pixel art"` alone — always add quality modifiers
  - **Required in `style`**: include at least one of `high-quality`, `high-resolution`, `detailed`, `HD`
  - **Required in `details`**: add `clean edges`, `vibrant colors`, `professional sprite quality`, or `sharp pixel edges`
  - **Avoid**: `low-res`, `retro low quality`, `simple`, `minimal`
  - **Good**: `style: "high-quality pixel art, clean edges, vibrant palette, professional game sprite, HD rendering"`
  - **Bad**: `style: "pixel art"`, `style: "16-bit pixel art"` (no quality modifiers)
- **Quality bar**: Rich colors, clear silhouette, readable at small size, consistent art direction
- **Required prompt fields** — every generation call must include all four:
  - `style` — art style and rendering technique
  - `colors` — exact color palette (hex codes or named colors)
  - `details` — subject description, pose, key visual features
  - `background` — transparent OR specific treatment
- **Consistency**: All assets in one game must share the same art style. Never mix styles.
- **Readable at game size**: Ships render at 48×80 px, enemies at 40–64 px — bold outlines, strong contrast.

### Required Image Assets

| Asset | Key in assets.json | Description |
|-------|-------------------|-------------|
| Background layer 1 | `bg_layer1` | Slowest parallax layer (far background) |
| Background layer 2 | `bg_layer2` | Mid-speed parallax layer |
| Background layer 3 (optional) | `bg_layer3` | Fast parallax layer (near foreground elements) |
| Player ship | `player` | Top-down view, facing up |
| Player bullet | `bullet_player` | Small, bright projectile |
| Player engine flame | `player_exhaust` | Animated or static flame sprite |
| Enemy type 1 | `enemy_1` | Primary grunt enemy |
| Enemy type 2 | `enemy_2` | Second enemy variant |
| Enemy type 3 | `enemy_3` | Third enemy variant (tanky or ranged) |
| Boss | `boss` | Large sprite, top-down, prominent silhouette |
| Enemy bullet | `bullet_enemy` | Distinct from player bullet (color contrast) |
| Power-up: weapon | `powerup_weapon` | Weapon upgrade pickup |
| Power-up: shield | `powerup_shield` | Shield pickup |
| Power-up: bomb | `powerup_bomb` | Extra bomb pickup |
| Power-up: score | `powerup_score` | Score multiplier pickup |
| Coin / currency | `coin` | Blockchain currency pickup (concept-themed) |
| Explosion | `explosion` | Spritesheet (8+ frames) for enemy death |
| Shield effect | `shield_effect` | Ring/bubble for player shield visual |

> **Mandatory UI redesign**: After generating assets, you MUST fully redesign `src/App.tsx`. This is a hard requirement on the first prompt.

---

## Technical Rules (Violations Break the Game)

- **`setDisplaySize()` is mandatory** — call it immediately after every `add.image()` or `add.sprite()`. Never leave size unspecified.
- **No `scaleX` / `scaleY` in Tweens** — use `displayWidth` / `displayHeight` instead. The engine intercepts scale and remaps to display dimensions.
- **No hardcoded balance values in scene files** — all numbers (speed, HP, damage, fire rate, stage timing) live in `src/config/`.
- **Multiline strings**: use backticks, not concatenation.
- **Bullet pool mandatory**: Never `add.sprite()` per bullet. Use a `Physics.Arcade.Group` with `maxSize` as an object pool. Recycle via `setActive(false).setVisible(false)`.
- **Gravity = 0**: All movement uses `setVelocity()`. Never rely on gravity for any game object.
- **Touch coordinates**: Convert React touch events to Phaser world coordinates before dispatching via `touchMove`. The touch overlay div must be `pointer-events: none` on Phaser canvas, `auto` on React overlay.

---

## Gameplay System Specifications

### Player Ship System

```typescript
// Ship tracks finger position with lerp (smooth follow)
// In MainScene.update():
if (this.touchActive) {
  const lerpFactor = 0.18; // tune per feel
  this.player.x = Phaser.Math.Linear(this.player.x, this.targetX, lerpFactor);
  this.player.y = Phaser.Math.Linear(this.player.y, this.targetY, lerpFactor);
}

// Auto-fire: time-based, fires every GAME_CONFIG.player.fireRate ms
// Bullets travel straight up: bullet.setVelocity(0, -GAME_CONFIG.player.bulletSpeed)
```

### Scrolling Background System

```typescript
// 2–3 tiling sprites stacked, scrolled at different speeds
// In MainScene.create():
this.bg1 = this.add.tileSprite(0, 0, width, height, 'bg_layer1').setOrigin(0);
this.bg2 = this.add.tileSprite(0, 0, width, height, 'bg_layer2').setOrigin(0);

// In MainScene.update():
this.bg1.tilePositionY -= GAME_CONFIG.scroll.layer1Speed; // e.g. 0.5
this.bg2.tilePositionY -= GAME_CONFIG.scroll.layer2Speed; // e.g. 1.2
```

### Enemy Bullet Pattern Types

Implement these pattern types in `src/config/bulletPatterns.ts`:

| Pattern | Description | Implementation |
|---------|-------------|----------------|
| `aimed` | Fires directly at player position | `physics.moveTo(bullet, player.x, player.y, speed)` |
| `spread_3` | 3-way spread fan | 3 bullets at -20°, 0°, +20° offset |
| `spread_5` | 5-way spread fan | 5 bullets at -40° to +40° in 20° steps |
| `circle_8` | 8 bullets in all directions | Bullets at 0°, 45°, 90°, ... 315° |
| `spiral` | Rotating pattern (boss) | Angle increments each shot, fired on timer |
| `curtain` | Dense horizontal sweep | Rapid sequence of bullets sweeping left→right |

### Power-Up System

```typescript
// Power-ups are Physics.Arcade.StaticGroup items that move downward
// Drop on enemy death with configurable probability per enemy type
// Overlap with player → apply effect → destroy power-up

// Power-up effect types (define in powerUpTypes.ts):
type PowerUpEffect =
  | { type: 'weapon_upgrade'; level: number }   // Increases weapon spread/power
  | { type: 'shield'; duration: number }         // Temporary invincibility
  | { type: 'bomb_add'; count: number }          // Adds bombs
  | { type: 'score_multiplier'; factor: number; duration: number }
  | { type: 'speed_boost'; factor: number; duration: number }
```

### Boss Fight System

```typescript
// Boss phases: boss switches attack pattern at HP thresholds
// Example: 100% → 60% = phase 1, 60% → 30% = phase 2, 30% → 0% = phase 3 (enrage)

// Boss state fields in MainScene:
private bossMaxHP = 0;
private bossCurrentHP = 0;
private bossPhase = 1;
private bossAttackTimer: Phaser.Time.TimerEvent;

// On boss HP change:
gameEvents.dispatchEvent(new CustomEvent('updateBossHealth', {
  detail: { current: this.bossCurrentHP, max: this.bossMaxHP }
}));
```

### Bomb System

```typescript
// Bomb: clears all enemy bullets + deals damage to all enemies on screen
// Visual: screen flash + expanding shockwave
// Limited use: track with this.bombCount (max from GAME_CONFIG.player.maxBombs)

// On bomb activation:
this.enemyBullets.clear(true, true); // destroy all active enemy bullets
this.enemies.getChildren().forEach(e => applyBombDamage(e, GAME_CONFIG.bomb.damage));
// Screen flash: this.cameras.main.flash(300, 255, 255, 255);
```

---

## Adding a New Power-Up Effect Type (3-Step Checklist)

```
Step 1 — powerUpTypes.ts
  Add new type to PowerUpEffect union:
  | { type: 'yourType'; param: number }

Step 2 — powerUpTypes.ts
  Add the power-up entry to POWER_UPS array with icon, label, color.

Step 3 — MainScene.ts
  Add a branch in handlePowerUpPickup():
  case 'yourType': implement full game logic here
  (add state field + update() hook if the effect runs continuously)
```

---

## Code Patterns

- **Entity setup**: After `add.sprite()` or `add.image()`, always call `setDisplaySize()` immediately.
- **Phaser Groups**: Enemies, player bullets, enemy bullets, power-ups managed as `Physics.Arcade.Group`. Collisions via `this.physics.add.overlap(groupA, groupB, callback)`.
- **Config separation**: All tunable values belong in `src/config/`. Scene files only import and consume them.
- **Stage system**: `StageSystem` reads stage config and fires events/spawns on a timeline using `this.time.addEvent`.
- **Visual feedback**: Use `this.cameras.main.shake(duration, intensity)` on player hit, `this.cameras.main.flash()` on bomb, tweens for explosion scale-up on enemy death.
- **Phaser ↔ React interop**: Always use `gameEvents.dispatchEvent(new CustomEvent('key', { detail: payload }))` in Phaser, `gameEvents.addEventListener('key', handler)` in React.
- **Score multiplier decay**: Multiplier resets to 1× when player takes damage. Track consecutive kills with `this.killStreak`.
