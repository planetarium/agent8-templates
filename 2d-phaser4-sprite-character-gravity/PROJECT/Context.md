# Context — 2d-phaser-sprite-character-gravity

## Project Overview

Phaser 4 scaffold running inside a React shell. A single `MainScene` boots Arcade Physics with downward gravity, spawns a static ground rectangle, and places a gravity-bound `SpriteCharacter` (extends `Phaser.Physics.Arcade.Sprite`) that handles left/right movement, ground-checked jump, and a timed melee attack with a transient hitbox. Sprite sheet is loaded from a URL declared in `src/assets.json`.

## Tech Stack

_Exact versions are in `package.json`._

- **Game engine**: Phaser 4 (Arcade Physics, WebGL). API guides for this exact version ship in `node_modules/phaser/skills/<topic>/SKILL.md`
- **World effects**: `src/game/vfx/PixelVfx.ts` — pixel art VFX sheets (hits, explosions, deaths, pickups, heal, status, projectiles, weather) from the Agent8 asset library, see `docs/vfx-sheets.md`
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
- World effects (hits, explosions, deaths, pickups, status, projectiles, weather) use `src/game/vfx/PixelVfx` — `PixelVfx.preload(this, [names])` + `PixelVfx.play(this, name, x, y, { scale })`. Read `docs/vfx-sheets.md` before writing any effect, and use a sheet instead of hand-drawn particles for these.
- UI feedback (tap glows, ripples, scale bounces, floating number text), vignettes, screen flashes and camera shake are code: tweens, graphics and camera effects. The two usually go together — a hit is the `hit-spark` sheet + hit stop + camera shake + a flash.
- Only if the user asked for a smooth vector, realistic/HD or painted look (or gave art in that style) draw world effects with Phaser particles/graphics instead. A style you picked yourself is not a reason to skip PixelVfx. If the user asks to leave the sheets out or to draw the effects yourself, do that.
- Size PixelVfx sprites only with the whole-number `scale` option, never `setDisplaySize`.
- This is Phaser 4: shader effects are filters (`obj.enableFilters().filters.internal.addGlow(...)`, `this.cameras.main.filters.external.addVignette(...)`). The Phaser 3 `preFX` / `postFX` / `setPipeline` / `setPostPipeline` / `createBitmapMask` APIs no longer exist and crash at runtime (`vite build` does not type-check, so the build still passes); `setTintFill` only logs an error — use `setTint(c).setTintMode(Phaser.TintModes.FILL)`. `group.children` (and `physics.world.bodies`) is a native `Set`: no `each` / `iterate` / `contains` / `entries` array — use `group.getChildren().forEach(...)`, `group.getLength()`, `group.contains(obj)`. Table in `docs/project-2d-rules.md`; when unsure an API exists, read `node_modules/phaser/skills/v3-to-v4-migration/SKILL.md` and `filters-and-postfx/SKILL.md`.
