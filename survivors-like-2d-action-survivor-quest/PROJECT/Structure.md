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
   - Verify `.crossramp` `asset_keys` matches `server.js` `$asset.mint('gold')`

**You MUST NOT on first prompt:**
- Generate assets, redesign App.tsx, rewrite config files, or modify any code

---

## Current Game: SURVIVOR QUEST

| Element | Implementation |
|---------|---------------|
| Genre | Vampire Survivors-like 2D mobile action |
| Player | Knight character with auto-shoot projectiles |
| Enemies | Wave-based spawning enemies |
| Currency | Gold coins (`gold` asset key) |
| UI | React overlays (CSS Modules) + Phaser game |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json           [CHANGE] sprite/image URLs
├── config/
│   ├── gameConfig.ts     [CHANGE] game name, player stats, UI theme
│   ├── abilities.ts      [CHANGE] ability definitions
│   ├── enemyTypes.ts     [CHANGE] enemy definitions
│   └── waves.ts          [CHANGE] wave configurations
├── App.tsx               [DO NOT MODIFY]
└── game/
    ├── Game.ts           [DO NOT MODIFY] Phaser engine
    ├── EventBus.ts       [DO NOT MODIFY]
    └── scenes/
        ├── BootScene.ts  [DO NOT MODIFY]
        ├── TitleScene.ts [CHANGE] title screen
        ├── GameScene.ts  [CHANGE] gameplay
        ├── GameOverScene.ts [CHANGE]
        └── WalletScene.ts [CHANGE] CROSS wallet
server.js                 [CHANGE] gold/asset mint
```

---

## Absolute Constraints

- `src/game/Game.ts` 수정 금지
- Phaser gravity: { x: 0, y: 0 } 유지
- EventBus 이벤트 키 변경 금지
- 씬 키: BootScene, TitleScene, GameScene, GameOverScene, WalletScene 유지
- `setDisplaySize()` 모든 이미지/스프라이트에 필수
- Tween에서 scaleX/scaleY 금지 → displayWidth/displayHeight 사용

---

## CrossRamp: Currency Rename (if user requests)

`server.js`의 `$asset.mint('gold')` 키를 변경하면:
1. `server.js` → `$asset.mint('새키', amount)`
2. 클라이언트 gold 참조 코드 → 새키로 업데이트
3. `.crossramp` → `asset_keys: ["새키"]`
