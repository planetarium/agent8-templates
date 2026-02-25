# Boilerplate Context

## What This Is

This is a **Vampire Survivors-like 2D mobile game boilerplate**. The current default theme is a knight fighting slime monsters — this is placeholder content only. Every new game built from this template must replace the concept entirely.

## AI Agent Mission

When starting development from this template, you MUST:
1. **Identify the game concept** — use the concept provided by the user, OR invent a fresh one using the combination table in `docs/project-2d-rules.md` Section 1-B (world × hero × enemies × color palette)
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
- Agent8 GameServer SDK (blockchain gold storage)
- CROSS Token Network
