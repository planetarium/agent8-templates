# Project Status

## Critical Rules (Do Not Skip)

| Rule | Action |
|------|--------|
| **Concept** | CROSS/chain/token in user prompt ≠ cyberpunk/SF. Use `docs/project-2d-rules.md` Section 1-B as inspiration; create an original world. |
| **Game.ts first** | Before writing any game code: fix `gravity: { x: 0, y: 0 }` AND update `scene: [TitleScene, MainScene, GameOverScene]`. |
| **Assets + UI (first prompt)** | Asset generation (Step 4) and App.tsx redesign (Step 10) are **one unit**. Complete both on the first prompt — never defer UI. |

---

## Actual Template Baseline

This template is `2d-phaser-basic` with zero game modifications. Understand what you're starting from:

| File | Current State | What to Do |
|------|--------------|------------|
| `src/game/Game.ts` | Engine overrides ✓, gravity `y: 2000` ✗, `scene: [MainScene]` only ✗ | Fix gravity + add all 3 scenes |
| `src/game/scenes/MainScene.ts` | Sky background + green ground rectangle | Completely replace with full game scene |
| `src/App.tsx` | `<div class="app"><GameComponent /></div>` | Full redesign: HUD + touch overlay + all modals |
| `src/assets.json` | `{ "sprites": {} }` | Replace with all generated asset URLs |
| `src/App.css` | Basic overflow:hidden body rules | Update with concept theme colors |
| `src/components/GameComponent.tsx` | Mounts Phaser canvas ✓ | Do not modify |
| `src/main.tsx` | React 18 entry point ✓ | Do not modify |

**Missing files (create all of these):**
- `src/game/events.ts`
- `src/game/scenes/TitleScene.ts`
- `src/game/scenes/GameOverScene.ts`
- `src/game/entities/PlayerShip.ts`
- `src/game/entities/EnemyShip.ts`
- `src/game/entities/Bullet.ts`
- `src/game/entities/PowerUp.ts`
- `src/game/systems/ScrollSystem.ts`
- `src/game/systems/StageSystem.ts`
- `src/game/systems/BossSystem.ts`
- `src/config/gameConfig.ts`
- `src/config/enemyTypes.ts`
- `src/config/bulletPatterns.ts`
- `src/config/powerUpTypes.ts`
- `src/config/stageConfig.ts`
- `src/components/PowerUpIndicator.tsx`
- `server.js`

---

## Build Checklist — Execute in Order

- [ ] **Step 1** — Create `src/game/events.ts`: `export const gameEvents = new EventTarget();`
- [ ] **Step 2** — Fix `src/game/Game.ts`: gravity `{ x: 0, y: 0 }`, scene list `[TitleScene, MainScene, GameOverScene]`, add scene imports
- [ ] **Step 3** — Finalize game name & world concept → draft `GAME_CONFIG.name`, `subtitle`, `currency.displayName`
- [ ] **Step 4** — Generate all assets (NanoBanana Pro): player, boss, 3+ enemy types, player bullet, enemy bullet, all power-up icons, 2 background layers (tileable), explosion spritesheet (8+ frames), coin/currency icon
  → **On this same (first) prompt, complete Step 10 (App.tsx redesign). Do not defer. Assets alone = incomplete.**
