# Project Structure

## 🚨 CROSSRAMP — FIRST PROMPT MANDATORY

> **NEVER skip CrossRamp deployment. Required on every first prompt without exception.**

- Call `read_gameserver_sdk_v2`
- Call `read_gameserver_sdk_crossramp`
- Verify `.crossramp` `asset_keys` matches server asset key (see table below)

---

## ⚠️ Pre-Built Game — Do NOT Recreate on First Prompt

**You MUST on first prompt:**
1. Read existing code → report current implementation to user
2. Ask what changes the user wants
3. Deploy CrossRamp (MANDATORY — never skip):
   - Call `read_gameserver_sdk_v2`
   - Call `read_gameserver_sdk_crossramp`
   - Verify `.crossramp` `asset_keys` matches `server.ts` → `$asset.mint('energy_core')`

**You MUST NOT on first prompt:**
- Generate assets, redesign overlays, rewrite GameScene, or modify any code unless explicitly requested

---

## Current Game: CYBER FIGHTER

| Element | Implementation |
|---------|---------------|
| Theme | Cyberpunk neon city — retro arcade vertical shooter |
| Player | Cyberpunk jet fighter (neon blue/pink); virtual joystick + auto-fire; keyboard arrow keys also supported |
| Enemies | Cyber-drone enemies; wave-based spawning (count increases each wave); track toward player |
| Boss | Massive boss ship (neon purple/green); spawns every 5th wave; sinusoidal movement; spread shot (5-bullet fan); 40+8×wave HP |
| Drops | 80% stardust (+1 energy_core), 12% crystal (+3 energy_core + bonus score), 8% life (+1 HP) |
| Score | +100–500 per enemy (scales with wave); +5000–10000 for boss; +150 for crystal pickup; saved to leaderboard |
| HUD | Score (top-left), Wave (top-center), Energy Cores collected (top-right), HP hearts (bottom-left) |
| Currency | `energy_core` — claimed on game over via `claimStardust()` server function |
| Exchange | 10 energy_cores = 1 GALAX token; handled in WalletScene/WalletOverlay via `getGameConfig()` |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json                          [CHANGE] sprite URLs (player, enemy, boss, stardust, crystal, playerBullet, enemyBullet, bg)
├── App.tsx                              [DO NOT MODIFY] GameServer.Provider + GameComponent wrapper
├── App.css                              [CHANGE if theme] Global reset
│
├── game/
│   ├── Game.ts                          [DO NOT MODIFY] Phaser config + engine overrides (setDisplaySize/setScale/Tween)
│   ├── EventBus.ts                      [DO NOT MODIFY] Phaser ↔ React event bridge
│   └── scenes/
│       ├── BootScene.ts                 [DO NOT MODIFY] Auto-loads all assets.json keys → BOOT_PROGRESS
│       ├── TitleScene.ts                [CHANGE if BG] Scrolling BG + floating ship animation
│       ├── GameScene.ts                 [CHANGE] Core gameplay: waves, boss, drops, scoring, joystick
│       ├── GameOverScene.ts             [DO NOT MODIFY] Emits SCENE_CHANGE only
│       └── WalletScene.ts               [DO NOT MODIFY] Emits SCENE_CHANGE only
│
├── components/
│   ├── GameComponent.tsx                [DO NOT MODIFY] Phaser mount + EventBus subscriptions + claimStardust logic
│   └── overlays/
│       ├── LoadingOverlay.tsx           [CHANGE if logo]
│       ├── LoadingOverlay.module.css    [CHANGE]
│       ├── TitleOverlay.tsx             [CHANGE] Shows game title, best score, energy_core balance, EXCHANGE button
│       ├── TitleOverlay.module.css      [CHANGE]
│       ├── HUDOverlay.tsx               [CHANGE] Score / Wave / Stardust / HP display
│       ├── HUDOverlay.module.css        [CHANGE]
│       ├── GameOverOverlay.tsx          [CHANGE] Final score, wave, stardust, retry button
│       ├── GameOverOverlay.module.css   [CHANGE]
│       ├── WalletOverlay.tsx            [CHANGE] Exchange panel — reads exchangeRate/tokenSymbol/collectibleName from server
│       ├── WalletOverlay.module.css     [CHANGE]
│       ├── CrossRampOverlay.tsx         [CHANGE if theme]
│       └── CrossRampOverlay.module.css  [CHANGE]

server/
└── src/server.ts                        [CHANGE] claimStardust, getStardustBalance, getGameConfig, saveHighScore, getLeaderboard
```

---

## Absolute Constraints

- `src/game/Game.ts` — DO NOT MODIFY (Phaser engine override; any change breaks entire game)
- `src/game/scenes/BootScene.ts` — DO NOT MODIFY (edit `assets.json` instead)
- `GameComponent.tsx` — DO NOT MODIFY (`claimStardust` and `openCrossRamp` logic hardcoded)
- EventBus event keys: `SCENE_CHANGE`, `HUD_UPDATE`, `GAME_OVER`, `BOOT_PROGRESS`, `OPEN_CROSS_RAMP`, `STARDUST_BALANCE` — DO NOT RENAME
- Scene keys: `BootScene`, `TitleScene`, `GameScene`, `GameOverScene`, `WalletScene` — DO NOT RENAME
- Physics gravity: `{ x: 0, y: 0 }` — DO NOT CHANGE
- `server.ts` function names `claimStardust` and `getStardustBalance` — DO NOT RENAME (GameComponent calls them via `remoteFunction`)
- Phaser Tween: use `displayWidth`/`displayHeight` only — NEVER `scaleX`/`scaleY`
- All images/sprites must call `setDisplaySize()` immediately after creation

---

## CrossRamp: Currency Rename (if user requests)

3-way sync:
1. `server.ts` → `$asset.mint('새키', amount)` and `$asset.get('새키')`
2. Relevant HUD/overlay references to the currency key
3. `.crossramp` → `asset_keys: ["새키"]` (re-run `read_gameserver_sdk_crossramp`)

Current key: `energy_core` | Exchange rate: 10:1 | Token: GALAX
