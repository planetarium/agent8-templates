# Requirements — 2d-phaser-basic

## Coding Patterns

- Keep the React/Phaser boundary clean: React mounts the container in `GameComponent`, Phaser owns everything under `src/game/`. Do not drive game state from React.
- Add new scenes under `src/game/scenes/` and register them in the `scene: []` array inside `createGame` (`Game.ts`) — scene switching goes through `this.scene.start(key)`, not through React.
- Declare all texture/audio URLs in `src/assets.json` and load them in the owning scene's `preload()`; do not hard-code URLs inside `create()` / `update()`.
- Read canvas dimensions from `this.cameras.main` or `this.sys.game.canvas`; the game uses `Phaser.Scale.RESIZE`, so fixed pixel values drift.
- Put physics bodies through Arcade Physics (`this.physics.add.existing(...)` / `this.physics.add.sprite(...)`); `gravity.y` defaults to `2000`.

## Known Issues / Constraints

- The `game.events.once('ready', …)` block in `Game.ts` monkey-patches `Phaser.GameObjects.Sprite` / `Image` `setDisplaySize` + `setScale` and `Phaser.Tweens.TweenManager.add` globally. It is explicitly marked LLM-modification-prohibited. Sprites that call `setDisplaySize` first will have subsequent `setScale` / scale tweens interpreted relative to that base size, not the texture size — account for this when tuning visuals.
- `@agent8/gameserver` is in `dependencies` but unused; there is no networking, session, or room code.
- `lucide-react` is installed but nothing imports it.
- `tailwindcss` is configured but the only React surface is a full-viewport container, so utility classes have no target until UI is added.
- `assets.json` ships empty (`{"sprites": {}}`); `MainScene.preload()` is a no-op until entries are added.
- `MainScene.cursors` is declared but never assigned — input bindings (e.g. `this.input.keyboard.createCursorKeys()`) still need to be wired.
- `index.html` posts `GAME_SIZE_RESPONSE` to `window.parent` for embed hosts; if you change the mount size, the reported dimensions follow the document, not the Phaser canvas.
