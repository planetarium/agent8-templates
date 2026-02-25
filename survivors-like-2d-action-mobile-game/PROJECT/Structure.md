# Project Structure

Files are marked as **[CHANGE]** (must be replaced per concept) or **[DO NOT MODIFY]** (engine/infrastructure).

```
src/
├── assets.json                          [CHANGE] All sprite/image URLs — replace every asset
├── App.tsx                              [CHANGE] Full UI redesign: HUD layout, colors, modals, joystick style
├── main.tsx                             [DO NOT MODIFY]
│
├── components/
│   ├── GameComponent.tsx                [DO NOT MODIFY] Mounts Phaser canvas into React
│   └── AbilityIcon.tsx                  [CHANGE if new ability] Add icon entries to ICON_MAP
│
├── config/                              ← ALL 4 FILES MUST BE REPLACED
│   ├── gameConfig.ts                    [CHANGE] Game name, subtitle, player stats, UI theme tokens
│   ├── enemyTypes.ts                    [CHANGE] Min 3 enemy types with behavior, stats, sprite
│   ├── abilities.ts                     [CHANGE] Min 6 abilities — invent new effect types
│   └── waves.ts                         [CHANGE] 10-wave progression, difficulty curve
│
└── game/
    ├── Game.ts                          [DO NOT MODIFY] Engine overrides — modifying breaks everything
    │
    ├── scenes/
    │   ├── TitleScene.ts                [DO NOT MODIFY] Listens for startGameFromUI event
    │   ├── MainScene.ts                 [CHANGE if new ability] Add new effect type logic in handleSelectAbility
    │   └── GameOverScene.ts             [DO NOT MODIFY] Listens for restartGameFromUI event
    │
    ├── systems/
    │   └── WaveSystem.ts                [DO NOT MODIFY] Time-based wave engine
    │
    └── entities/
        ├── Player.ts                    [DO NOT MODIFY] createPlayer / registerPlayerAnimations
        ├── Enemy.ts                     [DO NOT MODIFY] createEnemy / updateEnemyBehavior
        └── Projectile.ts               [DO NOT MODIFY] createProjectile physics helper

server.js                                [DO NOT MODIFY] Agent8 addGold blockchain function
docs/project-2d-rules.md                 [DO NOT MODIFY] Full AI agent ruleset (read this)
```

## Summary

| Category | Files | Action |
|----------|-------|--------|
| Config (concept data) | `config/*.ts` | Replace all 4 |
| Assets | `assets.json` | Replace all URLs |
| UI | `App.tsx` | Full redesign |
| New ability icons | `AbilityIcon.tsx` | Add to ICON_MAP |
| New ability logic | `MainScene.ts` | Add to handleSelectAbility |
| Engine / Infrastructure | Everything else | Do not touch |
