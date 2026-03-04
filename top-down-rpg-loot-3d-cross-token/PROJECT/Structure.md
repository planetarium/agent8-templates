# Project Structure

## Project Summary

This project is a boilerplate for 3D quarter-view dungeon-crawler RPG games with CROSS blockchain token integration. Built with React Three Fiber, vibe-starter-3d, and @react-three/rapier, it features melee combat, enemy waves with boss floors, gem loot drops, and a Wallet screen for CROSS token exchange. An AI agent can receive a game concept and fully recreate the visual theme, enemy types, environment, and UI — all without touching the core engine.

Files are marked as **[CHANGE]** (must be replaced per concept) or **[DO NOT MODIFY]** (engine/infrastructure).

> **Critical**: `assets.json`, `Enemy.tsx`, `LootGem.tsx`, `DungeonRoom.tsx`, and UI screens are a **set**. When you replace assets/visuals, you must also redesign all 5 UI screens to match. **Do both on the first prompt** — do not defer UI to a later prompt.

## Source Layout

```
src/
├── assets.json                          [CHANGE] Character/animation GLB URLs
├── App.tsx                              [DO NOT MODIFY] GameServerProvider + PreloadScene/GameScene switch
├── App.css / index.css                  [CHANGE if theme]
│
├── constants/
│   ├── character.ts                     [DO NOT MODIFY] CharacterState enum
│   └── rigidBodyObjectType.ts           [DO NOT MODIFY] Physics object types
│
├── stores/
│   ├── gameStore.ts                     [CHANGE] Game state, enemy wave design, gem values
│   ├── localPlayerStore.ts              [DO NOT MODIFY] Player position tracking
│   ├── multiPlayerStore.ts              [DO NOT MODIFY] Multiplayer refs
│   └── playerActionStore.ts             [DO NOT MODIFY] Input action flags
│
├── utils/
│   └── enemyPositionRegistry.ts         [DO NOT MODIFY] Enemy position Map for attack detection
│
├── components/
│   ├── r3f/
│   │   ├── GameSceneCanvas.tsx          [DO NOT MODIFY] Canvas + Physics + QuarterViewController
│   │   ├── Experience.tsx               [CHANGE] Add/remove 3D entities, lighting, floor-clear logic
│   │   ├── Player.tsx                   [CHANGE] Connect playerHp, death state, attack animations
│   │   ├── Floor.tsx                    [CHANGE] Dungeon floor material/texture
│   │   ├── DungeonRoom.tsx              [CHANGE] Walls, lighting atmosphere
│   │   ├── Enemy.tsx                    [CHANGE] Enemy visual (capsule → character model)
│   │   ├── LootGem.tsx                  [CHANGE] Gem visual and colors per rarity
│   │   └── MapPhysicsReadyChecker.tsx   [DO NOT MODIFY] Physics init raycasting
│   │
│   ├── scene/
│   │   ├── GameScene.tsx                [DO NOT MODIFY] Layout container (NO state hooks)
│   │   └── PreloadScene.tsx             [CHANGE] Loading screen title/theme
│   │
│   └── ui/
│       ├── GameSceneUI.tsx              [CHANGE if new phases] Phase-based overlay router
│       ├── InputController.tsx          [CHANGE if new actions] Joystick + keyboard + ATTACK button
│       ├── LoadingScreen.tsx            [CHANGE if theme] Physics init loading spinner
│       ├── TitleScreen.tsx              [CHANGE] Title screen — MANDATORY with assets
│       ├── HUDOverlay.tsx               [CHANGE] In-game HUD — MANDATORY with assets
│       ├── GameOverScreen.tsx           [CHANGE] Game over panel — MANDATORY with assets
│       ├── WalletScreen.tsx             [CHANGE] Exchange info + CROSS Mini Hub button
│       └── CrossRampOverlay.tsx         [CHANGE if theme] CROSS iframe overlay
│
server/
└── src/server.ts                        [CHANGE if token] claimGems, token name/ratio

.crossramp                               [CHANGE] CrossRamp deployment metadata (create via SDK tool)
```

## Game Phase Flow

title → playing → gameover ↔ wallet ↔ crossramp

## Key Architecture Notes

- **Zustand**: all game state in `useGameStore` — no useState in game components
- **Canvas rule**: HTML/React components NEVER inside `<Canvas>` — only Three.js JSX
- **RigidBodyObject rule**: use `RigidBodyObject` from vibe-starter-3d for interactive entities
- **Enemy movement**: `setLinvel()` each frame toward player position from `useLocalPlayerStore`
- **Attack detection**: distance check against `enemyPositionRegistry` (Map updated by Enemy each frame)
- **Gem collection**: sensor RigidBody `onIntersectionEnter` → `collectGem()` in store
- **Floor clear**: `enemies.length === 0` in Experience → 2s timeout → `nextFloor()`
- **CROSS Mini Hub**: `server.getCrossRampShopUrl()` → iframe in CrossRampOverlay
