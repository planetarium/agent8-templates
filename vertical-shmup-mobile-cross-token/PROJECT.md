# Arcade Vertical Shmup — Mobile (CROSS Token)

## Project Summary

This is an **arcade-style vertical shoot-em-up (shmup) 2D mobile game boilerplate** built with React + Phaser 3. The template provides only the minimum Phaser wiring and React mount — zero gameplay exists. The AI agent builds the entire game from scratch.

**Starting point**: This is a copy of `2d-phaser-basic` with no game modifications. `MainScene.ts` contains only a sky background and green ground rectangle as placeholder.

**Blockchain integration**: CROSS Token via Agent8 SDK — players earn in-game currency saved on-chain. The blockchain layer is technical infrastructure, not a game world element.

## What Actually Exists

| File | Status |
|------|--------|
| `src/game/Game.ts` | Phaser engine overrides ✓ — but `gravity: y:2000` must be fixed, scene list must be updated |
| `src/game/scenes/MainScene.ts` | Placeholder sky + ground only — completely replace |
| `src/App.tsx` | Bare wrapper div — fully redesign |
| `src/assets.json` | Empty `{ "sprites": {} }` — replace all |
| `src/components/GameComponent.tsx` | Mounts Phaser ✓ — do not modify |
| `src/main.tsx` | React 18 entry ✓ — do not modify |

**Nothing else exists** — all scenes, entities, systems, configs, and `server.js` must be created.

## Architecture

React handles all UI/HUD. Phaser handles all gameplay. Communication via `gameEvents` (EventTarget singleton in `src/game/events.ts` — must be created).

```
React (App.tsx)
  ├── HUD: score, multiplier, lives, bombs, stage
  ├── Boss health bar (during boss fight only)
  ├── Touch overlay: full-screen transparent div → ship movement
  └── Modals: title, stage clear, game over

      ↕ gameEvents (src/game/events.ts)

Phaser (MainScene)
  ├── Player ship (lerp to touch, auto-fire up)
  ├── 2-layer parallax scroll
  ├── Enemy waves (StageSystem)
  ├── Enemy bullet patterns
  ├── Boss fight (BossSystem)
  └── Power-up drops + pickup
```

**Scene flow**: `TitleScene` → `MainScene` (all stages) → `GameOverScene`

## First Actions (Before Any Game Code)

1. Create `src/game/events.ts` — shared EventTarget
2. Fix `src/game/Game.ts` — gravity `{ x:0, y:0 }` + scene list `[TitleScene, MainScene, GameOverScene]`

## AI Agent Quick-Start

1. `PROJECT/Context.md` — architecture, mission, what exists vs what to build
2. `PROJECT/Requirements.md` — complete gameEvents API, asset rules, code patterns with examples
3. `PROJECT/Status.md` — 23-step ordered build checklist
4. `docs/project-2d-rules.md` — full AI agent ruleset (concept selection, technical rules)
5. `PROJECT/Structure.md` — file map with TypeScript interface specs

## File Structure Overview

### src/main.tsx
React 18 entry point (do not modify)

### src/App.tsx
Root component — must be fully redesigned with HUD, touch overlay, and all modal screens on the first prompt

### src/components/GameComponent.tsx
Mounts Phaser canvas into React DOM (do not modify)

### src/game/events.ts
**Must create** — `export const gameEvents = new EventTarget();`

### src/game/Game.ts
Phaser engine config with setDisplaySize/setScale/Tween overrides. **Modify once**: fix gravity to `{ x:0, y:0 }` and update scene list — then freeze permanently.

### src/game/scenes/
- `TitleScene.ts` — **create**: title screen, listens for `startGameFromUI`
- `MainScene.ts` — **replace**: full game scene wiring all systems
- `GameOverScene.ts` — **create**: game over screen, listens for `restartGameFromUI`

### src/config/
All 5 files must be created: `gameConfig.ts`, `enemyTypes.ts`, `bulletPatterns.ts`, `powerUpTypes.ts`, `stageConfig.ts`

### server.js
**Must create** — Agent8 `addCoin` blockchain function
