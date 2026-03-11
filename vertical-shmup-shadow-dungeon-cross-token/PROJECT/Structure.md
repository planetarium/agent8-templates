# Project Structure

## 🚨 CROSSRAMP — FIRST PROMPT MANDATORY

> **NEVER skip CrossRamp deployment. Required on every first prompt without exception.**

- Call `read_gameserver_sdk_v2`
- Call `read_gameserver_sdk_crossramp`
- Verify `.crossramp` `asset_keys` matches server asset key (`soulgem`)

---

## ⚠️ Pre-Built Game — Do NOT Recreate on First Prompt

**You MUST on first prompt:**
1. Write `.crossramp` file with token config
2. Call `read_gameserver_sdk_v2` then `read_gameserver_sdk_crossramp` → deploys CrossRamp
3. Read `server/src/server.ts` → confirm asset key matches `.crossramp`
4. Generate EXACTLY 2 images: drop item icon + token logo → update `assets.json`
5. Run `bun run build`

**You MUST NOT on first prompt:**
- Regenerate player / enemy / bullet / background images — game is already built
- Rewrite GameScene.ts, overlays, or config files

---

## Current Game: SHADOW DUNGEON

| Element | Implementation |
|---------|---------------|
| Theme | Gothic dungeon shooter — lone necromancer battles waves of undead and shadow creatures descending from above |
| Player | Necromancer character (60×60px), moves via on-screen joystick, shoots upward |
| Enemies | Wave-based undead/shadow creatures; boss wave every 5th wave |
| Drop Item | Soul Gem (`soulgem`) — collected from defeated enemies |
| Currency | `soulgem` token · exchange rate 100 soulgems = 1 token (from `getGameConfig()`) |
| Score | Wave-based survival score; best score/wave saved via `saveHighScore()` |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json              [CHANGE] image URLs
├── App.tsx                  [DO NOT MODIFY]
├── game/
│   ├── Game.ts              [DO NOT MODIFY]
│   ├── EventBus.ts          [DO NOT MODIFY]
│   └── scenes/
│       ├── BootScene.ts     [DO NOT MODIFY]
│       ├── TitleScene.ts    [CHANGE] title assets
│       ├── GameScene.ts     [CHANGE] gameplay logic
│       ├── GameOverScene.ts [CHANGE]
│       └── WalletScene.ts   [DO NOT MODIFY]
└── components/
    ├── GameComponent.tsx    [DO NOT MODIFY]
    └── overlays/            [CHANGE] UI overlays
server/src/server.ts         [CHANGE] asset key, exchange rate
```

---

## Absolute Constraints

- NEVER use scaleX/scaleY in tweens → use displayWidth/displayHeight only
- ALWAYS call setDisplaySize() on every image/sprite
- EventBus event key names must NOT change
- Scene keys: BootScene, TitleScene, GameScene, GameOverScene, WalletScene — never rename

---

## CrossRamp: Currency Rename (if user requests)

3-way sync:
1. `server.ts` → `$asset.mint('새키', amount)`
2. `GameScene.ts` → all references to old key
3. `.crossramp` → `asset_keys: ["새키"]`
