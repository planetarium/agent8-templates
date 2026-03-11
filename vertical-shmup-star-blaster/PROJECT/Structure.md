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
   - Verify `.crossramp` `asset_keys` matches `server/src/server.ts` `$asset.mint('stardust')`

**You MUST NOT on first prompt:**
- Generate assets, redesign App.tsx, rewrite config files, or modify any code

---

## Current Game: STAR BLASTER

| Element | Implementation |
|---------|---------------|
| Genre | Arcade vertical shoot-em-up (shmup) mobile |
| Player | Spaceship with auto/tap-fire weapons |
| Enemies | Vertical scrolling enemy waves |
| Currency | Stardust (`stardust` asset key) |
| UI | React overlays (CSS Modules) + Phaser game |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json           [CHANGE] sprite/image URLs
├── App.tsx               [DO NOT MODIFY]
├── game/
│   ├── Game.ts           [DO NOT MODIFY]
│   ├── EventBus.ts       [DO NOT MODIFY]
│   └── scenes/
│       ├── BootScene.ts  [DO NOT MODIFY]
│       ├── TitleScene.ts [CHANGE]
│       ├── GameScene.ts  [CHANGE]
│       ├── GameOverScene.ts [CHANGE]
│       └── WalletScene.ts [CHANGE]
└── components/
    ├── GameComponent.tsx [DO NOT MODIFY]
    └── overlays/         [CHANGE] React UI overlays + CSS Modules
server/src/server.ts      [CHANGE] stardust/asset mint
```

---

## Absolute Constraints

- `src/game/Game.ts` 수정 금지
- Phaser gravity: { x: 0, y: 0 } 유지
- EventBus 이벤트 키 변경 금지
- 씬 키: BootScene, TitleScene, GameScene, GameOverScene, WalletScene 유지
- `setDisplaySize()` 모든 이미지/스프라이트에 필수

---

## CrossRamp: Currency Rename (if user requests)

3-way sync:
1. `server/src/server.ts` → `$asset.mint('새키', amount)`
2. 클라이언트 stardust 참조 → 새키로 업데이트
3. `.crossramp` → `asset_keys: ["새키"]`
