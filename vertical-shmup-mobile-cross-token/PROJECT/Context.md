# Boilerplate Context

## Critical Rules (Read First)

> **CONCEPT ≠ BLOCKCHAIN**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` are **technical specs only**. They do NOT imply cyberpunk, SF, or any game world. If the user prompt contains only these words and no explicit world → **DO NOT choose cyberpunk/SF**. Read `docs/project-2d-rules.md` Section 1-B and use the combination table as inspiration, but **create an original world concept yourself**.

> **ASSETS + UI = SET (FIRST PROMPT)**: Asset generation and `App.tsx` UI redesign are a **single mandatory pair**. Both must be completed **on the first prompt** — do not defer UI to a follow-up. Never generate assets without immediately redesigning the full UI to match the chosen concept.

> **GRAVITY = 0**: This is a free-flight shmup. The physics engine must run with `gravity: { x: 0, y: 0 }`. The current Game.ts template sets `y: 2000` — **override it in Game.ts before any other work**. Everything breaks with non-zero gravity.

---

## What This Is

This is an **arcade-style vertical shoot-em-up (shmup) 2D mobile game boilerplate**. The default template is a bare-bones Phaser scene with no game logic — this is scaffolding only. Every new game built from this template must implement the complete engine from scratch using this architecture spec.

Classic genre reference: Raiden, 1943, DoDonPachi, Ikaruga — adapted for mobile touchscreen.

---

## AI Agent Mission

When starting development from this template, you MUST:

1. **Identify the game concept** — use the concept provided by the user, OR invent a fresh one. Use the Section 1-B combination table as **inspiration only**. **If the user prompt contains only blockchain/token-related words (CROSS, chain, token, wallet) and no explicit world concept** → treat as no concept provided and use Section 1-B. **Do NOT default to cyberpunk/SF.**
2. **Fix gravity** — change `gravity: { x: 0, y: 2000 }` to `{ x: 0, y: 0 }` in `src/game/Game.ts` immediately
3. **Build the complete engine** — implement all systems listed in `PROJECT/Status.md`
4. **Replace all placeholder content** — game name, sprites, enemies, weapon patterns, UI theme
5. **Follow the build checklist** in `PROJECT/Status.md` in exact order

---

## Architecture

This project uses a **hybrid architecture**: React handles all UI/HUD, Phaser handles all gameplay. They communicate exclusively via a shared `EventTarget` called `gameEvents`.

```
React (App.tsx)
  ├── HUD: score, lives, stage indicator, bomb count, power-up display
  ├── Boss health bar (shown during boss fights)
  ├── Touch control layer: full-screen drag tracking → ship movement
  ├── Modals: stage clear, game over, pause, title
  └── Game state machine: TITLE → PLAYING → STAGE_CLEAR → GAMEOVER

        ↕ gameEvents (EventTarget)

Phaser (MainScene)
  ├── Player ship: follows touch position from React, auto-fires upward
  ├── Scrolling background: multi-layer parallax (2–3 layers)
  ├── Enemy spawning via StageSystem (wave sequences per stage)
  ├── Enemy bullet patterns: various formations (spread, aimed, spiral)
  ├── Boss fight: multi-phase boss with unique attack patterns
  ├── Power-up drops: physical pickups on screen
  └── Collision: player bullets ↔ enemies, enemy bullets ↔ player, player ↔ power-ups
```

**Scene flow**: `TitleScene` → `MainScene` (contains all stages + boss) → `GameOverScene`

Stage transitions and boss fights happen **within** `MainScene` via the `StageSystem` — no scene switch mid-game.

---

## Core Gameplay Loop

1. Player ship enters from bottom; background auto-scrolls upward
2. Enemies spawn in formation patterns dictated by `StageSystem`
3. Player moves by dragging finger anywhere on screen (ship tracks finger)
4. Player auto-fires upward; tapping bomb button clears all bullets + damages enemies
5. Enemies drop power-ups (weapon upgrades, shields, extra life, score multiplier)
6. After all waves in a stage complete → Boss appears (health bar shown)
7. Destroy boss → Stage Clear → coin reward + next stage
8. Player loses a life when hit by enemy bullet; loses when lives reach 0

---

## Absolute Constraints (Do Not Break After Initial Setup)

- `src/game/Game.ts` — Engine overrides. Modifying this after setup breaks the entire game.
- `gameEvents` event key names — Changing any key name breaks React ↔ Phaser communication. See full list in `PROJECT/Requirements.md`.
- Scene keys — Must remain `'TitleScene'`, `'MainScene'`, `'GameOverScene'`.
- Physics config — `gravity: { x: 0, y: 0 }` must be set and never changed again.
- Bullet pool — Never use `sprite.destroy()` directly on pooled bullets; always use `pool.release(bullet)`.

---

## Tech Stack

- React 18 + Vite + TypeScript
- Phaser 3 (Arcade Physics, top-down, 0 gravity)
- Tailwind CSS (UI styling)
- Agent8 GameServer SDK (blockchain coin storage)
- CROSS Token Network (blockchain integration — not a game concept)

---

## Key Design Principles

### Mobile-First Controls
- Touch area covers entire screen; finger position directly controls ship X/Y
- Ship smoothly lerps to touch position (not teleport) — feels responsive but not jittery
- Bomb button: fixed position corner button, large enough for thumb tap
- No on-screen joystick — the entire screen is the control surface

### Bullet Hell Lite
- Enemies fire bullets in patterns (spread, aimed, circular, spiral)
- Player bullets travel upward; all bullet physics use `setVelocity` not gravity
- Object pooling mandatory for bullets (performance critical on mobile)
- Max active bullets: ~200 player + ~300 enemy at any time

### Stage Pacing
- Each stage: 60–120 seconds of enemy waves → boss encounter
- 3 stages minimum for a complete game loop
- Difficulty escalates: more enemies, faster bullets, more complex patterns

### Score System
- Base score per enemy kill (varies by type)
- Score multiplier chain: consecutive kills without taking damage multiply score
- Boss kill: large bonus + coin drop for blockchain
