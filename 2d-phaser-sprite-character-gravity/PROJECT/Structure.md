# Structure — 2d-phaser-sprite-character-gravity

## `src/main.tsx`, `src/App.tsx`

Entry point and root component. `App` renders `GameComponent` inside a full-viewport `.app` container.

## `src/App.css`, `src/index.css`

Component styles and global base. `index.css` pulls in Tailwind directives; `App.css` locks `body/html` to no-scroll full-viewport.

## `src/assets.json`

Asset manifest — sprite sheet URL and `frameWidth`/`frameHeight` metadata for the `2dbasic` character.

## `src/components/GameComponent.tsx`

React host for Phaser. Renders `<div id="phaser-game">`, calls `createGame(containerId)` once via `useEffect`, and destroys the game instance on unmount. Guarded by a `gameInstanceRef` so StrictMode double-invoke does not create two games.

## `src/game/Game.ts`

Exports `createGame(parent)`. Builds the `Phaser.Game` config: `Phaser.AUTO` renderer, full-window size, Arcade Physics with `gravity.y = 2000`, `Phaser.Scale.RESIZE` + `CENTER_BOTH`, and `MainScene` as the only scene. Contains a marked critical section that monkey-patches `Sprite/Image.setDisplaySize`, `setScale`, and `TweenManager.add` to preserve a base display size under scaling.

## `src/game/scenes/MainScene.ts`

Single scene. `preload()` loads the sprite sheet from `assets.json`. `create()` enables the physics debug graphic, sets world bounds to canvas size, paints a sky-blue background, builds a static green ground rectangle at the bottom, spawns one `SpriteCharacter`, registers a player–ground collider, and creates the cursor keys handler. `update()` forwards cursors to the character.

## `src/game/characters/SpriteCharacter.ts`

`Phaser.Physics.Arcade.Sprite` subclass. Registers five animations keyed by texture name (`-left`, `-right`, `-turn`, `-jump`, `-attack`) from fixed frame ranges of the `2dbasic` sheet. Handles `moveLeft` / `moveRight` / `stop` / `jump` (ground-checked) / `attack` (spawns a rectangular hitbox via `createAttackHitbox`, auto-destroys after 300ms, with a 500ms safety timer if `animationcomplete` never fires). `update(cursors)` maps Arrow keys to movement/jump and Space to attack, and ignores input while `isAttacking`.
