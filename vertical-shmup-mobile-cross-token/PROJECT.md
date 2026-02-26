# Arcade Vertical Shmup — Mobile (CROSS Token)

## Project Summary

This is an **arcade-style vertical shoot-em-up (shmup) 2D mobile game boilerplate** built with React + Phaser 3. It provides the infrastructure foundation for creating a high-quality mobile shmup in the tradition of Raiden, 1943, and DoDonPachi — adapted for touchscreen controls.

The template ships as bare scaffolding (Phaser scene with no gameplay). The AI agent builds the complete game from this foundation using the architecture defined in `PROJECT/`.

**Blockchain integration**: CROSS Token via Agent8 SDK — players earn in-game currency (concept-themed) which is saved on-chain. The blockchain layer is technical infrastructure, not a game world element.

## Implementation Strategy

### Architecture: React + Phaser Hybrid

React handles all UI/HUD; Phaser handles all gameplay. Communication via a shared `EventTarget` (`gameEvents`).

```
React
  ├── HUD: score, lives, bomb count, stage, power-up display
  ├── Boss health bar (appears during boss fights)
  ├── Touch control layer (full-screen drag → ship movement)
  └── Modals: title, stage clear, game over, pause

      ↕ gameEvents

Phaser (MainScene)
  ├── Player ship (lerp-follows touch position, auto-fires up)
  ├── Parallax scrolling background (2-layer TileSprite)
  ├── Enemy waves via StageSystem
  ├── Enemy bullet patterns (aimed/spread/circle/spiral)
  ├── Boss fight with phase system
  ├── Power-up drops + pickup
  └── Object-pooled bullet groups
```

**Scene flow**: `TitleScene` → `MainScene` (all stages + boss inside) → `GameOverScene`

### Mobile Controls

The entire screen surface is the control area — no joystick. Player drags finger; ship smoothly lerps to touch position. Bomb button is a fixed corner button sized for thumb access.

### Stage Progression

3+ stages. Each stage: enemy waves (60–120s) → boss fight. Boss has 2–3 attack phases. Stage clear → coin reward → next stage.

## Implemented Features (Template — Build Everything)

The current template provides:
- React + Vite + TypeScript build environment
- Phaser 3 with engine overrides (setDisplaySize/setScale/Tween interceptors)
- TitleScene and GameOverScene (event-driven state machine)
- GameComponent (Phaser mount)
- Agent8 server.js (blockchain addCoin)

**Everything gameplay-related must be built** following `PROJECT/Status.md`.

## File Structure Overview

See `PROJECT/Structure.md` for the complete annotated file map.

| Layer | Key Files | Status |
|-------|-----------|--------|
| Infrastructure | `Game.ts`, `TitleScene.ts`, `GameOverScene.ts`, `GameComponent.tsx`, `server.js` | Ready (fix gravity in Game.ts) |
| Config | `config/gameConfig.ts`, `enemyTypes.ts`, `bulletPatterns.ts`, `powerUpTypes.ts`, `stageConfig.ts` | Must build |
| Entities | `entities/PlayerShip.ts`, `EnemyShip.ts`, `Bullet.ts`, `PowerUp.ts` | Must build |
| Systems | `systems/ScrollSystem.ts`, `StageSystem.ts`, `BossSystem.ts` | Must build |
| Core scene | `scenes/MainScene.ts` | Must build |
| UI | `App.tsx`, `components/PowerUpIndicator.tsx` | Must redesign (with assets) |
| Assets | `assets.json` | Must replace |

## AI Agent Quick-Start

1. Read `PROJECT/Context.md` — architecture, design principles
2. Read `PROJECT/Requirements.md` — gameEvents API, asset rules, code patterns
3. Read `PROJECT/Status.md` — ordered build checklist
4. Read `docs/project-2d-rules.md` — full AI agent ruleset (concept selection, technical rules)
5. Execute steps in order from `PROJECT/Status.md`

**First action**: Fix `gravity: { x: 0, y: 2000 }` → `{ x: 0, y: 0 }` in `src/game/Game.ts`

### src/main.tsx
- React 18 entry point with createRoot

### src/App.tsx
- Root component — must be fully redesigned with HUD, touch overlay, and all modal screens

### src/components/GameComponent.tsx
- Mounts Phaser canvas into React DOM

### src/game/Game.ts
- Phaser engine configuration with setDisplaySize/setScale/Tween overrides
- **Modify once**: change gravity to `{ x: 0, y: 0 }` — then do not touch again

### src/game/scenes/MainScene.ts
- Core game scene to be built — wires all systems and entities together

### src/App.css
- Component-specific styles for App — update with concept theme
