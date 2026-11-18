# Context — 2d-phaser-basic

## Project Overview

Phaser 4 scaffold mounted inside a React shell. `GameComponent` boots a `Phaser.Game` into a DOM container and `MainScene` sets up a sky-blue viewport, an Arcade Physics world, and a single static green ground rectangle. The game uses full-window sizing with `Phaser.Scale.RESIZE`, and `Game.ts` patches Phaser's `setDisplaySize` / `setScale` / Tween scale behavior so that sprite scaling stays consistent with the declared display size.

## Tech Stack

_Exact versions are in `package.json`._

- **Game engine**: `phaser` 4 (Arcade Physics, WebGL). API guides for this exact version ship in `node_modules/phaser/skills/<topic>/SKILL.md`
- **World effects**: `src/game/vfx/PixelVfx.ts` — plays pixel art VFX sheets (hits, explosions, deaths, pickups, heal, status, projectiles, weather) found in the Agent8 asset library with `search_resources_vectordb_items`; the chosen ones go in `src/game/vfx/effects.ts`. See `docs/vfx-sheets.md`
- **Shell**: React, `react-dom`
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS
- **Multiplayer (unwired)**: `@agent8/gameserver`
- **Icons (unwired)**: `lucide-react`

## Critical Memory

- React owns only the mount point; all gameplay lives in Phaser under `src/game/`. Do not render game objects from React.
- `GameComponent` creates the `Phaser.Game` once via a `useRef` guard and calls `destroy(true)` on unmount — preserve this lifecycle to avoid duplicate game instances under React StrictMode.
- `Game.ts` contains a `CRITICAL` block that overrides `Sprite.prototype.setDisplaySize` / `setScale`, `Image.prototype.setDisplaySize` / `setScale`, and `TweenManager.prototype.add`. It is marked LLM-modification-prohibited; sprite sizing/tweens depend on it.
- Assets are declared in `src/assets.json` (`sprites` map) and currently empty — load textures in `MainScene.preload()` by reading this manifest.
- Canvas uses `Phaser.Scale.RESIZE`; read `this.cameras.main.width/height` or `this.sys.game.canvas.width/height` instead of hard-coding dimensions.
- The asset library has pixel art effect sheets for hits and slashes, explosions, pickups (coins, gems, hearts spinning in the world, and the collect burst), heals and buffs, status effects, projectiles, fire and torches, weather (rain, snow), spawns and deaths, and screen transitions (also arcane, ice, lightning, shadow, water, sci-fi).
- Every world effect in the game gets its own search — not just hits: each pickup lying in the world, each collect, each weather, each status, each projectile, each explosion. Read `docs/vfx-sheets.md` before writing any effect, search with `search_resources_vectordb_items` (add "pixel art VFX sprite sheet"; pick a `.png` result whose url contains `/vfx/pixelfx/`), copy its `url` + `metadata` into `src/game/vfx/effects.ts`, then `PixelVfx.preload(this, [EFFECTS.x])` + `PixelVfx.play(this, EFFECTS.x, x, y, { scale })`.
- Never draw a world effect (graphics, particles, tweens) without searching for it first. Only when that effect's search has nothing that fits, generate it with the image generation tools or draw it in code, with a one-line comment next to it saying what you searched.
- UI feedback (tap glows, ripples, scale bounces, floating number text), vignettes, screen flashes and camera shake are code: tweens, graphics and camera effects. The two usually go together — a hit is a hit spark sheet + hit stop + camera shake + a flash.
- Only if the user asked for a smooth vector, realistic/HD or painted look (or gave art in that style) draw world effects with Phaser particles/graphics instead. A style you picked yourself is not a reason to skip the searched sheets. If the user asks to leave the sheets out or to draw the effects yourself, do that.
- Size PixelVfx sprites only with the whole-number `scale` option, never `setDisplaySize`.
- This is Phaser 4: shader effects are filters (`obj.enableFilters().filters.internal.addGlow(...)`, `this.cameras.main.filters.external.addVignette(...)`). The Phaser 3 `preFX` / `postFX` / `setPipeline` / `setPostPipeline` / `createBitmapMask` APIs no longer exist and crash at runtime (`vite build` does not type-check, so the build still passes); `setTintFill` only logs an error — use `setTint(c).setTintMode(Phaser.TintModes.FILL)`. `group.children` (and `physics.world.bodies`) is a native `Set`: no `each` / `iterate` / `contains` / `entries` array — use `group.getChildren().forEach(...)`, `group.getLength()`, `group.contains(obj)`. Table in `docs/project-2d-rules.md`; when unsure an API exists, read `node_modules/phaser/skills/v3-to-v4-migration/SKILL.md` and `filters-and-postfx/SKILL.md`.
