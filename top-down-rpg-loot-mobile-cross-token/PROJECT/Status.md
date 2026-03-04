# Project Status

## Critical Rules (Do Not Skip)

| Rule | Action |
|------|--------|
| **Concept** | CROSS/chain/token in user prompt ≠ cyberpunk. Use Section 1-B as inspiration but create an original world concept yourself. Cyberpunk/SF only if user explicitly requests. |
| **Assets + UI (first prompt)** | Step 2 (assets) and Step 7 (overlay redesign) are **one unit**. **Complete both on the first prompt** — do not defer UI to a follow-up prompt. Never leave UI unchanged after generating assets. |

## Current Boilerplate Default (Placeholder — Replace Everything)

The template ships with a "Crystal Dungeon" (knight vs monsters) theme. This is not a final game — it is scaffolding.

| Element | Current Default | Required Action |
|---------|-----------------|-----------------|
| Player | Knight/hero sprite (placeholder URL) | Replace with concept hero (top-down view) |
| Enemies | Generic monster (placeholder URL) | Replace with 2+ concept enemies |
| Boss | Generic boss (placeholder URL) | Replace with concept boss |
| Collectible | Green gem | Replace with concept collectible |
| Rare Collectible | Purple crystal | Replace with concept rare drop |
| Epic Collectible | Gold orb | Replace with concept epic drop |
| Projectile | Purple magic bolt | Replace with concept-themed projectile |
| UI Theme | Purple/green dungeon | Full redesign per concept |
| Assets | Placeholder URLs (vertical shmup reuse) | Generate new assets with NanoBanana Pro |
| Game Name | "Crystal Dungeon" | Replace in overlays and localStorage keys |

## Immediate Tasks — Execute in Order

- [ ] **Step 1** — Finalize game name & world concept → update overlays, use `docs/project-2d-rules.md` Section 1-B as inspiration
- [ ] **Step 2** — Generate all assets (NanoBanana Pro): player (top-down), enemy types, boss, background (dungeon floor tileable), gem variants (common/rare/epic), playerBullet — **→ On this same (first) prompt, do Step 7 (overlay full redesign). Do not defer UI to a later prompt. Assets alone = incomplete.**
- [ ] **Step 3** — Update `src/assets.json` with new asset URLs. Ensure keys match BootScene registration: `player`, `enemy`, `boss`, `gem`, `rareGem`, `epicGem`, `playerBullet`, `bg`.
- [ ] **Step 4** — Redesign `GameScene.ts`: enemy spawn parameters, floor progression, difficulty curve
- [ ] **Step 5** — Redesign `GameScene.ts`: boss pattern, behavior
- [ ] **Step 6** — Redesign `GameScene.ts`: loot drop system (gem types, values, drop rates)
- [ ] **Step 7** — Redesign overlay components: TitleOverlay, HUDOverlay, GameOverOverlay, WalletOverlay — **MANDATORY on first prompt (same session as Step 2). Do not defer to a follow-up prompt.**
- [ ] **Step 8** — Apply JUICE effects: particles, camera shake, tweens, background pan (see `docs/project-2d-rules.md` Section 4)
- [ ] **Step 9** — Add sound effects (attack, explosion, collect) if available
- [ ] **Step 10** — Deploy CrossRamp & create `.crossramp` file (MANDATORY — do not skip):
  1. Call `read_gameserver_sdk_v2` → read the gameserver SDK documentation
  2. Call `read_gameserver_sdk_crossramp` → follow instructions to deploy CrossRamp
  3. Confirm `.crossramp` file is created at project root with correct asset_keys
  4. Ensure asset_keys in `.crossramp` matches the collectible key used in server.ts and GameScene.ts
- [ ] **Step 11** — CROSS Integration sync (required when changing concept):
  - [ ] `server/src/server.ts`: `$asset.mint('gem')` → change to new collectible key
  - [ ] `server/src/server.ts`: `$asset.get('gem')` → change to same key
  - [ ] `GameScene.ts`: drop types `'gem'`, `'rareGem'`, `'epicGem'` → change keys accordingly
  - [ ] `WalletOverlay.tsx`: update token name ("GDT"), exchange rate ("100 GEMS = 1 GDT")
  - Do NOT change: `server.ts` function names (`claimGems`, `getGemBalance`), `GameComponent.tsx`
