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
   - Verify `.crossramp` `asset_keys` matches `server.ts` currency key (`shards`)

**You MUST NOT on first prompt:**
- Generate assets, redesign overlays, rewrite config files, or modify any code

---

## Current Game: CELESTIAL SCAVENGERS

| Element | Implementation |
|---------|---------------|
| Theme | Celestial / mystical sky — floating islands, ancient temples, ethereal atmosphere |
| Player | Celestial phoenix bird (gold & azure plumage), auto-shoots feather bolts upward, virtual joystick + keyboard movement |
| Enemies | Corrupted stone gargoyles (normal), massive stone golem (boss every 5 waves); boss sinusoidal movement + spread shot |
| Drops | `shards` (80%, +1 each), `crystal` (12%, +3 shards + 200 pts), `life` (8%, restore 1 HP) |
| Score | +120–pts per enemy (scales with wave), +6000–pts per boss; stored in localStorage as `celestial_best` |
| Waves | Wave every 8 s; count = 3 + floor(wave × 1.5); boss wave every 5th |
| Abilities | Auto-fire (220 ms cooldown), invincibility frames (2.2 s) on hit, camera shake on boss kill |
| UI | TitleOverlay: celestial phoenix + MYSTICAL ARCADE badge; HUDOverlay: HP / score / wave / shards; GameOverOverlay; WalletOverlay: CST token exchange |
| Currency | `shards` — minted via `$asset.mint('shards', amount)` in server.ts |
| Token Symbol | `CST` (Celestial Shard Token); collectible display name: `SHARDS` |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json                          [CHANGE] sprite URLs (player/enemy/boss/shards/crystal/playerBullet/enemyBullet/bg)
├── App.tsx                              [DO NOT MODIFY] GameServer.Provider wrapper
├── App.css                              [CHANGE if theme] global reset
│
├── game/
│   ├── Game.ts                          [DO NOT MODIFY] Phaser config + engine overrides
│   ├── EventBus.ts                      [DO NOT MODIFY] Phaser ↔ React event bus
│   └── scenes/
│       ├── BootScene.ts                 [DO NOT MODIFY] auto-preloads all assets.json keys
│       ├── TitleScene.ts                [CHANGE if theme] scrolling BG + floating ship animation
│       ├── GameScene.ts                 [CHANGE] wave logic, enemy AI, boss pattern, drops
│       ├── GameOverScene.ts             [DO NOT MODIFY] emits SCENE_CHANGE only
│       └── WalletScene.ts               [DO NOT MODIFY] emits SCENE_CHANGE only
│
├── components/
│   ├── GameComponent.tsx                [DO NOT MODIFY] Phaser mount + EventBus listener
│   └── overlays/
│       ├── LoadingOverlay.tsx/css        [CHANGE if logo]
│       ├── TitleOverlay.tsx/css          [CHANGE] CELESTIAL SCAVENGERS title screen
│       ├── HUDOverlay.tsx/css            [CHANGE] in-game HUD
│       ├── GameOverOverlay.tsx/css       [CHANGE] game-over panel
│       ├── WalletOverlay.tsx/css         [CHANGE] CST exchange + CrossRamp
│       └── CrossRampOverlay.tsx/css      [CHANGE if theme]
│
server/
└── src/server.ts                        [CHANGE] claimStardust / getStardustBalance / getGameConfig
```

---

## Absolute Constraints

- `src/game/Game.ts` — never modify (Phaser engine overrides, setDisplaySize/Tween patches)
- `src/game/scenes/BootScene.ts` — never modify; add assets via `assets.json` only
- EventBus event keys: `SCENE_CHANGE`, `HUD_UPDATE`, `GAME_OVER`, `BOOT_PROGRESS`, `OPEN_CROSS_RAMP`, `STARDUST_BALANCE`
- Scene keys: `BootScene`, `TitleScene`, `GameScene`, `GameOverScene`, `WalletScene`
- `src/components/GameComponent.tsx` — never modify
- Phaser gravity must stay `{ x: 0, y: 0 }`
- `server.ts` function names `claimStardust` and `getStardustBalance` — never rename (GameComponent hardcodes these)
- Tween: use `displayWidth`/`displayHeight` only — `scaleX`/`scaleY` are forbidden
- All images/sprites must call `setDisplaySize()` immediately after creation

---

## CrossRamp: Currency Rename (if user requests)

3-way sync required:
1. `server/src/server.ts` → change `$asset.mint('shards', amount)` and `$asset.get('shards')` to new key
2. `src/components/overlays/WalletOverlay.tsx` → update currency key reference if hardcoded
3. `.crossramp` → update `asset_keys: ["new-key"]` (re-run `read_gameserver_sdk_crossramp`)

Also update `getGameConfig()` return values (`tokenSymbol`, `collectibleName`) in `server.ts` to match.
