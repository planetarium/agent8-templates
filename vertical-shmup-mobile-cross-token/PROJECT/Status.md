# Project Status

## Critical Rules (Do Not Skip)

| Rule | Action |
|------|--------|
| **Concept** | CROSS/chain/token in user prompt ≠ cyberpunk. Use Section 1-B as inspiration but create an original world concept yourself. Cyberpunk/SF only if user explicitly requests. |
| **Assets + UI (first prompt)** | Step 2 (assets) and Step 7 (overlay redesign) are **one unit**. **Complete both on the first prompt** — do not defer UI to a follow-up prompt. Never leave UI unchanged after generating assets. |

## Current Boilerplate Default (Placeholder — Replace Everything)

The template ships with a Star Blaster (spaceship vs aliens) theme. This is not a final game — it is scaffolding.

| Element | Current Default | Required Action |
|---------|-----------------|-----------------|
| Player | Spaceship sprite, SF style | Replace with concept vehicle |
| Enemies | Alien insectoid fighter | Replace with 3+ concept enemies |
| Boss | Alien battleship | Replace with concept boss |
| Projectiles | Cyan/Orange plasma | Replace with concept-themed projectiles |
| Collectible | Stardust Crystal | Replace with concept collectible |
| UI Theme | Default SF glow, hearts health | Full redesign per concept |
| Assets | Placeholder sprite URLs | Generate new assets with NanoBanana Pro |
| Game Name | "Star Blaster" | Replace in overlays |

## Immediate Tasks — Execute in Order

- [ ] **Step 1** — Finalize game name & world concept → update overlays, use `docs/project-2d-rules.md` Section 1-B as inspiration
- [ ] **Step 2** — Generate all assets (NanoBanana Pro): player, enemy, boss, background, collectible, playerBullet, enemyBullet — **→ On this same (first) prompt, do Step 7 (overlay full redesign). Do not defer UI to a later prompt. Assets alone = incomplete.**
- [ ] **Step 3** — Update `src/assets.json` with new asset URLs. Ensure keys match BootScene registration.
- [ ] **Step 4** — Redesign `GameScene.ts`: enemy spawn parameters, wave progression, difficulty curve
- [ ] **Step 5** — Redesign `GameScene.ts`: boss pattern, spread shot behavior
- [ ] **Step 6** — Redesign `GameScene.ts`: power-up system (spread shot, shield, speed boost drops)
- [ ] **Step 7** — Redesign overlay components: TitleOverlay, HUDOverlay, GameOverOverlay, WalletOverlay — **MANDATORY on first prompt (same session as Step 2). Do not defer to a follow-up prompt.**
- [ ] **Step 8** — Apply JUICE effects: particles, camera shake, tweens, parallax BG (see `docs/project-2d-rules.md` Section 4)
- [ ] **Step 9** — Add sound effects (shooting, explosion, collect) if available
- [ ] **Step 10** — CROSS Integration sync (required when changing concept):
  - [ ] `server/src/server.ts`: `$asset.mint('stardust')` → change to new collectible key
  - [ ] `server/src/server.ts`: `$asset.get('stardust')` → change to same key
  - [ ] `GameScene.ts`: drop type `'stardust'` string → change to same key
  - [ ] `WalletOverlay.tsx`: update token name ("SBT"), exchange rate ("100 STARDUST = 1 SBT")
  - Do NOT change: `server.ts` function names (claimStardust, getStardustBalance), `GameComponent.tsx`
