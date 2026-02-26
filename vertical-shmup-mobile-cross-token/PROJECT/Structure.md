# Project Structure

Files are marked **[BUILD]** (create from scratch), **[REPLACE]** (exists as placeholder — rewrite entirely), **[MODIFY ONCE]** (make specific changes then freeze), or **[DO NOT MODIFY]** (infrastructure — do not touch).

> **Critical pair**: `assets.json` and `App.tsx` must be updated together on the first prompt. Never replace assets without redesigning the full UI.

---

## Full File Map

```
[project root]
├── server.js                                    [BUILD] Agent8 addCoin blockchain function
├── package.json                                 [DO NOT MODIFY]
├── vite.config.ts                               [DO NOT MODIFY]
├── tsconfig*.json                               [DO NOT MODIFY]
├── tailwind.config.js                           [DO NOT MODIFY]
│
└── src/
    ├── assets.json                              [REPLACE] Was { "sprites": {} } — fill with all asset URLs
    ├── App.tsx                                  [REPLACE] Was bare div — full redesign: HUD, touch overlay, all modals
    ├── App.css                                  [REPLACE] Update with concept theme colors/fonts
    ├── index.css                                [DO NOT MODIFY]
    ├── main.tsx                                 [DO NOT MODIFY] React 18 entry point
    │
    ├── components/
    │   ├── GameComponent.tsx                    [DO NOT MODIFY] Mounts Phaser canvas
    │   └── PowerUpIndicator.tsx                 [BUILD] Icon + label registry for all power-up types
    │
    ├── config/                                  ← ALL 5 FILES MUST BE CREATED
    │   ├── gameConfig.ts                        [BUILD] Game name, player stats, scroll, bomb, scoring, UI theme
    │   ├── enemyTypes.ts                        [BUILD] Min 3 enemy type definitions
    │   ├── bulletPatterns.ts                    [BUILD] Min 4 bullet pattern definitions
    │   ├── powerUpTypes.ts                      [BUILD] Min 4 power-up type definitions
    │   └── stageConfig.ts                       [BUILD] Min 3 stage definitions with waves + boss
    │
    └── game/
        ├── events.ts                            [BUILD] export const gameEvents = new EventTarget()
        │
        ├── Game.ts                              [MODIFY ONCE] Fix gravity → { x:0, y:0 }; add TitleScene + GameOverScene imports + scene list
        │
        ├── scenes/
        │   ├── TitleScene.ts                    [BUILD] Show title; listen startGameFromUI → start MainScene
        │   ├── MainScene.ts                     [REPLACE] Was sky+ground — build full game scene
        │   └── GameOverScene.ts                 [BUILD] Listen restartGameFromUI → start TitleScene
        │
        ├── entities/
        │   ├── PlayerShip.ts                    [BUILD] Touch lerp movement, auto-fire, invincibility, shield
        │   ├── EnemyShip.ts                     [BUILD] Factory, behaviors (formation/dive/stationary/zigzag), damage, death
        │   ├── Bullet.ts                        [BUILD] Pool helpers for player + enemy bullets
        │   └── PowerUp.ts                       [BUILD] Drop logic, downward drift, player pickup, effect dispatch
        │
        └── systems/
            ├── ScrollSystem.ts                  [BUILD] 2-layer TileSprite parallax, per-stage speed
            ├── StageSystem.ts                   [BUILD] Time-based wave sequencer from stageConfig
            └── BossSystem.ts                    [BUILD] Boss spawn, phase transitions, defeat sequence
```

---

## Config File Specifications

### `src/config/gameConfig.ts`

```typescript
export const GAME_CONFIG = {
  name: 'GAME NAME',
  subtitle: 'TAGLINE',

  player: {
    spriteKey: 'player',
    width: 60,
    height: 80,
    speed: 300,
    lerpFactor: 0.18,        // 0.1 = sluggish, 0.3 = snappy
    maxHP: 3,
    maxBombs: 3,
    fireRate: 180,           // ms between auto-fire shots
    bulletWidth: 10,
    bulletHeight: 24,
    bulletSpeed: 700,
    bulletDamage: 1,
    bulletKey: 'bullet_player',
    invincibilityDuration: 2000,
  },

  scroll: {
    layer1Speed: 0.4,
    layer2Speed: 1.0,
  },

  bomb: {
    damage: 999,
  },

  scoring: {
    maxMultiplier: 8,
    multiplierStep: 0.5,     // multiplier increase per 5-kill streak tier
  },

  currency: {
    spriteKey: 'coin',
    displayName: 'Coins',   // concept-themed label
  },

  ui: {
    accentColor: '#00FFCC',
    accentTailwind: 'cyan',
    titleGradient: 'from-cyan-300 via-blue-200 to-indigo-400',
    gameOverBgClass: 'bg-red-950/80',
    stageClearBgClass: 'bg-indigo-950/80',
    livesStyle: 'ships' as const,  // 'ships' | 'hearts' | 'orbs'
    gameOverTitle: 'GAME OVER',
    stageClearTitle: 'STAGE CLEAR!',
    tryAgainLabel: 'RETRY',
  },
};
```

