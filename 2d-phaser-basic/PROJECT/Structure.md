# Structure — 2d-phaser-basic

## `src/main.tsx`

Entry point. Mounts `<App />` into `#root` with React 18 `createRoot` under `StrictMode`. Imports `index.css`.

## `src/App.tsx`

Root component. Wraps `<GameComponent />` in a full-viewport `.app` container.

## `src/App.css`, `src/index.css`

Component/global styles. `App.css` pins `html`/`body`/`.app` to `100vw` / `100vh` with `overflow: hidden`. `index.css` holds the Tailwind directives.

## `src/assets.json`

Asset manifest (`{ "sprites": {} }`). Consumed by `MainScene` — populate entries here and load them in `preload()`.

## `src/components/GameComponent.tsx`

React host for Phaser. Renders a `#phaser-game` div (100% × 100vh), calls `createGame(containerId)` in a `useEffect` guarded by a ref, and tears the game down with `game.destroy(true)` on unmount.

## `src/game/Game.ts`

Exports `createGame(parent)`. Builds the `Phaser.Types.Core.GameConfig`:

- `type: Phaser.AUTO`, full-window `width`/`height`, `parent` set to the React container id
- `physics.default: 'arcade'` with `gravity.y: 2000` and `debug: false`
- `scene: [MainScene]`
- `scale.mode: Phaser.Scale.RESIZE`, `autoCenter: Phaser.Scale.CENTER_BOTH`

Also installs a `game.events.once('ready', …)` patch that overrides `Sprite`/`Image` `setDisplaySize` + `setScale` and `TweenManager.add` so `scale`/`scaleX`/`scaleY` operate relative to a stored `baseDisplayWidth` / `baseDisplayHeight`. Marked `CRITICAL — LLM/AI MODIFICATION PROHIBITED`.

## `src/game/scenes/MainScene.ts`

Sole scene (`key: 'MainScene'`). In `create()` it sets physics world bounds to the canvas size, paints a `#87CEEB` (sky blue) background, and adds a `60px` tall green (`0x00ff00`) rectangle across the bottom with a static Arcade body. `preload()` and `update()` are empty. Declares private `cursors` and `ground` fields; `cursors` is unused until input wiring is added.

## `index.html`

Vite HTML shell. Serves `/src/main.tsx`, renders an inline `Loading` spinner inside `#root` for pre-mount, and posts `GAME_SIZE_RESPONSE` messages to `window.parent` on `load` / `resize` / `REQUEST_GAME_SIZE` for embedding hosts.

## `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`, `postcss.config.js`

Standard Vite + React + TypeScript + Tailwind toolchain configuration.
