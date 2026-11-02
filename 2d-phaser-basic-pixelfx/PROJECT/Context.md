# Context — 2d-phaser-basic

## Project Overview

Phaser 3 scaffold mounted inside a React shell. `GameComponent` boots a `Phaser.Game` into a DOM container and `MainScene` sets up a sky-blue viewport, an Arcade Physics world, and a single static green ground rectangle. The game uses full-window sizing with `Phaser.Scale.RESIZE`, and `Game.ts` patches Phaser's `setDisplaySize` / `setScale` / Tween scale behavior so that sprite scaling stays consistent with the declared display size.

## Tech Stack

_Exact versions are in `package.json`._

- **Game engine**: `phaser` (Arcade Physics)
- **Pixel art VFX**: `pixelfx` (244 code-drawn effects: fire, explosions, magic, weather, UI, pickups...) via `src/game/pixelfx/PixelFxLayer.ts` — see `docs/pixelfx.md`
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
- For visual effects (explosions, hits, heals, pickups, weather, magic...), use `pixelfx` through `PixelFxLayer` before hand-rolling particles. Read `docs/pixelfx.md` for the pattern and effect ids; import only the effects you use.
- Canvas uses `Phaser.Scale.RESIZE`; read `this.cameras.main.width/height` or `this.sys.game.canvas.width/height` instead of hard-coding dimensions.
