# Project Status

## Critical Rules (Do Not Skip)

| Rule | Action |
|------|--------|
| **Concept** | CROSS/chain/token in user prompt ≠ cyberpunk. Use Section 1-B as inspiration but create an original world concept yourself. Cyberpunk/SF only if user explicitly requests. |
| **Gravity** | First code change: set `gravity: { x: 0, y: 0 }` in `Game.ts`. Everything breaks with non-zero gravity. |
| **Assets + UI (first prompt)** | Step 3 (assets) and Step 9 (App.tsx redesign) are **one unit**. **Complete both on the first prompt** — do not defer UI to a later prompt. Never leave UI unchanged after generating assets. |

---

## Current Template State (Placeholder — Build Everything)

The template ships with a minimal Phaser scene (sky background + green ground rectangle). This is not a game — it is scaffolding with correct infrastructure.

| Element | Current State | Required Action |
|---------|--------------|-----------------|
| Gravity | `y: 2000` (wrong) | Fix to `{ x: 0, y: 0 }` in Game.ts |
| Player | None | Build PlayerShip entity with lerp movement |
| Enemies | None | Build 3+ enemy types with bullet patterns |
| Scrolling BG | None | Build 2-layer parallax TileSprite system |
| Bullet system | None | Build pooled bullet groups (player + enemy) |
| Stage system | None | Build StageSystem with 3+ stages |
| Boss fight | None | Build boss entity with multi-phase AI |
| Power-ups | None | Build 4+ power-up types with pickup logic |
| Bomb | None | Build bomb system with screen flash |
| Score | None | Build score + multiplier chain |
| Lives/coins | None | Build lives system + blockchain coin events |
| UI (React) | Bare div | Full redesign: HUD, touch layer, all modals |
| Assets | Empty | Generate all required sprites |
| Game name | "basic-vite-react" | Replace with concept name in package.json + gameConfig.ts |

---

## Build Checklist — Execute in Order

- [ ] **Step 1** — Fix `gravity` in `src/game/Game.ts`: `{ x: 0, y: 0 }`
- [ ] **Step 2** — Finalize game name & world concept → update `GAME_CONFIG.name`, `subtitle` in `src/config/gameConfig.ts`
- [ ] **Step 3** — Generate all assets (NanoBanana Pro): player ship, boss, each enemy type (3+), all bullet types, all power-up icons, all background layers, explosion spritesheet, coin/currency icon, shield effect
  → **On this same (first) prompt, do Step 9 (App.tsx full redesign). Do not defer UI. Assets alone = incomplete.**
- [ ] **Step 4** — Update `src/assets.json` with all new asset URLs. Ensure every key matches `GAME_CONFIG` sprite key references.
- [ ] **Step 5** — Build `src/config/enemyTypes.ts`: min 3 enemy types, each with `behavior`, `speed`, `hp`, `sprite`, `bulletPattern`, `dropProbability`
- [ ] **Step 6** — Build `src/config/bulletPatterns.ts`: define all enemy bullet pattern configs (aimed, spread, circle, spiral, etc.)
- [ ] **Step 7** — Build `src/config/powerUpTypes.ts`: min 4 power-up types with effect types, icons, labels
- [ ] **Step 8** — Build `src/config/stageConfig.ts`: min 3 stages, each with wave sequences, enemy compositions, boss config, scroll speed, background variant
- [ ] **Step 9** — Redesign `src/App.tsx`: HUD (score, lives, bombs, stage), boss health bar, touch control overlay, power-up notification, all modal screens (title, stage clear, game over, pause) — **MANDATORY on first prompt (same session as Step 3). Do not defer.**
- [ ] **Step 10** — Build `src/game/entities/PlayerShip.ts`: touch-tracking with lerp, auto-fire, invincibility frames, shield visual, bomb activation
- [ ] **Step 11** — Build `src/game/entities/EnemyShip.ts`: factory function, behavior by type (formation, dive, stationary, boss), takes damage, death explosion
- [ ] **Step 12** — Build `src/game/entities/Bullet.ts`: pool-based bullet factory for both player and enemy bullets, pattern emission helpers
- [ ] **Step 13** — Build `src/game/entities/PowerUp.ts`: drop on death, move downward, player overlap pickup, apply effect to player state
- [ ] **Step 14** — Build `src/game/systems/ScrollSystem.ts`: 2–3 TileSprite parallax layers, configurable scroll speed per stage
- [ ] **Step 15** — Build `src/game/systems/StageSystem.ts`: time-based wave sequencer, reads from stageConfig, spawns enemies, triggers boss event
- [ ] **Step 16** — Build `src/game/systems/BossSystem.ts`: boss HP tracking, phase transitions at HP thresholds, attack pattern switching, death sequence + coin drop
- [ ] **Step 17** — Build `src/game/scenes/MainScene.ts`: wires all systems + entities together, handles all collisions, dispatches all gameEvents, manages game state (playing → stage clear → boss fight → game over)
- [ ] **Step 18** — Update `src/components/PowerUpIndicator.tsx`: register icons/labels for all power-up types

---

## Completed Infrastructure (Do Not Re-implement)

These exist and work correctly in the boilerplate — do not replace:

- `src/game/Game.ts` — Phaser engine with setDisplaySize/setScale/Tween overrides *(but fix gravity: `y: 0`)*
- `src/game/scenes/TitleScene.ts` — listens for `startGameFromUI` event
- `src/game/scenes/GameOverScene.ts` — listens for `restartGameFromUI` event
- `src/components/GameComponent.tsx` — mounts Phaser canvas into React
- `src/main.tsx` — React entry point
- `server.js` — Agent8 blockchain `addCoin` function

---

## Target Feature Set (Full Game)

### Core Loop
- [x] Vertical scrolling background (2-layer parallax)
- [x] Player ship: touch-drag to move, auto-fire upward
- [x] Enemy waves: formation flying, diving, stationary shooters
- [x] Enemy bullets: aimed, spread, circular, spiral patterns
- [x] Power-up drops: weapon, shield, bomb, score multiplier
- [x] Bomb: screen-clear ability with limited charges
- [x] Boss fight: large boss with 2–3 attack phases
- [x] Score with kill-streak multiplier (resets on hit)
- [x] Lives system: player dies and respawns (with invincibility)

### Progression
- [x] 3+ stages with increasing difficulty
- [x] Each stage ends with boss fight
- [x] Stage clear screen with coin reward
- [x] Coin blockchain save via Agent8 server.js

### Polish
- [x] Explosion spritesheet animation on enemy death
- [x] Camera shake on player hit
- [x] Screen flash on bomb
- [x] Boss warning overlay
- [x] Power-up pickup notification
- [x] Smooth ship movement (lerp)
- [x] Concept-themed art direction throughout
