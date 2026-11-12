# Status — 2d-phaser-basic

## Implemented

- React 18 shell (`main.tsx` → `App.tsx` → `GameComponent`) mounting a full-viewport Phaser canvas
- `Phaser.Game` lifecycle with `StrictMode`-safe single-instance guard and `destroy(true)` cleanup
- `createGame` config: Arcade Physics (`gravity.y: 2000`), `Phaser.Scale.RESIZE`, `autoCenter: CENTER_BOTH`, single `MainScene`
- Global sprite/tween scaling patch in `Game.ts` (`setDisplaySize` / `setScale` / `TweenManager.add` override, keyed to `baseDisplayWidth`/`baseDisplayHeight`)
- `MainScene`: sky-blue background, physics world bounds matching canvas, static green ground rectangle with Arcade body
- `assets.json` manifest scaffold consumed by `MainScene`
- Embed-host size reporting via `postMessage` in `index.html`

## Installed but not wired

- `@agent8/gameserver` — no networking / session code
- `lucide-react` — no imports
- `tailwindcss` — directives loaded via `index.css`, no utility usage in markup
- `MainScene.cursors` field — declared but never initialized; no input handling
- `MainScene.preload()` / `update()` — empty bodies
- `assets.json.sprites` — empty map, no textures loaded
