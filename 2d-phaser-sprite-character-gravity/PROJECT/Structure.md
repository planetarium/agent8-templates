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

## `src/game/vfx/PixelVfx.ts`, `src/game/vfx/effects.ts`

Pixel art helper for world effects (hits, explosions, deaths, pickups, status, projectiles, weather; UI feedback, flashes and camera shake stay in tweens/graphics/camera code). It plays sheets found in the Agent8 asset library with `search_resources_vectordb_items`: each effect is a search result item (`url` of the png + `metadata` with size, pivot, loop/fps, `frameData`), copied as returned into `EFFECTS` in `effects.ts` (empty in the template). An item missing a required field throws an error naming it. `PixelVfx.preload(scene, [EFFECTS.x])` queues only those sheets (png + its frame JSON); `PixelVfx.play(scene, EFFECTS.x, x, y, { scale, depth, flip, follow, repeat, hitStop })` adds a sprite with origin at the sheet's pivot, whole-number scale and nearest filtering, loops looping sheets, destroys one-shots when they finish, and returns the sprite. Full-screen sheets (`rain`) cover the camera at any zoom with `setScrollFactor(0)`. `play()` loads a sheet that was not preloaded and starts it when it arrives; sheets are freed (`textures.remove`) when the scene that loaded them shuts down unless `{ keep: true }`; in development a console warning appears past 64 MB of loaded sheets. Impact frames for `hitStop` are read from the frame JSON (`meta.pixelfx.act.hits`) when it loads.

## `src/game/scenes/MainScene.ts`

Single scene. `preload()` loads the sprite sheet from `assets.json`. `create()` enables the physics debug graphic, sets world bounds to canvas size, paints a sky-blue background, builds a static green ground rectangle at the bottom, spawns one `SpriteCharacter`, registers a player–ground collider, and creates the cursor keys handler. `update()` forwards cursors to the character.

## `src/game/characters/SpriteCharacter.ts`

`Phaser.Physics.Arcade.Sprite` subclass. Registers five animations keyed by texture name (`-left`, `-right`, `-turn`, `-jump`, `-attack`) from fixed frame ranges of the `2dbasic` sheet. Handles `moveLeft` / `moveRight` / `stop` / `jump` (ground-checked) / `attack` (spawns a rectangular hitbox via `createAttackHitbox`, auto-destroys after 300ms, with a 500ms safety timer if `animationcomplete` never fires). `update(cursors)` maps Arrow keys to movement/jump and Space to attack, and ignores input while `isAttacking`.
