# Project Status

## ⚠️ CRITICAL: This Game Is Already Complete — Do NOT Rebuild

> **On the first prompt, do NOT generate assets, do NOT redesign the UI, do NOT rewrite config files.**
> Read the existing code, understand what's implemented, then wait for explicit user instructions.

## First Prompt Rules

| Rule | Action |
|------|--------|
| **Read first** | Read existing code to understand the current "Neon Strikers" implementation |
| **Report to user** | Tell the user what's already built (Neon Strikers: cyberpunk theme, alien enemies, 8 abilities) |
| **CrossRamp (MANDATORY)** | Call `read_gameserver_sdk_v2` then `read_gameserver_sdk_crossramp` — **always on first prompt, no exceptions** |
| **Wait for instructions** | Do NOT make any other changes until user explicitly requests them |
| **No asset generation** | Do NOT call NanoBanana Pro or any image tool |
| **No UI redesign** | Do NOT rewrite App.tsx |
| **No config rewrite** | Do NOT replace config files |

## Current Game: Neon Strikers (Fully Implemented)

| Element | Current Implementation |
|---------|----------------|
| Player | Cyber space marine |
| Enemies | Alien Bug, Cyber Drone, Mech Brute |
| Abilities | 8 Sci-fi themed abilities |
| UI Theme | Cyan/Purple, cyberpunk glowing |
| Assets | All replaced with `nano-banana-2` high quality pixels |
| Game Name | "Neon Strikers" |
| CrossRamp | **NOT deployed** — must deploy on first prompt |

## Completed Features (Do Not Re-implement)

- Player movement (joystick + keyboard WASD/arrows)
- Auto-fire to nearest enemy
- Enemy AI: chase / swarm / tank behaviors
- Time-based wave progression with weighted spawning (10 waves)
- XP gem drops + level-up ability selection modal (3 choices)
- Gold drops (20% chance) + blockchain save via Agent8
- Health system (hearts) + damage feedback (camera shake, tween)
- Particle bursts + floating damage/pickup text
- Game state machine: Title → Playing → Game Over
- Quit confirmation modal
- CrossRamp CROSS token integration (code is ready — `.crossramp` must be re-deployed on first prompt)

## CrossRamp Deployment (MANDATORY on First Prompt)

> ⚠️ `.crossramp` and `.env` files have been removed from this template. **You must always deploy CrossRamp on the first prompt — no exceptions.**

1. Call `read_gameserver_sdk_v2` → read server SDK docs
2. Call `read_gameserver_sdk_crossramp` → deploy CrossRamp, generate `.crossramp` at project root
3. Verify `.crossramp` `asset_keys` matches `server.js` asset key (`'gold'`)

## When Making Changes (Only If User Requests)

If the user requests asset replacement:
- Use NanoBanana Pro with style/colors/details/background fields
- Update `src/assets.json` with new URLs

If the user requests currency rename from `'gold'`:
- Sync 3 locations: `server.js` → `src/App.tsx` → `.crossramp`
- Re-deploy CrossRamp via `read_gameserver_sdk_crossramp`
- **Never rename** the `addGold` server function
