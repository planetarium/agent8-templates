# Project Status

## Critical Rules (Do Not Skip)

| Rule | Action |
|------|--------|
| **Concept** | CROSS/chain/token in user prompt ≠ cyberpunk. Use Section 1-B as inspiration but create an original world concept yourself. Cyberpunk/SF only if user explicitly requests. |
| **Assets + UI (first prompt)** | Step 2 (assets) and Step 8 (App.tsx redesign) are **one unit**. **Complete both on the first prompt** — do not defer UI to a later prompt. Never leave UI unchanged after generating assets. |

## Current Boilerplate Default (Placeholder — Replace Everything)

The template ships with a generic knight-vs-slimes theme. This is not a final game — it is scaffolding.

| Element | Current Default | Required Action |
|---------|----------------|-----------------|
| Player | Knight sprite, basic stats | Replace with concept hero |
| Enemies | Slime × 3 (normal / swift / heavy) | Replace with 3+ concept enemies |
| Abilities | 4 generic skills (Faster Fire, Swift Boots, Extra Heart, Piercing Shot) | Replace with 6+ concept-themed skills |
| UI Theme | Default green/gray, hearts health | Full redesign per concept |
| Assets | Placeholder sprite URLs | Generate new assets with NanoBanana Pro |
| Game Name | "Survivor Quest" | Replace in `gameConfig.ts` |

## Immediate Tasks — Execute in Order

- [ ] **Step 1** — Finalize game name & world concept → update `GAME_CONFIG.name`, `subtitle` in `src/config/gameConfig.ts`
- [ ] **Step 2** — Generate all assets (NanoBanana Pro): player, each enemy type, background, XP gem, currency icon, projectile — **→ On this same (first) prompt, do Step 8 (App.tsx full redesign). Do not defer UI to a later prompt. Assets alone = incomplete.**
- [ ] **Step 3** — Update `src/assets.json` with new asset URLs. Ensure `projectile` image key matches `GAME_CONFIG.projectile.spriteKey` (and `currency`/`xp` match their config keys).
- [ ] **Step 4** — Redesign `src/config/enemyTypes.ts`: min 3 enemy types, each with distinct `behavior`, `speed`, `hp`, `sprite`
- [ ] **Step 5** — Redesign `src/config/abilities.ts`: min 6 abilities with concept-appropriate names; invent at least 1 new `effect` type
- [ ] **Step 6** — Redesign `src/config/waves.ts`: 10-wave progression with enemy composition changes and difficulty curve
- [ ] **Step 7** — Update `src/config/gameConfig.ts`: player stats, UI theme tokens (accent color, healthStyle, HUD layout)
- [ ] **Step 8** — Redesign `src/App.tsx`: new HUD layout, color scheme, modal styles, joystick position — **MANDATORY on first prompt (same session as Step 2). Do not defer to a follow-up prompt.**
- [ ] **Step 9** — Update `src/components/AbilityIcon.tsx`: register icons for all new abilities in `ICON_MAP`
- [ ] **Step 10** — Update `src/game/scenes/MainScene.ts`: implement `handleSelectAbility` logic for any new effect types

## Completed Engine Features (Do Not Re-implement)

These are fully functional in the boilerplate — only visual/data customization needed:

- Player movement (joystick + keyboard WASD/arrows)
- Auto-fire to nearest enemy
- Enemy AI: chase / swarm / tank behaviors
- Time-based wave progression with weighted spawning
- XP gem drops + level-up ability selection modal (3 choices)
- Gold drops (20% chance) + blockchain save via Agent8
- Health system (hearts) + damage feedback (camera shake, tween)
- Particle bursts + floating damage/pickup text
- Game state machine: Title → Playing → Game Over
- Quit confirmation modal
