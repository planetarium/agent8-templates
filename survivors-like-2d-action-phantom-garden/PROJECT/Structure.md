# Project Structure

## 🚨 CROSSRAMP — FIRST PROMPT MANDATORY

> **NEVER skip CrossRamp deployment. Required on every first prompt without exception.**

- Call `read_gameserver_sdk_v2`
- Call `read_gameserver_sdk_crossramp`
- Verify `.crossramp` `asset_keys` matches server asset key: `credits`

---

## ⚠️ Pre-Built Game — Do NOT Recreate on First Prompt

**You MUST on first prompt:**
1. Read existing code → report current implementation to user
2. Ask what changes the user wants
3. Deploy CrossRamp (MANDATORY):
   - Call `read_gameserver_sdk_v2`
   - Call `read_gameserver_sdk_crossramp`
   - Verify `.crossramp` `asset_keys` matches `server.js` `$asset.mint('credits')` key

**You MUST NOT on first prompt:**
- Generate assets, redesign App.tsx, rewrite config files, or modify any code

---

## Current Game: PHANTOM GARDEN

| Element | Implementation |
|---------|---------------|
| Theme | Forest Spirit defending enchanted grove vs cursed creatures |
| Player | Forest Spirit (`spirit` spritesheet) — thorn bolt auto-fire, 180 speed, 3 HP |
| Enemies | Shadow Imp (chase), Cursed Wisp (swarm, fast), Blighted Treant (tank, boss) |
| Drop/Currency | `credits` (Enchanted Petals) |
| Score | XP-based level system with wave progression |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json                          [CHANGE] sprite/image URLs
├── App.tsx                              [CHANGE] UI HUD, modals, layout
├── main.tsx                             [DO NOT MODIFY]
│
├── components/
│   ├── GameComponent.tsx                [DO NOT MODIFY] Phaser canvas mount
│   └── AbilityIcon.tsx                  [CHANGE if new ability] ICON_MAP
│
├── config/
│   ├── gameConfig.ts                    [CHANGE] name, stats, UI theme tokens
│   ├── enemyTypes.ts                    [CHANGE] enemy definitions
│   ├── abilities.ts                     [CHANGE] level-up abilities
│   └── waves.ts                         [CHANGE] wave progression
│
└── game/
    ├── Game.ts                          [DO NOT MODIFY]
    ├── scenes/
    │   ├── TitleScene.ts                [DO NOT MODIFY]
    │   ├── MainScene.ts                 [CHANGE if new ability type]
    │   └── GameOverScene.ts             [DO NOT MODIFY]
    ├── systems/
    │   └── WaveSystem.ts                [DO NOT MODIFY]
    └── entities/
        ├── Player.ts                    [DO NOT MODIFY]
        ├── Enemy.ts                     [DO NOT MODIFY]
        └── Projectile.ts               [DO NOT MODIFY]

server.js                                [CHANGE if renaming currency] asset key: 'credits'
```

---

## Absolute Constraints

- `src/game/Game.ts` — do not modify
- `gameEvents` event key names — hardcoded in both React and Phaser
- Scene keys: `TitleScene`, `MainScene`, `GameOverScene`
- Physics config: `gravity: { x: 0, y: 0 }`
- `addGold` server function name — hardcoded in App.tsx
- setDisplaySize() 모든 이미지/스프라이트에 필수
- Tween에서 scaleX/scaleY 금지 → displayWidth/displayHeight 사용

---

## CrossRamp: Currency Rename (if user requests)

If renaming `'credits'` to another key, sync 3 locations atomically:
1. `server.js` → `$asset.mint('newKey')` / `$asset.get('newKey')`
2. `src/App.tsx` → `assets?.['newKey'] || 0`
3. `.crossramp` → `asset_keys: ["newKey"]` (re-deploy CrossRamp)