### `src/config/stageConfig.ts`

```typescript
export interface WaveEntry {
  atTime: number;       // seconds from stage start
  enemyType: string;    // key from ENEMY_TYPES
  count: number;
  formation: 'line_top' | 'v_shape' | 'spread_top' | 'sides';
  spawnInterval: number; // ms between spawns in same wave
}

export interface BossPhase {
  id: number;
  hpThreshold: number;  // 0–1 ratio, switch phase BELOW this
  attackPattern: string;
  movePattern: 'stationary' | 'horizontal_sweep' | 'figure_eight';
  fireRate: number;     // ms between boss shots
}

export interface BossConfig {
  spriteKey: string;
  width: number;
  height: number;
  hp: number;
  phases: BossPhase[];
  coinReward: number;
  scoreValue: number;
}

export interface StageConfig {
  id: number;
  label: string;
  duration: number;      // seconds of waves before boss spawns
  waves: WaveEntry[];
  boss: BossConfig;
  scrollSpeed: { layer1: number; layer2: number };
}

export const STAGES: StageConfig[] = [ /* min 3 stages */ ];
```

### `src/config/enemyTypes.ts`

```typescript
export interface EnemyType {
  key: string;
  spriteKey: string;
  displayName: string;
  width: number;
  height: number;
  hp: number;
  speed: number;
  behavior: 'formation' | 'dive' | 'stationary' | 'zigzag';
  bulletPattern: string;  // key from BULLET_PATTERNS
  fireRate: number;       // ms between shots (0 = never fires)
  scoreValue: number;
  dropProbability: number; // 0–1
  coinValue: number;       // 0 for grunts, nonzero for elites
}
```

---

## App.tsx Architecture

`App.tsx` manages a React state machine and renders the correct screen + HUD:

```typescript
type GameState = 'TITLE' | 'PLAYING' | 'STAGE_CLEAR' | 'GAMEOVER';

// State driven by gameEvents:
// showTitle     → TITLE
// gameStart     → PLAYING
// stageComplete → STAGE_CLEAR
// showGameOver  → GAMEOVER
```

**Layers in App.tsx** (stacked via `position: absolute`):

```
z-0   <GameComponent />        Phaser canvas (pointer-events: none)
z-10  Touch overlay div        Captures all touch events (pointer-events: auto)
z-20  HUD elements             Score, lives, bombs, stage, boss HP bar, power-up banner
z-30  Modal screens            Title / Stage Clear / Game Over (conditionally rendered)
```

**Touch overlay implementation:**
```tsx
<div
  className="absolute inset-0 z-10"
  style={{ touchAction: 'none' }}
  onTouchStart={(e) => {
    const t = e.touches[0];
    gameEvents.dispatchEvent(new CustomEvent('touchMove', { detail: { x: t.clientX, y: t.clientY } }));
  }}
  onTouchMove={(e) => {
    const t = e.touches[0];
    gameEvents.dispatchEvent(new CustomEvent('touchMove', { detail: { x: t.clientX, y: t.clientY } }));
  }}
  onTouchEnd={() => gameEvents.dispatchEvent(new CustomEvent('touchEnd'))}
/>
```

---

## MainScene.ts Responsibility

`MainScene` is the orchestrator. It:
1. Instantiates and owns all systems (ScrollSystem, StageSystem, BossSystem)
2. Creates all Phaser groups (enemies, playerBullets, enemyBullets, powerUps)
3. Registers all `physics.add.overlap()` callbacks
4. Listens to all `gameEvents` from React (touchMove, touchEnd, useBomb, pauseGame, resumeGame, nextStageFromUI)
5. Dispatches all `gameEvents` to React (updateScore, updateLives, etc.)
6. Manages the stage flow state machine: `PLAYING → BOSS_FIGHT → STAGE_CLEAR → PLAYING` / `GAME_OVER`

---

## Summary Table

| Category | Files | Action |
|----------|-------|--------|
| Shared event bus | `game/events.ts` | Build first |
| Engine fix | `game/Game.ts` | Modify once (gravity + scenes), then freeze |
| Scenes | `TitleScene.ts`, `MainScene.ts`, `GameOverScene.ts` | Build all 3 |
| Entities | `entities/*.ts` (4 files) | Build all |
| Systems | `systems/*.ts` (3 files) | Build all |
| Config | `config/*.ts` (5 files) | Build all |
| Assets | `assets.json` | Replace |
| UI | `App.tsx`, `App.css`, `PowerUpIndicator.tsx` | Redesign/build |
| Blockchain | `server.js` | Build |
| Infrastructure | `GameComponent.tsx`, `main.tsx`, `index.css`, config files | Do not touch |
