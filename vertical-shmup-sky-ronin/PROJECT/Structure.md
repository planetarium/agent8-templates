# Project Structure

## ⚠️ Pre-Built Game — Do NOT Recreate on First Prompt

**You MUST on first prompt:**
1. Read existing code → report current implementation to user
2. Ask what changes the user wants
3. Deploy CrossRamp (MANDATORY — never skip):
   - Call `read_gameserver_sdk_v2`
   - Call `read_gameserver_sdk_crossramp`
   - Verify `.crossramp` `asset_keys` matches `server.ts` asset key (`stardust`)

**You MUST NOT on first prompt:**
- Generate assets, redesign overlays, rewrite GameScene, or modify any code

---

## Current Game: Sky Ronin

| Element | Implementation |
|---------|---------------|
| Theme | Feudal Japanese sky shooter — badge: "FEUDAL SKY SHOOTER", title: "SKY RONIN" |
| Player | Samurai aircraft at bottom of screen; virtual joystick drag-to-move, auto-fire |
| Enemies | Wave-based spawning; scaling count and difficulty per wave |
| Boss | Every 5th wave: "ONI BOSS" (large, high HP, spread shots, tween entrance) |
| Drops | `stardust` (Spirit Orbs), `crystal` (bonus orbs), `life` (HP restore) |
| Currency | `stardust` asset key — "Spirit Orbs" in-game; 100 Spirit Orbs = 1 SRT (Sky Ronin Token) |
| Leaderboard | Top-10 score leaderboard stored in global collection |
| UI Scenes | TitleOverlay (CRT scanline, gold/red samurai palette), HUDOverlay (score/wave/orbs/HP hearts), GameOverOverlay, WalletOverlay |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json                          [CHANGE] sprite/background image URLs
├── App.tsx                              [DO NOT MODIFY]
├── game/
│   ├── Game.ts                          [DO NOT MODIFY] Phaser engine overrides
│   ├── EventBus.ts                      [DO NOT MODIFY] SCENE_CHANGE, HUD_UPDATE, GAME_OVER, BOOT_PROGRESS, OPEN_CROSS_RAMP, STARDUST_BALANCE
│   └── scenes/
│       ├── BootScene.ts                 [DO NOT MODIFY] auto-loads all assets.json keys
│       ├── TitleScene.ts                [DO NOT MODIFY]
│       ├── GameScene.ts                 [CHANGE] enemy spawns, wave design, boss patterns, powerups
│       ├── GameOverScene.ts             [DO NOT MODIFY]
│       └── WalletScene.ts              [DO NOT MODIFY]
└── components/
    ├── GameComponent.tsx                [DO NOT MODIFY] claimStardust / openCrossRamp logic
    └── overlays/
        ├── TitleOverlay.tsx             [CHANGE] title screen UI (samurai CRT aesthetic)
        ├── TitleOverlay.module.css      [CHANGE]
        ├── HUDOverlay.tsx               [CHANGE] score/wave/spirit orbs/HP hearts
        ├── HUDOverlay.module.css        [CHANGE]
        ├── GameOverOverlay.tsx          [CHANGE]
        ├── GameOverOverlay.module.css   [CHANGE]
        ├── WalletOverlay.tsx            [CHANGE] CSS/layout only — TSX logic reads server props
        ├── WalletOverlay.module.css     [CHANGE]
        ├── CrossRampOverlay.tsx         [DO NOT MODIFY]
        └── LoadingOverlay.tsx           [DO NOT MODIFY]
server/src/server.ts                     [CHANGE] claimStardust, getStardustBalance, getGameConfig, saveHighScore, getLeaderboard, getPlayerStats
```

---

## Absolute Constraints

- `src/game/Game.ts` — never modify (Phaser display size / tween overrides)
- `src/game/scenes/BootScene.ts` — never modify; update `assets.json` instead
- EventBus event key names: `SCENE_CHANGE`, `HUD_UPDATE`, `GAME_OVER`, `BOOT_PROGRESS`, `OPEN_CROSS_RAMP`, `STARDUST_BALANCE`
- Scene keys: `BootScene`, `TitleScene`, `GameScene`, `GameOverScene`, `WalletScene`
- `server.ts` function names `claimStardust` and `getStardustBalance` — hardcoded in `GameComponent.tsx`, never rename
- `GameComponent.tsx` — never modify
- Phaser physics gravity: `{ x: 0, y: 0 }`
- Tween: use `displayWidth`/`displayHeight` — never `scaleX`/`scaleY`
- All images/sprites must call `setDisplaySize()` immediately after creation

---

## CrossRamp: Currency Rename (if user requests)

3-way sync:
1. `server/src/server.ts` → change `$asset.mint('stardust', amount)` and `$asset.get('stardust')` to new key
2. `src/game/scenes/GameScene.ts` → change drop type `'stardust'` string to match new key
3. `.crossramp` → `asset_keys: ["새키"]` (re-run `read_gameserver_sdk_crossramp`)

Also update `getGameConfig()` in `server.ts` to reflect the new `collectibleName` and confirm `exchangeRate` matches `.crossramp`.
