# Project Structure

Files are marked **[BUILD]** (must be implemented), **[CHANGE]** (customize per concept), or **[DO NOT MODIFY]** (engine/infrastructure).

> **Critical**: `App.tsx` and `assets.json` are a **pair**. When you generate assets, you must also fully redesign `App.tsx` (HUD, touch overlay, colors, all modals). **Do both on the first prompt** — do not defer UI to a later prompt.

---

## Directory Map

```
src/
├── assets.json                                  [CHANGE] All sprite/image URLs — replace every asset
├── App.tsx                                      [CHANGE] Full UI redesign: HUD, touch overlay, modals, all screens
├── App.css                                      [CHANGE] Component CSS — update with concept styling
├── main.tsx                                     [DO NOT MODIFY] React entry point
├── index.css                                    [CHANGE if needed] Global CSS
│
├── components/
│   ├── GameComponent.tsx                        [DO NOT MODIFY] Mounts Phaser canvas into React
│   └── PowerUpIndicator.tsx                     [BUILD + CHANGE] Active power-up display; register all types
│
├── config/                                      ← ALL CONFIG FILES MUST BE IMPLEMENTED
│   ├── gameConfig.ts                            [BUILD + CHANGE] Game name, player stats, scroll config, UI theme tokens, bomb config
│   ├── enemyTypes.ts                            [BUILD + CHANGE] Min 3 enemy types (behavior, speed, hp, sprite, bulletPattern, drop)
│   ├── bulletPatterns.ts                        [BUILD + CHANGE] Enemy bullet pattern definitions (aimed/spread/circle/spiral/curtain)
│   ├── powerUpTypes.ts                          [BUILD + CHANGE] Min 4 power-up types with effect specs
│   └── stageConfig.ts                           [BUILD + CHANGE] Min 3 stages with wave sequences, boss config, scroll speed
│
└── game/
    ├── Game.ts                                  [MODIFY ONCE] Fix gravity to { x: 0, y: 0 } — then DO NOT MODIFY again
    │
    ├── scenes/
    │   ├── TitleScene.ts                        [DO NOT MODIFY] Listens for startGameFromUI → starts MainScene
    │   ├── MainScene.ts                         [BUILD] Core game scene — wires all systems, handles collisions, dispatches events
    │   └── GameOverScene.ts                     [DO NOT MODIFY] Listens for restartGameFromUI → returns to TitleScene
    │
    ├── systems/
    │   ├── ScrollSystem.ts                      [BUILD] 2–3 layer TileSprite parallax, speed configurable per stage
    │   ├── StageSystem.ts                       [BUILD] Time-based wave sequencer, reads stageConfig, spawns enemies, fires boss event
    │   └── BossSystem.ts                        [BUILD] Boss HP tracking, phase transitions, attack switching, death + coin drop
    │
    └── entities/
        ├── PlayerShip.ts                        [BUILD] Touch lerp movement, auto-fire, invincibility, shield visual, bomb activation
        ├── EnemyShip.ts                         [BUILD] Factory function, behavior by type, damage handling, death explosion
        ├── Bullet.ts                            [BUILD] Pool-based bullet factory (player + enemy), pattern helpers
        └── PowerUp.ts                           [BUILD] Drop on enemy death, move downward, player pickup, apply effect

server.js                                        [DO NOT MODIFY] Agent8 addCoin blockchain function
docs/project-2d-rules.md                         [DO NOT MODIFY] Full AI agent ruleset (read this)
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
    speed: 300,           // max movement speed (px/s) — lerp target
    lerpFactor: 0.18,     // ship follow smoothness (0.1 = sluggish, 0.3 = snappy)
    maxHP: 3,             // starting lives
    maxBombs: 3,          // starting bombs
    fireRate: 200,        // ms between auto-fire shots
    bulletDamage: 1,
    bulletSpeed: 700,
    bulletKey: 'bullet_player',
    shipWidth: 60,
    shipHeight: 80,
    invincibilityDuration: 2000,  // ms after getting hit
  },

  scroll: {
    layer1Speed: 0.4,   // bg layer 1 scroll speed per frame
    layer2Speed: 1.0,   // bg layer 2 scroll speed per frame
    layer3Speed: 2.0,   // (optional) bg layer 3 scroll speed per frame
  },

  bomb: {
    damage: 999,        // massive damage to all on-screen enemies
    flashColor: 0xffffff,
    flashDuration: 300,
  },

  scoring: {
    multiplierDecayOnHit: true,  // multiplier resets to 1 on taking damage
    baseMultiplier: 1,
    maxMultiplier: 8,
    multiplierStep: 0.5,         // how much multiplier increases per kill
  },

  currency: {
    spriteKey: 'coin',
    displayName: 'Coins',        // concept-themed label (e.g. "Crystals", "Stars")
  },

  ui: {
    accentColor: '#00FFCC',
    accentTailwind: 'cyan',
    titleGradient: 'from-cyan-300 via-blue-200 to-indigo-400',
    gameOverBgClass: 'bg-red-950/80',
    stageClearBgClass: 'bg-indigo-950/80',
    gameOverTitle: 'GAME OVER',
    stageClearTitle: 'STAGE CLEAR!',
    tryAgainLabel: 'RETRY',
    livesStyle: 'ships' as const,  // 'ships' | 'hearts' | 'orbs'
    scoreLabel: 'SCORE',
    stageLabel: 'STAGE',
    bombLabel: 'BOMB',
  },
};
```

### `src/config/stageConfig.ts`

```typescript
export interface WaveEntry {
  atTime: number;        // seconds from stage start to spawn this wave
  enemyType: string;     // key from ENEMY_TYPES
  count: number;
  formation: 'line_top' | 'v_shape' | 'side_enter' | 'single_center';
  spawnDelay: number;    // ms between spawns in the same wave
}

export interface BossConfig {
  spriteKey: string;
  hp: number;
  width: number;
  height: number;
  phases: BossPhase[];
  coinReward: number;
}

export interface StageConfig {
  id: number;
  label: string;           // e.g. "Stage 1 — Forest Sky"
  duration: number;        // seconds before boss spawn
  waves: WaveEntry[];
  boss: BossConfig;
  scrollSpeed: { layer1: number; layer2: number };
  bgVariant: string;       // key suffix for background assets
}
```

### `src/config/enemyTypes.ts`

```typescript
export interface EnemyType {
  key: string;
  spriteKey: string;
  displayName: string;
  hp: number;
  speed: number;
  behavior: 'formation' | 'dive' | 'stationary' | 'zigzag';
  bulletPattern: string;     // key from BULLET_PATTERNS
  fireRate: number;          // ms between enemy shots
  scoreValue: number;
  width: number;
  height: number;
  dropProbability: number;   // 0–1: chance to drop a power-up on death
  coinValue: number;         // 0 usually; bosses have higher value
}
```

---

## Summary

| Category | Files | Action |
|----------|-------|--------|
| Gravity fix | `Game.ts` | Change once: `y: 0` |
| Config (game data) | `config/*.ts` (5 files) | Build + customize all |
| Assets | `assets.json` | Replace all URLs |
| UI | `App.tsx` | **Full redesign (mandatory with assets)** |
| Power-up icons | `PowerUpIndicator.tsx` | Register all types |
| Game entities | `entities/*.ts` (4 files) | Build all |
| Game systems | `systems/*.ts` (3 files) | Build all |
| Core scene | `MainScene.ts` | Build (wires everything) |
| Engine / Infra | `Game.ts` (after fix), `TitleScene.ts`, `GameOverScene.ts`, `GameComponent.tsx`, `main.tsx`, `server.js` | Do not touch |
