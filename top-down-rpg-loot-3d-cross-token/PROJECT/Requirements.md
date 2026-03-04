# Requirements & Patterns

## Critical: Asset + UI Pair Rule (First Prompt)

> **Assets and UI screen redesign are mandatory together.** After replacing any 3D assets (character GLBs, gem colors, dungeon materials), you MUST fully redesign `src/components/ui/*` screens — layout, colors, fonts, icons — to match the chosen concept. **Do this on the first prompt** — do not defer UI to a later prompt or follow-up.

## Immutable Server Function Names

These function names are called by UI components. **Never rename them.**

| Function | Called From | Purpose |
|----------|-------------|---------|
| `claimGems(amount)` | GameOverScreen | Mint gem asset to blockchain |
| `getGemBalance()` | TitleScreen, WalletScreen | Read current gem balance |
| `saveHighScore(score, floor)` | GameOverScreen | Save player best score |
| `getPlayerStats()` | GameOverScreen | Read best score/floor/gems |
| `getLeaderboard()` | (Optional) | Top 10 scores |

## Immutable Store API

These Zustand store actions are called by game components. **Never rename them.**

| Action | Called From | Purpose |
|--------|-------------|---------|
| `startGame()` | TitleScreen | Start game from floor 1 |
| `restartGame()` | GameOverScreen | Restart after death |
| `endGame()` | gameStore (damagePlayer) | Transition to gameover |
| `nextFloor()` | Experience | Advance to next floor |
| `damagePlayer()` | Player (onTriggerEnter) | Lose 1 HP |
| `collectGem(id)` | Player / LootGem | Collect gem by id |
| `killEnemy(id, pos)` | Player (melee hit) | Kill enemy, spawn gem |
| `damageEnemy(id, amt)` | Player (melee hit) | Reduce enemy HP |

## 3D Architecture Rules (Violations Break the Game)

- **HTML components NEVER inside `<Canvas>`** — pure Three.js components only in `src/components/r3f/`
- **`RigidBodyObject` rule**: use `RigidBodyObject` from vibe-starter-3d for interactive entities (enemies, items) that need trigger callbacks. `RigidBody` from rapier is OK for static geometry (walls, floor).
- **GameScene.tsx**: NO useState, NO useReducer, NO useEffect with state updates, NO inline objects/functions
- **GameSceneCanvas.tsx**: Only add children inside `<Physics>` that are pure 3D components

## Asset Generation Rules (Mandatory)

**3D character assets (GLB)**:
- Player model: replace `characters.base-model.url` in `assets.json`
- Enemy visuals: replace geometry in `Enemy.tsx` (colored capsule placeholder)
- Gem visuals: replace geometry/material in `LootGem.tsx`
- Environment: replace colors/materials in `DungeonRoom.tsx` and `Floor.tsx`

**UI asset generation (NanoBanana Pro if needed)**:
- All 5 UI screens must be redesigned to match the concept
- Color palette must be consistent across TitleScreen, HUDOverlay, GameOverScreen, WalletScreen

## CROSS Integration Pipeline (First Prompt — Do Not Omit)

When changing the game concept, **all 4 touchpoints must be synchronized**:

```
gameStore.killEnemy()     → gem spawns → collectGem() → totalGems/gemsPending
GameOverScreen.tsx        → claimGems(gemsPending) → server.remoteFunction('claimGems', [amount])
server/src/server.ts      → $asset.mint('gem', amount)   ← asset key must match .crossramp
WalletScreen.tsx          → "100 GEMS = 1 GDT"           ← token name / exchange rate display
```

### Changeable vs Immutable

| Target | Changeable? | Notes |
|--------|-------------|-------|
| `server.ts` — `$asset.mint('gem')` asset key | Yes | Must sync with `.crossramp` asset_keys |
| `server.ts` — function names `claimGems`, `getGemBalance` | **No** | UI components hardcode these |
| `gameStore.ts` — gem values (common/rare/epic) | Yes | Adjust to match concept |
| `WalletScreen.tsx` — token name, exchange rate | Yes | Must update when concept changes |
| `GameSceneUI.tsx` gamePhase routing | Yes | Add new phases if needed, update routing |

### When Changing Exchange Rate

1. `server.ts` — update claimGems validation range
2. `WalletScreen.tsx` — update display text ("100 GEMS", "1 GDT TOKEN")

## Core Gameplay (Template Default)

- [x] Quarter-view 3D dungeon room (22x22 units, walled)
- [x] WASD + joystick movement via QuarterViewController
- [x] Melee attack with range detection (2.5 unit radius)
- [x] 4 enemy types: skeleton, zombie, golem, boss
- [x] Boss floor every 5th floor
- [x] 3 gem rarities: common (+1), rare (+5), epic (+20)
- [x] Life drop (+1 HP) rare chance
- [x] Player HP (3 max) with invincibility frames (1.5s)
- [x] Score system (kill score + floor clear bonus)
- [x] Floor progression: defeat all enemies → 2s delay → next floor
- [x] Attack cooldown (0.8s)
