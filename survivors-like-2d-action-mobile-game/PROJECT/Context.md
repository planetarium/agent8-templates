# Boilerplate Context

## Critical Rules (Read First)

> **CONCEPT ≠ BLOCKCHAIN**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` are **technical specs only**. They do NOT imply cyberpunk, SF, or any game world. If the user prompt has only these words and no explicit world → **DO NOT choose cyberpunk/SF**. **MUST** read `docs/project-2d-rules.md` Section 1-B and use the combination table as inspiration, but **create an original world concept yourself**. Do not pick from a fixed list; fully new combinations not in the table are actively encouraged.

> **ASSETS + UI = SET (FIRST PROMPT)**: Asset generation and `App.tsx` UI redesign are a **single mandatory pair**. Both must be completed **on the first prompt** — do not defer UI to a follow-up. Never generate assets without immediately redesigning the full UI to match the chosen concept.

> **CROSSCOIN INTEGRATION = MANDATORY (FIRST PROMPT)**: When redesigning `App.tsx`, you MUST preserve all CrossCoin/blockchain integration code. This includes: `useGameServer`/`useAsset` hooks, `handleAddGold` (with `server.remoteFunction`), `openShop` (with `getCrossRampShopUrl`), the CROSS Exchange button, and the total gold balance display. Assets + UI + CrossCoin are a **triple set** — all three must be completed on the first prompt.

## What This Is

This is a **Vampire Survivors-like 2D mobile game boilerplate**. The current default theme is a knight fighting slime monsters — this is placeholder content only. Every new game built from this template must replace the concept entirely.

## AI Agent Mission

When starting development from this template, you MUST:
1. **Identify the game concept** — use the concept provided by the user, OR invent a fresh one. Use the Section 1-B combination table as **inspiration only**; do not copy examples verbatim — **actively create fully new combinations not in the table**. **If the user prompt contains only blockchain/token-related words (CROSS, chain, token, wallet) and no explicit world concept** → treat as no concept provided and use Section 1-B as inspiration. **Do NOT default to cyberpunk/SF.**
2. **Replace all placeholder content** — game name, sprites, enemies, abilities, UI theme, wave design
3. **Follow the 10-step checklist** in `PROJECT/Status.md` immediately

## Architecture

This project uses a **hybrid architecture**: React handles all UI/HUD, Phaser handles all gameplay. They communicate exclusively via a shared `EventTarget` called `gameEvents`.

```
React (App.tsx)
  ├── HUD: health, XP bar, gold display, joystick
  ├── Modals: level-up ability picker, quit confirmation
  └── Game state machine: TITLE → PLAYING → GAMEOVER

        ↕ gameEvents (EventTarget)

Phaser (MainScene)
  ├── Player movement, auto-fire, collision
  ├── Enemy spawning via WaveSystem
  └── Ability effects via handleSelectAbility
```

**Scene flow**: `TitleScene` → `MainScene` → `GameOverScene`

## Absolute Constraints (Do Not Break)

- `src/game/Game.ts` — Engine overrides. Modifying this breaks the entire game.
- `gameEvents` event key names — Changing any key name breaks React ↔ Phaser communication. See full list in `PROJECT/Requirements.md`.
- Scene keys — Must remain `'TitleScene'`, `'MainScene'`, `'GameOverScene'`.
- Physics config — `gravity: { x: 0, y: 0 }` must not change.

## Tech Stack

- React 18 + Vite + TypeScript
- Phaser 3 (Arcade Physics, top-down, 0 gravity)
- Tailwind CSS (UI styling)
- **Agent8 GameServer SDK** — blockchain gold storage; `useGameServer`/`useAsset` hooks and `server.remoteFunction`/`getCrossRampShopUrl` are **mandatory** and must be preserved in `App.tsx`
- **CROSS Token Network** — blockchain integration (technical spec only, not a game concept)
