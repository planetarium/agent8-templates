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
   - Verify `.crossramp` `asset_keys: ["magic_flour"]` matches `server.js`

**You MUST NOT on first prompt:**
- Generate assets, redesign App.tsx, rewrite config files, or modify any code

---

## Current Game: ABYSSAL BAKERY

| Element | Implementation |
|---------|---------------|
| Theme | Culinary/Food World — kitchen combat |
| Player | Combat Baker (baker sprite, throws projectiles) |
| Enemies | Moldy Croissant (chase), Baguette, Doughnut — food monsters |
| Abilities | Knead Faster, Sugar Rush, Hearty Meal + dough_trap, multishot, pierce, aoe |
| UI Theme | Pink (#ec4899), hearts health display, top HUD |
| Currency | Magic Flour (magic_flour) |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json                          [CHANGE if new assets needed] Sprite/image URLs
├── App.tsx                              [CHANGE if UI redesign requested]
├── main.tsx                             [DO NOT MODIFY]
│
├── components/
│   ├── GameComponent.tsx                [DO NOT MODIFY]
│   └── AbilityIcon.tsx                  [CHANGE if new ability icons needed]
│
├── config/
│   ├── gameConfig.ts                    [CHANGE if concept overhaul] Game name, player stats, UI tokens
│   ├── enemyTypes.ts                    [CHANGE if new enemies] ENEMY_TYPES array
│   ├── abilities.ts                     [CHANGE if new abilities] ABILITIES array + AbilityEffect types
│   └── waves.ts                         [CHANGE if wave rebalance] WAVES progression
│
└── game/
    ├── Game.ts                          [DO NOT MODIFY]
    ├── scenes/
    │   ├── TitleScene.ts                [DO NOT MODIFY]
    │   ├── MainScene.ts                 [CHANGE if new ability logic] handleSelectAbility
    │   └── GameOverScene.ts             [DO NOT MODIFY]
    ├── systems/
    │   └── WaveSystem.ts                [DO NOT MODIFY]
    └── entities/
        ├── Player.ts                    [DO NOT MODIFY]
        ├── Enemy.ts                     [DO NOT MODIFY]
        └── Projectile.ts               [DO NOT MODIFY]

server.js                                [CHANGE if currency renamed] addGold — do NOT rename function
```

---

## Absolute Constraints

- `src/game/Game.ts` — do not modify (engine overrides)
- `gameEvents` event keys — do not rename (React ↔ Phaser bridge)
- Scene keys: `TitleScene`, `MainScene`, `GameOverScene`
- `server.js` function name `addGold` — never rename (called via `remoteFunction('addGold')`)
- Phaser gravity: `{ x: 0, y: 0 }`

---

## CrossRamp: Currency Rename (if user requests)

If user wants to rename "Magic Flour" to something else, sync 3 locations:

```
1. server.js       → $asset.mint('새키', amount) / $asset.get('새키')
2. App.tsx         → assets?.['새키'] || 0
3. .crossramp      → asset_keys: ["새키"]  (re-run read_gameserver_sdk_crossramp)
```
