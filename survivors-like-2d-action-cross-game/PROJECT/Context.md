# Context

## ⚠️ CRITICAL: This Is a Pre-Built Game — Do NOT Recreate It

> **On the first prompt, do NOT generate assets, do NOT redesign the UI, do NOT rewrite any configuration files.**
> This game is fully implemented. Read the code, understand what's there, and wait for user instructions.

## Project Overview

This project is a **fully implemented** 2D Survivors-like action game ("Neon Strikers") for mobile, built using React, Phaser, and the Agent8 GameServer. The game incorporates a blockchain token economy using the CROSS chain.

The game has been fully themed to "Neon Strikers" (cyberpunk/sci-fi aesthetic).

## First Prompt Instructions (MANDATORY)

**You MUST:**
1. Read the existing code to understand the current implementation
2. Report to the user what's already built (theme, enemies, abilities, UI)
3. Ask what specific changes the user wants
4. **Deploy CrossRamp (MANDATORY — do not skip, do not defer):**
   - Call `read_gameserver_sdk_v2` → read server SDK docs
   - Call `read_gameserver_sdk_crossramp` → deploy CrossRamp, generate `.crossramp` at project root
   - Verify `.crossramp` `asset_keys` matches `server.js` asset key (`'gold'`)

**You MUST NOT:**
- Generate new image assets with NanoBanana Pro or any image tool
- Redesign `src/App.tsx`
- Rewrite `src/config/` files from scratch
- Replace any existing assets or code without explicit user request

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS + Vite
- Game Engine: Phaser 3
- Server: Agent8 GameServer SDK
- Blockchain: CROSS Mini Hub Integration (Crossramp Builder API)

## Current Status
- The core gameplay loop (wave spawning, XP collection, ability level-ups, shooting mechanics) is fully implemented.
- The UI has been themed to a Neon/Cyberpunk style, featuring cyan, purple, and neon glow effects.
- The Crossramp project has **NOT** been deployed yet — deploy on first prompt via `read_gameserver_sdk_crossramp`.
- `server.js` tracks and mints the `gold` asset.
- `App.tsx` handles the Crossramp shop UI opening via `getCrossRampShopUrl`.

## Key Files
- `src/App.tsx`: The main React component handling the UI, HUD overlays, and Crossramp shop integration.
- `src/game/Game.ts`: The entry point for the Phaser game engine.
- `src/game/scenes/MainScene.ts`: The main game loop where physics, enemies, and abilities operate.
- `src/config/`: Contains the configuration files for enemies, abilities, waves, and overall game settings.
- `server.js`: The legacy GameServer file managing the `addGold` remote function and `gold` asset minting.
- `.crossramp`: Contains the deployment details for the Crossramp token integration.

## Absolute Constraints (Do Not Break)

- `src/game/Game.ts` — Engine overrides. Modifying this breaks the entire game.
- `gameEvents` event key names — Changing any key name breaks React ↔ Phaser communication.
- Scene keys — Must remain `'TitleScene'`, `'MainScene'`, `'GameOverScene'`.
- Physics config — `gravity: { x: 0, y: 0 }` must not change.
- `addGold` function name in `server.js` — hardcoded in `App.tsx`.
