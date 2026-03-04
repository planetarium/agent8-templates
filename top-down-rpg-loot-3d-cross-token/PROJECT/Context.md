# Boilerplate Context

## Critical Rules (Read First)

> **CONCEPT ≠ BLOCKCHAIN**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` are **technical specs only**. They do NOT imply cyberpunk, SF, or any game world. **MUST** read `docs/project-3d-rules.md` Section 1-B and use the combination table as inspiration — but **create an original world concept yourself**. Fully new combinations not in the table are actively encouraged.

> **ASSETS + UI = SET (FIRST PROMPT)**: Asset replacement and UI screen redesign are a **single mandatory pair**. Both must be completed **on the first prompt** — do not defer UI to a follow-up. Never generate assets without immediately redesigning the full UI (TitleScreen, HUDOverlay, GameOverScreen, WalletScreen) to match the chosen concept.

## What This Is

This is a **3D top-down dungeon-crawler loot game** boilerplate (quarter-view perspective). The default theme is "Crystal Dungeon" (knight vs dungeon monsters) — placeholder content only. Every new game built from this template must replace the concept entirely.

## AI Agent Mission

When starting development from this template, you MUST:
1. **Identify the game concept** — use the concept provided by the user, OR invent a fresh one.
2. **Replace all placeholder content** — game name, character models, enemy geometry, dungeon environment, gem colors, UI theme
3. **Follow the 11-step checklist** in `PROJECT/Status.md` immediately

## Architecture

This project uses a **3D architecture**:
- React Three Fiber (Canvas) handles the 3D world
- Zustand (`useGameStore`) manages all game state — phase, floor, HP, enemies, gems
- UI overlays are React components rendered **outside** the Canvas
- Communication: all via Zustand store, no EventBus

```
React (src/components/ui/)
  ├── TitleScreen, HUDOverlay, GameOverScreen
  ├── WalletScreen, CrossRampOverlay
  └── Phase routing via useGameStore.gamePhase

        ↕ Zustand (useGameStore)

React Three Fiber (src/components/r3f/)
  ├── GameSceneCanvas → Canvas → Physics → QuarterViewController
  ├── Experience → DungeonRoom + Floor + Player + Enemy* + LootGem*
  └── Player (R3F) — melee attack, collision detection
```

**Scene flow**: title → playing → gameover ↔ wallet ↔ crossramp

## Tech Stack

- React 18 + TypeScript + Vite
- Three.js + React Three Fiber 8 + @react-three/rapier 1.5
- vibe-starter-3d (QuarterViewController, CharacterRenderer, RigidBodyPlayer)
- Zustand 5 for state management
- nipplejs for mobile joystick
- @agent8/gameserver (GameServerProvider, CROSS integration)

## Absolute Constraints (Do Not Break)

- **HTML components NEVER inside `<Canvas>`** — violates Canvas rendering model. UI goes in `src/components/ui/` only.
- **`RigidBodyObject` rule**: use `RigidBodyObject` from vibe-starter-3d (not raw `RigidBody` from rapier) for interactive game entities.
- **GameScene.tsx** — NO state hooks, NO props that change frequently. Layout container only.
- **`server.ts` function names** `claimGems` / `getGemBalance` — hardcoded in UI components, do NOT rename.
- **`gameStore` phase enum** values — used by GameSceneUI for routing, do not add new values without updating GameSceneUI.

## Critical Memory

- `.crossramp` file at root: MUST be created via `read_gameserver_sdk_crossramp` tool — contains uuid, project_id, asset_keys
- Asset key for in-game currency: `gem` (configurable per concept, must match server.ts)
- Exchange ratio: 100 gems → 1 GDT (configurable)
- Player attacks: MELEE_ATTACK action → range check via `enemyPositionRegistry`
- Enemy AI: chases player position from `useLocalPlayerStore` via `setLinvel()`
- Gem collection: sensor RigidBody triggers `collectGem()` on overlap
- Floor clear: all enemies defeated → 2s delay → `nextFloor()` in Experience.tsx
