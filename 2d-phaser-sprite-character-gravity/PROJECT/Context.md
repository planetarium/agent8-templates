# Context — 2d-phaser-sprite-character-gravity

## Project Overview

Phaser 4 scaffold running inside a React shell. A single `MainScene` boots Arcade Physics with downward gravity, spawns a static ground rectangle, and places a gravity-bound `SpriteCharacter` (extends `Phaser.Physics.Arcade.Sprite`) that handles left/right movement, ground-checked jump, and a timed melee attack with a transient hitbox. Sprite sheet is loaded from a URL declared in `src/assets.json`.

## Tech Stack

_Exact versions are in `package.json`._

- **Game engine**: Phaser 4 (Arcade Physics, WebGL). API guides for this exact version ship in `node_modules/phaser/skills/<topic>/SKILL.md`
- **World effects**: `src/game/vfx/PixelVfx.ts` — plays pixel art VFX sheets (hits, explosions, deaths, pickups, heal, status, projectiles, weather) found in the Agent8 asset library with `search_resources_vectordb_items`; the chosen ones go in `src/game/vfx/effects.ts`. See `docs/vfx-sheets.md`
- **Shell**: React, ReactDOM
- **Icons**: `lucide-react`
- **Multiplayer (unwired)**: `@agent8/gameserver`
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- The game runs entirely inside Phaser. React only mounts a `<div id="phaser-game">` and calls `createGame` once per mount; `gameInstanceRef` guards against double-init and disposes via `destroy(true)` on unmount.
- `src/game/Game.ts` contains a `// CRITICAL: DO NOT MODIFY` block that monkey-patches `Phaser.GameObjects.Sprite/Image` `setDisplaySize` / `setScale` and `Phaser.Tweens.TweenManager.add`. Scale values are reinterpreted against a cached `baseDisplayWidth/Height` — do not remove or edit this block.
- Arcade gravity is `{ x: 0, y: 2000 }`. Jumps are gated by `body.touching.down || body.blocked.down`; any new platform must be an Arcade static/dynamic body added via `physics.add.collider`.
- Sprite sheet URL, `frameWidth`, and `frameHeight` come from `src/assets.json` under `sprites["2dbasic"]`. Animation frame ranges in `SpriteCharacter` are tied to that specific sheet layout.
- Canvas uses `Phaser.Scale.RESIZE` at `window.innerWidth/innerHeight`; world bounds are set once in `create()` and do not auto-update on window resize.
- The asset library has pixel art effect sheets for hits and slashes, explosions, pickups (coins, gems, hearts spinning in the world, and the collect burst), heals and buffs, status effects, projectiles, fire and torches, weather (rain, snow), spawns and deaths, and screen transitions (also arcane, ice, lightning, shadow, water, sci-fi).
- Every world effect in the game gets its own search — not just hits: each pickup lying in the world, each collect, each weather, each status, each projectile, each explosion. Read `docs/vfx-sheets.md` before writing any effect, search with `search_resources_vectordb_items` (add "pixel art VFX sprite sheet"; pick a `.png` result whose url contains `/vfx/pixelfx/`), copy its `url` + `metadata` into `src/game/vfx/effects.ts`, then `PixelVfx.preload(this, [EFFECTS.x])` + `PixelVfx.play(this, EFFECTS.x, x, y, { scale })`.
- Never draw a world effect (graphics, particles, tweens) without searching for it first. Only when that effect's search has nothing that fits, generate it with the image generation tools or draw it in code, with a one-line comment next to it saying what you searched.
- UI feedback (tap glows, ripples, scale bounces, floating number text), vignettes, screen flashes and camera shake are code: tweens, graphics and camera effects. The two usually go together — a hit is a hit spark sheet + hit stop + camera shake + a flash.
- Only if the user asked for a smooth vector, realistic/HD or painted look (or gave art in that style) draw world effects with Phaser particles/graphics instead. A style you picked yourself is not a reason to skip the searched sheets. If the user asks to leave the sheets out or to draw the effects yourself, do that.
- Size PixelVfx sprites only with the whole-number `scale` option, never `setDisplaySize`.
- This is Phaser 4: shader effects are filters (`obj.enableFilters().filters.internal.addGlow(...)`, `this.cameras.main.filters.external.addVignette(...)`). The Phaser 3 `preFX` / `postFX` / `setPipeline` / `setPostPipeline` / `createBitmapMask` APIs no longer exist and crash at runtime (`vite build` does not type-check, so the build still passes); `setTintFill` only logs an error — use `setTint(c).setTintMode(Phaser.TintModes.FILL)`. `group.children` (and `physics.world.bodies`) is a native `Set`: no `each` / `iterate` / `contains` / `entries` array — use `group.getChildren().forEach(...)`, `group.getLength()`, `group.contains(obj)`. Table in `docs/project-2d-rules.md`; when unsure an API exists, read `node_modules/phaser/skills/v3-to-v4-migration/SKILL.md` and `filters-and-postfx/SKILL.md`.
