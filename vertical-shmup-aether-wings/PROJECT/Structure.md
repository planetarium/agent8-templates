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
   - Verify `.crossramp` `asset_keys` matches `server.ts` asset key (`lumina`)

**You MUST NOT on first prompt:**
- Generate assets, redesign overlays, rewrite GameScene, or modify any code without user request

---

## Current Game: Aether Wings

| Element | Implementation |
|---------|---------------|
| Theme | Celestial aerial combat — lone pilot soars through radiant cosmic skies in the ship Aether Wings, battling waves of alien forces |
| Player | Aether Wings ship sprite; virtual joystick movement; auto-fires energy shots; spread shot and shield power-ups |
| Enemies | Wave-based spawning with scaling count and HP per wave; boss every 5th wave (cosmic guardian, high HP, spread shots, tween entrance from top) |
| Drops | Lumina (currency, ~80% drop), Crystal (power-up: spread shot or shield, ~12%), Life (HP restore, ~8%) |
| Currency | `lumina` asset key — "LUMINA" in-game; exchange rate: 100 Lumina = 1 GLOW token |
| Score | Wave-scaled points per kill; boss bonus; leaderboard saved server-side |
| UI | TitleOverlay (celestial/cosmic aesthetic, "AETHER WINGS" title, lumina balance display); HUDOverlay (score/wave/lumina ✦ top bar, HP hearts bottom-left); GameOverOverlay; WalletOverlay (CrossRamp exchange UI) |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json              [CHANGE] sprite/background URLs
├── App.tsx                  [DO NOT MODIFY]
├── main.tsx                 [DO NOT MODIFY]
├── game/
│   ├── Game.ts              [DO NOT MODIFY] Phaser engine setup + display overrides
│   ├── EventBus.ts          [DO NOT MODIFY] event keys + type definitions
│   └── scenes/
│       ├── BootScene.ts     [DO NOT MODIFY] auto-loads all assets.json keys
│       ├── TitleScene.ts    [CHANGE] cosmic bg scroll, ship float, particle effects
│       ├── GameScene.ts     [CHANGE] full game logic (player, enemies, drops, waves, joystick)
│       ├── GameOverScene.ts [CHANGE] bg + score save
│       └── WalletScene.ts   [DO NOT MODIFY] CrossRamp scene host
└── components/
    ├── GameComponent.tsx    [DO NOT MODIFY] Phaser mount + claimStardust + openCrossRamp
    └── overlays/
        ├── TitleOverlay.tsx + .module.css    [CHANGE] title UI
        ├── HUDOverlay.tsx + .module.css      [CHANGE] in-game HUD
        ├── GameOverOverlay.tsx + .module.css [CHANGE] game-over screen
        ├── WalletOverlay.tsx + .module.css   [CHANGE] exchange/wallet UI
        ├── CrossRampOverlay.tsx              [DO NOT MODIFY]
        └── LoadingOverlay.tsx                [DO NOT MODIFY]
server/src/server.ts         [CHANGE] claimStardust, getStardustBalance, saveHighScore, getLeaderboard, getGameConfig, getPlayerStats
```

---

## Scene Flow

BootScene → TitleScene ↔ GameScene → GameOverScene ↔ WalletScene

---

## Absolute Constraints

- `src/game/Game.ts` — DO NOT MODIFY (Phaser display size overrides; breaking this breaks the whole game)
- EventBus event keys — DO NOT RENAME: `SCENE_CHANGE`, `HUD_UPDATE`, `GAME_OVER`, `BOOT_PROGRESS`, `OPEN_CROSS_RAMP`, `STARDUST_BALANCE`
- Scene keys — DO NOT RENAME: `BootScene`, `TitleScene`, `GameScene`, `GameOverScene`, `WalletScene`
- `src/components/GameComponent.tsx` — DO NOT MODIFY (`claimStardust` / `openCrossRamp` logic)
- `server.ts` function names `claimStardust` and `getStardustBalance` — DO NOT RENAME (GameComponent calls them by name)
- Phaser gravity: `{ x: 0, y: 0 }` — DO NOT CHANGE
- Tweens: use `displayWidth`/`displayHeight` only — `scaleX`/`scaleY` in tweens is FORBIDDEN
- All images/sprites: call `setDisplaySize()` immediately after creation

---

## CrossRamp: Currency Rename (if user requests)

3-way sync required:
1. `server/src/server.ts` → change `$asset.mint('lumina', amount)` and `$asset.get('lumina')` to new key
2. `server/src/server.ts` → update `getGameConfig()` `collectibleName` and `tokenSymbol` to match
3. `.crossramp` → update `asset_keys: ["<new-key>"]` (re-run `read_gameserver_sdk_crossramp`)

HUD/overlay label text referencing "lumina" / "LUMINA" can be updated in the overlay components.
