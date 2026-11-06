# Context — 2d-phaser-basic

## Project Overview

Phaser 3 scaffold mounted inside a React shell. `GameComponent` boots a `Phaser.Game` into a DOM container and `MainScene` sets up a sky-blue viewport, an Arcade Physics world, and a single static green ground rectangle. The game uses full-window sizing with `Phaser.Scale.RESIZE`, and `Game.ts` patches Phaser's `setDisplaySize` / `setScale` / Tween scale behavior so that sprite scaling stays consistent with the declared display size.

## Tech Stack

_Exact versions are in `package.json`._

- **Game engine**: `phaser` (Arcade Physics)
- **World effects**: `src/game/vfx/PixelVfx.ts` — pixel art VFX sheets (hits, explosions, deaths, pickups, heal, status, projectiles, weather) from the Agent8 asset library, see `docs/vfx-sheets.md`
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
- World effects (hits, explosions, deaths, pickups, status, projectiles, weather) use `src/game/vfx/PixelVfx` — `PixelVfx.preload(this, [names])` + `PixelVfx.play(this, name, x, y, { scale })`. Read `docs/vfx-sheets.md` before writing any effect, and use a sheet instead of hand-drawn particles for these.
- UI feedback (tap glows, ripples, scale bounces, floating number text), vignettes, screen flashes and camera shake are code: tweens, graphics and camera effects. The two usually go together — a hit is the `hit-spark` sheet + hit stop + camera shake + a flash.
- Only if the user asked for a smooth vector, realistic/HD or painted look (or gave art in that style) draw world effects with Phaser particles/graphics instead. A style you picked yourself is not a reason to skip PixelVfx. If the user asks to leave the sheets out or to draw the effects yourself, do that.
- Size PixelVfx sprites only with the whole-number `scale` option, never `setDisplaySize`.
