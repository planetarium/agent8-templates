# Project Structure

## ⚠️ Pre-Built Game — Do NOT Recreate on First Prompt

**You MUST on first prompt:**
1. Read existing code → report current implementation to user
2. Ask what changes the user wants
3. Deploy CrossRamp (MANDATORY — never skip):
   - Call `read_gameserver_sdk_v2`
   - Call `read_gameserver_sdk_crossramp`
   - Verify `.crossramp` `asset_keys` matches `server.ts` (`$asset.mint('ember', ...)`)

**You MUST NOT on first prompt:**
- Generate assets, redesign overlays, rewrite GameScene, or modify any code without user request

---

## Current Game: Dragon Forge

| Element | Implementation |
|---------|---------------|
| Theme | Volcanic / Dragon — player is a fire dragon, enemies are magma golems, boss is an obsidian demon |
| Player | Fire dragon sprite; virtual joystick movement; auto-fires dragon fire bolts; spread shot (1/2/3-way) power-up; shield power-up; keyboard arrow key support |
| Enemies | 4 variants: normal magma golem, fast (orange tint, 1.6× speed), tank (brown tint, 2.5× HP, slow), sniper (red tint, fast-shooting, range-preferring); boss every 5th wave (obsidian demon, spread shot, side-sway pattern) |
| Drops | Ember (currency, 70% drop), Crystal (power-up: spread shot or shield + 2 embers, 15%), Life (HP restore, 15%) |
| Currency | `ember` — collected in-game, minted to blockchain via `claimStardust(amount)`. Exchange: 10 embers = 1 DFT (Dragon Forge Token) |
| Score | Wave-scaled points per kill; boss = 5000 + wave×500; leaderboard saved server-side |
| UI | TitleOverlay (volcanic red/orange, "DRAGON FORGE" title, ember balance display, DFT exchange hint); HUDOverlay (score/wave/ember top bar, fire orb HP bottom-left); GameOverOverlay (defeated screen, stats, forge/retry/menu buttons); WalletOverlay (CrossRamp exchange UI) |
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
│       ├── TitleScene.ts    [CHANGE] volcanic bg scroll, dragon float, ember particles
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
server/src/server.ts         [CHANGE] claimStardust, getStardustBalance, saveHighScore, getLeaderboard, getGameConfig
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
1. `server/src/server.ts` → change `$asset.mint('ember', amount)` and `$asset.get('ember')` to new key
2. `server/src/server.ts` → update `getGameConfig()` `collectibleName` and `tokenSymbol` to match
3. `.crossramp` → update `asset_keys: ["<new-key>"]` (re-run `read_gameserver_sdk_crossramp`)

HUD/overlay label text referencing "ember" can be updated in the overlay components.
