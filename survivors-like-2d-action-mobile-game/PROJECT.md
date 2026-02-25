# [PROJECT TITLE]

## Project Summary

[THIS IS TEMPLATE PROJECT, PLEASE UPDATE HERE]

This project is a boilerplate for building Vampire Survivors-like 2D top-down mobile games. It is built with Phaser 3 and React, and is designed so that an AI agent can receive a game concept and fully recreate the visual theme, enemy types, skill system, wave design, and UI — all without touching the core engine. The same boilerplate can produce entirely different games depending on the concept applied.

## Implementation Strategy

- [THIS IS TEMPLATE PROJECT, PLEASE UPDATE HERE]

## Implemented Features

- [THIS IS TEMPLATE PROJECT, PLEASE UPDATE HERE]

## File Structure Overview

### src/main.tsx

- Entry point for the application
- Sets up React rendering with React 18's createRoot API

### src/App.tsx

- Root React component — manages game state (TITLE / PLAYING / GAMEOVER) and all UI overlays
- HUD (health, XP bar, gold), level-up ability modal, quit modal, floating joystick
- Communicates with Phaser scenes via `gameEvents` (EventTarget)

### src/components/GameComponent.tsx

- Mounts the Phaser canvas into the React DOM

### src/components/AbilityIcon.tsx

- Icon lookup map for level-up ability cards (lucide-react icons by name string)

### src/config/gameConfig.ts

- Game name, subtitle, player stats, UI theme tokens (accent color, healthStyle, HUD layout, etc.)
- **Update this file when starting a new game concept**

### src/config/enemyTypes.ts

- Defines all enemy types: sprite, size, speed, HP, behavior (`chase` / `swarm` / `tank` / `charge` / `ranged`), spawn weight
- **Replace with concept-appropriate enemy types**

### src/config/abilities.ts

- Defines all level-up skills: name, icon, rarity, colorScheme, and `AbilityEffect` (stat / multishot / pierce / aoe / custom)
- **Design entirely new abilities per concept — invent new effect types as needed**

### src/config/waves.ts

- 10-wave progression: spawn interval, max concurrent enemies, per-wave enemy weight overrides
- **Redesign the difficulty curve per concept**

### src/assets.json

- Centralized repository for all image and spritesheet URLs

### src/game/Game.ts

- Phaser game configuration and critical engine overrides (setDisplaySize, setScale, Tween interception)
- **Do not modify**

### src/game/scenes/TitleScene.ts

- Displays the title background; listens for `startGameFromUI` event from React

### src/game/scenes/MainScene.ts

- Core game orchestrator: player movement, enemy spawning via WaveSystem, auto-fire, collision handling, level-up logic
- Applies ability effects from `handleSelectAbility`

### src/game/scenes/GameOverScene.ts

- Listens for `restartGameFromUI` event and transitions back to TitleScene

### src/game/entities/Player.ts

- `createPlayer` and `registerPlayerAnimations` helper functions

### src/game/entities/Enemy.ts

- `createEnemy` (EnemyType-driven) and `updateEnemyBehavior` helper functions

### src/game/entities/Projectile.ts

- `createProjectile` helper — fires a physics projectile with configurable damage, speed, size, tint

### src/game/systems/WaveSystem.ts

- Time-based wave progression; weighted random enemy type selection per wave

### server.js

- Agent8 GameServer function: `addGold` — saves collected gold to the blockchain

### docs/project-2d-rules.md

- AI agent instructions: concept intake procedure, full recreation checklist, skill design guide, UI redesign guide, do-not-modify rules, technical rules
