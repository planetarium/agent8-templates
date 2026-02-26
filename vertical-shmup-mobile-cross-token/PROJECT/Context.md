# Boilerplate Context

## Critical Rules (Read First)

> **CONCEPT ≠ BLOCKCHAIN**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` are **technical specs only**. They do NOT imply cyberpunk, SF, or any game world. If the user prompt has only these words and no explicit world → **DO NOT choose cyberpunk/SF**. **MUST** read `docs/project-2d-rules.md` Section 1-B and use the combination table as inspiration, but **create an original world concept yourself**. Do not pick from a fixed list; fully new combinations not in the table are actively encouraged.

> **ASSETS + UI = SET (FIRST PROMPT)**: Asset generation and overlay UI redesign are a **single mandatory pair**. Both must be completed **on the first prompt** — do not defer UI to a follow-up. Never generate assets without immediately redesigning the full UI (TitleOverlay, HUDOverlay, GameOverOverlay, WalletOverlay) to match the chosen concept.

## What This Is

This is a **vertical shoot 'em up (shmup)** mobile game boilerplate. The current default theme is Star Blaster (spaceship vs aliens) — this is placeholder content only. Every new game built from this template must replace the concept entirely.

## AI Agent Mission

When starting development from this template, you MUST:
1. **Identify the game concept** — use the concept provided by the user, OR invent a fresh one. Use the Section 1-B combination table as **inspiration only**; do not copy examples verbatim — **actively create fully new combinations not in the table**. **If the user prompt contains only blockchain/token-related words (CROSS, chain, token, wallet) and no explicit world concept** → treat as no concept provided and use Section 1-B as inspiration. **Do NOT default to cyberpunk/SF.**
2. **Replace all placeholder content** — game name, sprites, enemies, boss, projectiles, UI theme, wave design
3. **Follow the 10-step checklist** in `PROJECT/Status.md` immediately

## Architecture

This project uses a **hybrid architecture**: React handles all UI/HUD via overlays, Phaser handles all gameplay. They communicate exclusively via `EventBus` (Phaser.Events.EventEmitter).

```
React (GameComponent + overlays)
  ├── LoadingOverlay, TitleOverlay, HUDOverlay
  ├── GameOverOverlay, WalletOverlay, CrossRampOverlay
  └── Scene routing via EventBus SCENE_CHANGE

        ↕ EventBus (Phaser.Events.EventEmitter)

Phaser (scenes)
  ├── BootScene → TitleScene → GameScene → GameOverScene ↔ WalletScene
  ├── Player movement (touch/pointer follow), auto-shoot
  └── Enemy waves, boss, stardust drops, collisions
```

**Scene flow**: BootScene → TitleScene ↔ GameScene → GameOverScene ↔ WalletScene

## Absolute Constraints (Do Not Break)

- `src/game/Game.ts` — Engine overrides. Modifying this breaks the entire game.
- `EventBus` event key names — Changing any key name breaks React ↔ Phaser communication. See full list in `PROJECT/Requirements.md`.
- Scene keys — Must remain `BootScene`, `TitleScene`, `GameScene`, `GameOverScene`, `WalletScene`.
- Physics config — `gravity: { x: 0, y: 0 }` must not change.

## Tech Stack

- React 18 + TypeScript + Vite
- Phaser 3.87 (Arcade Physics, top-down, 0 gravity)
- Server: @agent8/gameserver-node (structured TypeScript in server/)
- CROSS Mini Hub via CrossRamp (blockchain integration — not a game concept)

## Critical Memory

- `.crossramp` file at root: uuid, project_id, asset_keys: ["stardust"]
- Asset key for in-game currency: `stardust` (configurable per concept)
- CrossRamp exchange ratio configurable per game (e.g. 100 stardust → 1 token)
- Game is mobile-first (touch controls, pointer follow)
- Gravity set to 0,0 for shmup (overrides template default of y:2000)
- `getCrossRampShopUrl` called from React layer (GameComponent), triggered by Phaser WalletScene event
