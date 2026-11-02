# Context — 2d-phaser-sprite-character-gravity

## Project Overview

Phaser 3 scaffold running inside a React shell. A single `MainScene` boots Arcade Physics with downward gravity, spawns a static ground rectangle, and places a gravity-bound `SpriteCharacter` (extends `Phaser.Physics.Arcade.Sprite`) that handles accelerated left/right movement, a jump with coyote time and an input buffer, and a timed melee attack with a transient hitbox. Sprite sheet is loaded from a URL declared in `src/assets.json`.

## Tech Stack

_Exact versions are in `package.json`._

- **Game engine**: Phaser 3 (Arcade Physics)
- **Shell**: React, ReactDOM
- **Icons**: `lucide-react`
- **Multiplayer (unwired)**: `@agent8/gameserver`
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- The game runs entirely inside Phaser. React only mounts a `<div id="phaser-game">` and calls `createGame` once per mount; `gameInstanceRef` guards against double-init and disposes via `destroy(true)` on unmount.
- `src/game/Game.ts` contains a `// CRITICAL: DO NOT MODIFY` block that monkey-patches `Phaser.GameObjects.Sprite/Image` `setDisplaySize` / `setScale` and `Phaser.Tweens.TweenManager.add`. Scale values are reinterpreted against a cached `baseDisplayWidth/Height` — do not remove or edit this block.
- Arcade gravity is `{ x: 0, y: 2000 }`. Ground state is `body.touching.down || body.blocked.down` (`SpriteCharacter.isGrounded()`); any new platform must be an Arcade static/dynamic body added via `physics.add.collider`.
- Movement feel is time-based: `SpriteCharacter.update(cursors, delta)` takes the scene's `delta` (ms). Jump fires on a fresh press (`JustDown`, buffered `JUMP_BUFFER_TIME` = 0.1s) while within `COYOTE_TIME` (0.12s) of last being grounded; holding the key does not re-jump. Horizontal speed ramps by `GROUND_ACCEL`/`GROUND_DECEL`/`AIR_ACCEL`/`AIR_DECEL` (px/s²) toward `MOVE_SPEED` — never assign `setVelocityX(±speed)` directly, and never count frames for timing.
- Sprite sheet URL, `frameWidth`, and `frameHeight` come from `src/assets.json` under `sprites["2dbasic"]`. Animation frame ranges in `SpriteCharacter` are tied to that specific sheet layout.
- Canvas uses `Phaser.Scale.RESIZE` at `window.innerWidth/innerHeight`; world bounds are set once in `create()` and do not auto-update on window resize.
