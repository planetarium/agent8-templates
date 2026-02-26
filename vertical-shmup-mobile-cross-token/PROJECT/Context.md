# Boilerplate Context

## Critical Rules (Read First)

> **CONCEPT ≠ BLOCKCHAIN**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` are **technical specs only**. They do NOT imply cyberpunk, SF, or any game world. If the user prompt contains only these words and no explicit world → **DO NOT choose cyberpunk/SF**. Read `docs/project-2d-rules.md` Section 1-B and use the combination table as inspiration, but **create an original world concept yourself**.

> **ASSETS + UI = SET (FIRST PROMPT)**: Asset generation and `App.tsx` UI redesign are a **single mandatory pair**. Both must be completed **on the first prompt** — do not defer UI to a follow-up.

---

## What This Is

This is a **bare-bones scaffold** for building an arcade-style vertical shoot-em-up (shmup) 2D mobile game. The template provides only the Phaser engine wiring and React mount — **zero gameplay exists**. The AI agent must build the entire game from scratch.

Classic genre reference: Raiden, 1943, DoDonPachi — adapted for mobile touchscreen.

**What already exists (do not rewrite these):**
- `src/main.tsx` — React 18 entry point
- `src/App.tsx` — bare wrapper div (must be fully redesigned)
- `src/App.css` — minimal CSS (update with concept theme)
- `src/components/GameComponent.tsx` — mounts Phaser canvas into React
- `src/game/Game.ts` — Phaser engine with setDisplaySize/setScale/Tween overrides (**needs gravity fix + scene list update**)
- `src/game/scenes/MainScene.ts` — placeholder (sky + green ground, **completely replace**)
- `src/assets.json` — empty `{ "sprites": {} }` (**replace all**)

**What does NOT exist yet (must be created):**
- `src/game/events.ts` — shared `gameEvents` EventTarget singleton
- `src/game/scenes/TitleScene.ts`
- `src/game/scenes/GameOverScene.ts`
- `src/game/entities/` — PlayerShip, EnemyShip, Bullet, PowerUp
- `src/game/systems/` — ScrollSystem, StageSystem, BossSystem
- `src/config/` — gameConfig, enemyTypes, bulletPatterns, powerUpTypes, stageConfig
- `src/components/PowerUpIndicator.tsx`
- `server.js` — Agent8 blockchain addCoin

---

## AI Agent Mission

When starting development from this template, you MUST:

1. **Identify the game concept** — use the concept provided by the user, OR invent a fresh one. Use the Section 1-B combination table in `docs/project-2d-rules.md` as **inspiration only**. **If the user prompt contains only blockchain/token-related words (CROSS, chain, token, wallet) and no explicit world concept** → treat as no concept provided and use Section 1-B. **Do NOT default to cyberpunk/SF.**
2. **Fix `Game.ts`** — change `gravity: { x: 0, y: 2000 }` → `{ x: 0, y: 0 }` and update `scene: [MainScene]` → `scene: [TitleScene, MainScene, GameOverScene]`
3. **Build the complete game** — implement every file listed in `PROJECT/Status.md` in order
4. **Replace all placeholder content** — game name, sprites, enemies, patterns, UI theme

---

## Architecture

React handles all UI/HUD. Phaser handles all gameplay. They communicate exclusively via a shared `EventTarget` called `gameEvents`, defined in `src/game/events.ts` and imported by both sides.

```
React (App.tsx)
  ├── HUD: score, multiplier, lives, bomb count, stage indicator
  ├── Boss health bar (visible only during boss fight)
  ├── Touch control layer: full-screen transparent overlay → ship movement
  ├── Power-up pickup notification (brief animated banner)
  ├── Modals: title screen, stage clear, game over, pause
  └── State machine: TITLE → PLAYING → STAGE_CLEAR → GAMEOVER

        ↕ gameEvents (src/game/events.ts — EventTarget singleton)

Phaser (MainScene)
  ├── Player ship: lerp-follows touch position from React, auto-fires upward
  ├── Scrolling background: 2-layer parallax TileSprite
  ├── Enemy waves: formation-based spawning via StageSystem
  ├── Enemy bullets: various patterns (aimed, spread, circle, spiral)
  ├── Boss fight: multi-phase boss with changing attack patterns
  ├── Power-up drops: physical pickups moving downward on screen
  ├── Score: kill-streak multiplier chain (resets on hit)
  └── Collision: player bullets ↔ enemies, enemy bullets ↔ player, player ↔ power-ups
```

**Scene flow**: `TitleScene` → `MainScene` (all stages + boss transitions) → `GameOverScene`

All stage transitions and boss fights happen **inside** `MainScene` — no mid-game scene switches.

### gameEvents Setup

Create `src/game/events.ts`:
```typescript
export const gameEvents = new EventTarget();
```

Import this in both `App.tsx` and any Phaser scene/system that needs to communicate with React.

---

## Core Gameplay Loop

1. Title screen → tap START → `TitleScene` sends `startGameFromUI` → `MainScene` begins
2. Background scrolls upward continuously (parallax)
3. Enemies spawn in formations per stage wave sequence
4. Player moves by dragging finger — ship smoothly lerps to finger position
5. Player auto-fires upward; tap BOMB button to clear screen
6. Enemies drop power-ups on death; player flies over them to collect
7. Kill streak builds score multiplier; taking damage resets it to ×1
8. After all stage waves complete → Boss warning → Boss appears with health bar
9. Defeat boss → Stage Clear screen → coin reward saved to blockchain
10. Player loses a life on hit; game over when lives reach 0

---

## Game.ts Modifications Required

`src/game/Game.ts` has two things that must be updated before building anything else:

```typescript
// 1. Fix gravity (line ~19)
arcade: {
  gravity: { x: 0, y: 0 },  // ← was y: 2000
  debug: false,
},

// 2. Add all scenes (line ~23)
scene: [TitleScene, MainScene, GameOverScene],  // ← was [MainScene] only
```

After these two changes, **do not modify `Game.ts` again**. The engine override section (setDisplaySize/setScale/Tween) must not be touched.

---

## Absolute Constraints (After Initial Setup)

- `src/game/Game.ts` — frozen after gravity fix + scene list update
- `gameEvents` event key names — once defined, never rename (breaks React ↔ Phaser bridge)
- Scene keys — must be exactly `'TitleScene'`, `'MainScene'`, `'GameOverScene'`
- Physics gravity — must stay `{ x: 0, y: 0 }` permanently
- Bullet pool — never call `sprite.destroy()` on pooled bullets; always `setActive(false).setVisible(false)`
- `src/components/GameComponent.tsx` — do not modify

---

## Tech Stack

- React 18 + Vite + TypeScript
- Phaser 3 (Arcade Physics, 0 gravity, RESIZE scale mode)
- Tailwind CSS (UI styling)
- Agent8 GameServer SDK (`@agent8/gameserver`) — blockchain coin storage via `server.js`
- CROSS Token Network — blockchain integration layer, not a game concept
