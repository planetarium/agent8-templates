# Project Structure

## ⚠️ Pre-Built Game — Do NOT Recreate on First Prompt

**You MUST on first prompt:**
1. Read existing code → report current implementation to user
2. Ask what changes the user wants
3. Deploy CrossRamp (MANDATORY — never skip):
   - Call `read_gameserver_sdk_v2`
   - Call `read_gameserver_sdk_crossramp`
   - Verify `.crossramp` `asset_keys` matches `server.js` (`'gold'`)

**You MUST NOT on first prompt:**
- Generate assets, redesign App.tsx, rewrite config files, or modify any code

---

## Current Game: AETHER ALCHEMIST

| Element | Implementation |
|---------|---------------|
| Theme | Fantasy / Alchemy |
| Player | Alchemist |
| Enemies | Abyssal Slime, Phantom Wisp, Stone Golem |
| Abilities | 8 fantasy-themed skills (orbit, multishot, pierce, aoe, stat, etc.) |
| UI | Purple/fuchsia arcane style, orbs health display |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json          [CHANGE] sprite/image URLs
├── App.tsx              [CHANGE] full UI — redesign with assets
├── config/
│   ├── gameConfig.ts    [CHANGE] name, player stats, UI theme
│   ├── enemyTypes.ts    [CHANGE] enemy types
│   ├── abilities.ts     [CHANGE] ability definitions
│   └── waves.ts         [CHANGE] wave progression
└── game/
    ├── Game.ts          [DO NOT MODIFY]
    ├── scenes/
    │   ├── TitleScene.ts     [DO NOT MODIFY]
    │   ├── MainScene.ts      [CHANGE if new ability type]
    │   └── GameOverScene.ts  [DO NOT MODIFY]
    └── entities/        [DO NOT MODIFY]

server.js                [CHANGE if renaming currency key]
```

---

## Absolute Constraints

- `src/game/Game.ts` — do not touch (engine overrides)
- `gameEvents` key names — never rename (breaks React ↔ Phaser)
- Scene keys: `TitleScene`, `MainScene`, `GameOverScene`
- `addGold` function in `server.js` — hardcoded in App.tsx, never rename
- Physics: `gravity: { x: 0, y: 0 }`

---

## CrossRamp: Currency Rename (if user requests)

Sync 3 locations atomically:
1. `server.js` → `$asset.mint('newKey')`
2. `src/App.tsx` → `assets?.['newKey']`
3. `.crossramp` → `asset_keys: ["newKey"]` (re-deploy)