- [ ] **Step 5** — Update `src/assets.json` with all new asset URLs
- [ ] **Step 6** — Build `src/config/gameConfig.ts`: game name, player stats (speed, lerpFactor, HP, bombs, fireRate, bullet stats), scroll speeds, bomb config, scoring config, UI theme tokens, currency key
- [ ] **Step 7** — Build `src/config/enemyTypes.ts`: min 3 enemy types, each with `behavior`, `speed`, `hp`, `sprite`, `bulletPattern`, `fireRate`, `scoreValue`, `dropProbability`, `size`
- [ ] **Step 8** — Build `src/config/bulletPatterns.ts`: min 4 patterns (aimed, spread_3, circle_8, spiral + 1 custom concept-themed pattern)
- [ ] **Step 9** — Build `src/config/powerUpTypes.ts`: min 4 types (weapon, shield, bomb, score_multiplier) + 1 original concept-themed type
- [ ] **Step 10** — Redesign `src/App.tsx`: full HUD (score/multiplier, lives, bombs, stage), boss HP bar component, full-screen touch overlay (touchMove/touchEnd dispatch), power-up pickup banner, bomb button, title screen, stage clear screen, game over screen — **MANDATORY on first prompt with Step 4**
- [ ] **Step 11** — Build `src/config/stageConfig.ts`: min 3 stages, each with `waves` array (atTime, enemyType, count, formation), `boss` config (sprite, hp, phases, coinReward), `scrollSpeed`, `duration`
- [ ] **Step 12** — Build `src/game/entities/PlayerShip.ts`: factory function, touch lerp movement (reads `targetX/Y` from MainScene), auto-fire timer, invincibility frames on hit, shield visual toggle
- [ ] **Step 13** — Build `src/game/entities/EnemyShip.ts`: factory function, behavior by type (`formation` y-drift, `dive` toward player, `stationary` shooter, `zigzag` sinusoidal), fire bullet pattern on timer, takes damage + death explosion
- [ ] **Step 14** — Build `src/game/entities/Bullet.ts`: pool helpers (`getPlayerBullet`, `getEnemyBullet`), pool initialization, off-screen recycle logic
- [ ] **Step 15** — Build `src/game/entities/PowerUp.ts`: spawn on enemy death (by dropProbability), drift downward, player overlap → apply effect → dispatch `showPowerUpPickup` → destroy
- [ ] **Step 16** — Build `src/game/systems/ScrollSystem.ts`: initialize TileSprite layers from config, `update(layer1Speed, layer2Speed)` method, `setSpeedForStage(stageId)` method
- [ ] **Step 17** — Build `src/game/systems/StageSystem.ts`: reads `stageConfig`, time-based wave sequencer (`this.time.addEvent`), spawns enemies at `atTime` seconds, emits boss trigger event when waves complete
- [ ] **Step 18** — Build `src/game/systems/BossSystem.ts`: spawn boss at screen top, HP tracking, phase transitions at thresholds (60%→P2, 30%→P3 enrage), per-phase attack timers, defeat sequence (explosion + coin drop + `stageComplete` dispatch)
- [ ] **Step 19** — Build `src/game/scenes/TitleScene.ts`: display title/logo, listen for `startGameFromUI` → `this.scene.start('MainScene')`, dispatch `showTitle` on create
- [ ] **Step 20** — Build `src/game/scenes/GameOverScene.ts`: listen for `restartGameFromUI` → `this.scene.start('TitleScene')`, dispatch `showTitle`
- [ ] **Step 21** — Build `src/game/scenes/MainScene.ts`: wire all systems + entities, set up all collision overlaps, dispatch all gameEvents, manage stage flow (playing → boss → stage clear → next stage / game over)
- [ ] **Step 22** — Build `src/components/PowerUpIndicator.tsx`: icon + label map for all power-up types, renders pickup notification
- [ ] **Step 23** — Create `server.js`: Agent8 `addCoin` blockchain function

---

## Target Feature Set (Complete Game)

### Core Loop
- [ ] Vertical scrolling background (2-layer parallax, speed varies by stage)
- [ ] Player ship: full-screen touch drag to move (lerp), auto-fire upward
- [ ] 3+ enemy types: formation flyers, divers, stationary shooters
- [ ] Enemy bullet patterns: aimed, spread, circle, spiral, 1+ concept-specific
- [ ] Power-up drops: weapon upgrade, shield, extra bomb, score multiplier, 1+ original
- [ ] Bomb: screen-clear ability (limited charges), camera flash effect
- [ ] Boss fight: large boss, 2–3 attack phases, health bar UI
- [ ] Score with kill-streak multiplier chain (resets on player hit)
- [ ] Lives system: 3 starting lives, invincibility on hit, game over at 0

### Progression
- [ ] 3+ stages with increasing enemy density and bullet speed
- [ ] Each stage ends with boss fight
- [ ] Stage clear screen with coin count
- [ ] Coin saved to blockchain via Agent8 server.js

### Polish
- [ ] Explosion spritesheet animation on enemy/boss death
- [ ] Camera shake on player hit
- [ ] Screen flash on bomb
- [ ] "WARNING" boss incoming overlay
- [ ] Power-up pickup notification banner
- [ ] Smooth ship lerp movement (not instant teleport)
- [ ] Consistent concept-themed art direction across all assets + UI
